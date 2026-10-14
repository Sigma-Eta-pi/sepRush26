import type { TokenPayload } from "google-auth-library";
export const schoolEmail = (email: unknown): email is string =>
  typeof email === "string" &&
  /^[^\s@]+@(ucsb\.edu|umail\.ucsb\.edu)$/i.test(email);
// The chapter-owned executive login is the only non-UCSB exception.
// Once rostered, this account is promoted to chapter admin when it signs in.
export const chapterExecutiveEmail = (email: unknown): email is string =>
  typeof email === "string" && email.toLowerCase() === "exec@ucsbsep.org";
export const allowedLoginEmail = (email: unknown): email is string =>
  schoolEmail(email) || chapterExecutiveEmail(email);
export function validateGoogleIdentity(
  payload: TokenPayload | undefined,
  nonce: string
) {
  if (
    !payload?.sub ||
    !payload.email_verified ||
    !allowedLoginEmail(payload.email) ||
    !(chapterExecutiveEmail(payload.email)
      ? payload.hd === "ucsbsep.org"
      : ["ucsb.edu", "umail.ucsb.edu"].includes(payload.hd || ""))
  )
    throw new Error(
      "Use your UCSB Google account or the chapter executive Google account."
    );
  if (!nonce || (payload as TokenPayload & { nonce?: string }).nonce !== nonce)
    throw new Error("This sign-in expired. Refresh and try again.");
  return { sub: payload.sub, email: payload.email.toLowerCase() };
}
