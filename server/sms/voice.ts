import { createHmac, timingSafeEqual, createHash } from "node:crypto";
import { dkimVerify } from "mailauth";
import { simpleParser } from "mailparser";
import { fail } from "../process/engine.js";
import { normalizePhone, type IncomingText } from "./service.js";

export function verifyRelay(
  body: unknown,
  secret: string,
  now = Date.now()
): Record<string, unknown> {
  const b = body as any;
  if (!secret || secret.length < 32) fail("Text relay is not configured.", 503);
  if (
    !b ||
    typeof b.payload !== "string" ||
    b.payload.length > 400000 ||
    typeof b.timestamp !== "string" ||
    !/^\d{13}$/.test(b.timestamp) ||
    Math.abs(now - Number(b.timestamp)) > 300000 ||
    !/^[a-f0-9]{64}$/.test(b.signature || "")
  )
    fail("Invalid text relay authentication.", 401);
  const expected = createHmac("sha256", secret)
    .update(b.timestamp + "." + b.payload)
    .digest();
  if (!timingSafeEqual(expected, Buffer.from(b.signature, "hex")))
    fail("Invalid text relay authentication.", 401);
  try {
    return JSON.parse(b.payload);
  } catch {
    return fail("Invalid relay payload.");
  }
}
export async function readVoiceEmail(
  payload: Record<string, unknown>,
  config: { mailbox: string; chapterPhone: string }
): Promise<IncomingText> {
  if (
    payload.mailbox !== config.mailbox ||
    typeof payload.raw !== "string" ||
    payload.raw.length > 350000 ||
    !/^[A-Za-z0-9_=-]+$/.test(payload.raw) ||
    typeof payload.receivedAt !== "string"
  )
    fail("Invalid forwarded message.");
  const raw = Buffer.from(payload.raw, "base64url");
  const result = await dkimVerify(raw);
  const parsed = await simpleParser(raw, {
    skipHtmlToText: true,
    skipTextToHtml: true,
  });
  // Inspect signed headers, not a caller-supplied Authentication-Results header.
  const signature = result.results.find(r => {
    const headers =
      r.signingHeaders?.keys
        .toLowerCase()
        .split(":")
        .map(h => h.trim()) || [];
    return (
      r.status.result === "pass" &&
      !r.status.underSized &&
      r.signatureTimeValid !== false &&
      ["google.com", "voice.google.com", "txt.voice.google.com"].includes(
        r.signingDomain || ""
      ) &&
      ["from", "to", "subject", "message-id", "content-type"].every(h =>
        headers.includes(h)
      )
    );
  });
  if (!signature)
    fail("Google Voice message authentication could not be verified.", 422);
  for (const key of ["from", "to", "subject", "message-id", "content-type"]) {
    if (parsed.headerLines.filter(h => h.key === key).length !== 1)
      fail("Ambiguous email headers.", 422);
  }
  const from = parsed.from?.value;
  if (
    from?.length !== 1 ||
    !/^[^@]+@txt\.voice\.google\.com$/i.test(from[0].address || "")
  )
    fail("Not a supported Google Voice notification.", 422);
  const recipients = (
    Array.isArray(parsed.to) ? parsed.to : [parsed.to]
  ).flatMap(x => x?.value || []);
  if (
    !recipients.some(
      r => r.address?.toLowerCase() === config.mailbox.toLowerCase()
    ) ||
    !parsed.messageId
  )
    fail("Wrong Voice mailbox.", 422);
  // Voice address formats are not a stable API. Accept exactly one non-chapter
  // US/CA number from the authenticated From address; never ask AI to identify the sender.
  const tokens =
    from[0].address!.split("@")[0].match(/(?<!\d)\d{10,11}(?!\d)/g) || [];
  const phones = [
    ...new Set(
      tokens.flatMap(t => {
        try {
          return [normalizePhone(t)];
        } catch {
          return [];
        }
      })
    ),
  ].filter(p => p !== config.chapterPhone);
  const text = parsed.text?.trim();
  if (!text || text.length > 6000 || parsed.attachments.length)
    fail(
      "Only plain-text Voice reports up to 6000 characters are supported.",
      422
    );
  return {
    id: createHash("sha256")
      .update(config.mailbox + "\n" + parsed.messageId)
      .digest("hex"),
    phone: phones.length === 1 ? phones[0] : null,
    text,
    receivedAt: payload.receivedAt,
  };
}
