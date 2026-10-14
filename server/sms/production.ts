import type { Express } from "express";
import { sql } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { roster, readProcess } from "../routes/process.js";
import { createSmsService, normalizePhone } from "./service.js";
import { extractText } from "./extractor.js";
import { readVoiceEmail } from "./voice.js";
import { smsRouter } from "./router.js";
export function installProductionSms(app: Express) {
  const configured = () =>
    !!process.env.ANTHROPIC_API_KEY &&
    (process.env.SMS_RELAY_SECRET?.length || 0) >= 32 &&
    /^[^@\s]+@gmail\.com$/.test(process.env.SMS_GMAIL_ADDRESS || "") &&
    /^\+1\d{10}$/.test(process.env.SMS_VOICE_NUMBER || "");
  const limit = Number(process.env.SMS_DAILY_AI_LIMIT || 100);
  const service = createSmsService({
    store: {
      read: readProcess,
      compareAndSwap: async (version, doc) =>
        (
          await sql`UPDATE member_process_state SET data=${JSON.stringify(doc)}::jsonb, version=version+1 WHERE id='current' AND version=${version} RETURNING version`
        ).length > 0,
    },
    users: roster,
    extract: extractText,
    dailyLimit:
      Number.isInteger(limit) && limit > 0 && limit <= 1000 ? limit : 100,
  });
  app.use(
    "/api/sms",
    smsRouter({
      service,
      session: requireAuth,
      identity: req => req.user?.id,
      enabled: () => process.env.SMS_ENABLED === "true",
      configured,
      secret: () => process.env.SMS_RELAY_SECRET || "",
      decode: payload =>
        readVoiceEmail(payload, {
          mailbox: process.env.SMS_GMAIL_ADDRESS!,
          chapterPhone: normalizePhone(process.env.SMS_VOICE_NUMBER!),
        }),
    })
  );
}
