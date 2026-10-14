import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { createHmac } from "node:crypto";
import { expect, it, vi } from "vitest";
import { verifyRelay } from "../server/sms/voice";
function job(responseCode = 200) {
  const secret = "test-only-secret".repeat(4),
    labels = new Map<string, string[]>(),
    posts: any[] = [],
    entries = ["first"];
  const p: Record<string, string> = {
    SEP_ENDPOINT: "https://sep.example/api/sms/ingest",
    SEP_RELAY_SECRET: secret,
    SEP_START_DATE: "2026/10/05",
  };
  const fetcher = vi.fn((_url, request) => {
    posts.push(verifyRelay(JSON.parse(request.payload), secret));
    return {
      getResponseCode: () => responseCode,
      getContentText: () => JSON.stringify({ ok: true, retry: false }),
    };
  });
  const context = createContext({
    Date,
    JSON,
    Number,
    String,
    console: { warn: vi.fn() },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperties: () => p,
        setProperty: (key: string, value: string) => {
          p[key] = value;
        },
      }),
    },
    LockService: {
      getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }),
    },
    Utilities: {
      Charset: { UTF_8: "utf-8" },
      computeHmacSha256Signature: (value: string, key: string) =>
        Array.from(createHmac("sha256", key).update(value).digest()),
    },
    UrlFetchApp: { fetch: fetcher },
    Gmail: {
      Users: {
        getProfile: () => ({ emailAddress: "chapter@gmail.com" }),
        Labels: {
          list: () => ({
            labels: ["sep-sms-imported", "sep-sms-attention"].map(name => ({
              name,
              id: name,
            })),
          }),
        },
        Messages: {
          list: () => ({
            messages: entries
              .filter(id => !labels.has(id))
              .map(id => ({ id, threadId: "same-thread" })),
          }),
          get: (_user: string, id: string) => ({
            raw: Buffer.from("raw-" + id).toString("base64url"),
            internalDate: String(Date.now()),
          }),
          modify: (body: any, _user: string, id: string) =>
            labels.set(id, body.addLabelIds),
        },
      },
    },
  });
  runInContext(readFileSync("scripts/google-voice/Code.gs", "utf8"), context);
  return {
    run: () => runInContext("pollSepTexts()", context),
    labels,
    entries,
    posts,
    fetcher,
  };
}
it("signs real relay payloads and handles each message independently within a thread", () => {
  const j = job();
  j.run();
  expect(j.posts).toHaveLength(1);
  expect(j.posts[0].mailbox).toBe("chapter@gmail.com");
  j.run();
  expect(j.posts).toHaveLength(1);
  j.entries.push("second");
  j.run();
  expect(j.posts).toHaveLength(2);
  expect(j.labels.size).toBe(2);
});
it("preserves messages for retry when SEP is unavailable", () => {
  const j = job(503);
  expect(j.run).toThrow("remain queued");
  expect(j.labels.size).toBe(0);
});
it("quarantines unsupported notifications for visible Gmail review", () => {
  const j = job(422);
  j.run();
  expect(j.labels.get("first")).toEqual(["sep-sms-attention"]);
});
