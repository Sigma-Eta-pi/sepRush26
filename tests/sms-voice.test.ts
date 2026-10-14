import { beforeAll, expect, it, vi } from "vitest";
import { generateKeyPairSync } from "node:crypto";
const dns = vi.hoisted(() => ({ key: "" }));
vi.mock("mailauth", async original => {
  const actual = await original<typeof import("mailauth")>();
  return {
    ...actual,
    dkimVerify: (raw: Buffer) =>
      actual.dkimVerify(raw, { resolver: async () => [[dns.key]] }),
  };
});
import { dkimSign } from "mailauth";
import { readVoiceEmail } from "../server/sms/voice";
let privateKey: string;
beforeAll(() => {
  const keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
  privateKey = keys.privateKey
    .export({ format: "pem", type: "pkcs8" })
    .toString();
  dns.key =
    "v=DKIM1; k=rsa; p=" +
    keys.publicKey.export({ format: "der", type: "spki" }).toString("base64");
});
async function mail(domain = "google.com") {
  const body = [
    "From: Google Voice <18055550999.18055550101.random@txt.voice.google.com>",
    "To: chapter@gmail.com",
    "Subject: New text message",
    "Message-ID: <one@voice.google.com>",
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    "Give Alex Example a strike for being late today.",
    "",
  ].join("\r\n");
  const signed = await dkimSign(body, {
    signatureData: [
      {
        signingDomain: domain,
        selector: "test",
        privateKey,
        headerList: "from:to:subject:message-id:mime-version:content-type",
      },
    ],
  });
  return signed.signatures + body;
}
const config = { mailbox: "chapter@gmail.com", chapterPhone: "+18055550999" };
const payload = (raw: string) => ({
  mailbox: config.mailbox,
  raw: Buffer.from(raw).toString("base64url"),
  receivedAt: "2026-10-06T20:00:00Z",
});
it("verifies a cryptographic Google-domain signature before parsing a sender number", async () => {
  const message = await readVoiceEmail(payload(await mail()), config);
  expect(message.phone).toBe("+18055550101");
  expect(message.text).toContain("Alex Example");
  expect(message.id).toHaveLength(64);
});
it("rejects forged authentication headers, other signing domains and modified bodies", async () => {
  await expect(
    readVoiceEmail(
      payload(
        "Authentication-Results: mx.google.com; dkim=pass\r\nFrom: Google Voice <x@txt.voice.google.com>\r\n\r\nSpoof"
      ),
      config
    )
  ).rejects.toThrow("authentication");
  await expect(
    readVoiceEmail(payload(await mail("attacker.example")), config)
  ).rejects.toThrow("authentication");
  const altered = (await mail()).replace("late today", "absent yesterday");
  await expect(readVoiceEmail(payload(altered), config)).rejects.toThrow(
    "authentication"
  );
});
it("rejects a different receiving mailbox and duplicate identity headers", async () => {
  await expect(
    readVoiceEmail(
      { ...payload(await mail()), mailbox: "other@gmail.com" },
      config
    )
  ).rejects.toThrow("Invalid");
  const duplicate = (await mail()).replace(
    "To: chapter@gmail.com",
    "To: attacker@gmail.com\r\nTo: chapter@gmail.com"
  );
  await expect(readVoiceEmail(payload(duplicate), config)).rejects.toThrow();
});
