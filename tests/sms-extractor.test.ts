import { afterEach, expect, it, vi } from "vitest";
import { extractText } from "../server/sms/extractor";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("requests bounded schema-constrained extraction with local incident-date context", async () => {
  vi.stubEnv("ANTHROPIC_API_KEY", "fake-test-key");
  const fetcher = vi
    .fn()
    .mockResolvedValue(
      new Response(
        JSON.stringify({
          stop_reason: "end_turn",
          content: [
            {
              type: "text",
              text: JSON.stringify({
                intent: "strike",
                pledgeName: "Alex Example",
                reason: "Late",
                date: "2026-10-05",
                points: null,
              }),
            },
          ],
        }),
        { status: 200 }
      )
    );
  vi.stubGlobal("fetch", fetcher);
  expect(
    (
      await extractText(
        "Give Alex Example a strike for being late today.",
        "2026-10-06T01:00:00Z",
        "America/Los_Angeles"
      )
    ).date
  ).toBe("2026-10-05");
  const sent = JSON.parse(fetcher.mock.calls[0][1].body);
  expect(sent.model).toBe("claude-haiku-4-5-20251001");
  expect(sent.max_tokens).toBe(700);
  expect(sent.output_config.format.type).toBe("json_schema");
  expect(sent.tools).toBeUndefined();
  expect(JSON.parse(sent.messages[0].content).receivedLocalDate).toBe(
    "2026-10-05"
  );
});
it("rejects truncated model responses instead of creating a partial report", async () => {
  vi.stubEnv("ANTHROPIC_API_KEY", "fake-test-key");
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ stop_reason: "max_tokens", content: [] }),
          { status: 200 }
        )
      )
  );
  await expect(
    extractText("Report", "2026-10-06T18:00:00Z", "America/Los_Angeles")
  ).rejects.toThrow("Incomplete");
});
