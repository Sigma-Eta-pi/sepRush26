import { it, expect } from "vitest";
import { validateGoogleIdentity, schoolEmail } from "../server/google-identity";
const valid: any = {
  sub: "google-subject",
  email: "member@ucsb.edu",
  email_verified: true,
  hd: "ucsb.edu",
  nonce: "nonce",
};
it("accepts both exact UCSB school domains", () => {
  expect(validateGoogleIdentity(valid, "nonce").email).toBe("member@ucsb.edu");
  expect(
    validateGoogleIdentity(
      { ...valid, email: "member@umail.ucsb.edu", hd: "umail.ucsb.edu" },
      "nonce"
    ).sub
  ).toBe("google-subject");
});
it("rejects lookalike domains, personal Google accounts, and unverified email", () => {
  for (const email of [
    "a@gmail.com",
    "a@ucsb.edu.evil.com",
    "a@fakeucsb.edu",
    "a@ucsbsep.org",
  ]) {
    expect(schoolEmail(email)).toBe(false);
    expect(() =>
      validateGoogleIdentity({ ...valid, email }, "nonce")
    ).toThrow();
  }
  expect(() =>
    validateGoogleIdentity({ ...valid, email_verified: false }, "nonce")
  ).toThrow();
  expect(() =>
    validateGoogleIdentity({ ...valid, hd: undefined }, "nonce")
  ).toThrow();
});
it("rejects mismatched or missing login nonces", () => {
  expect(() => validateGoogleIdentity(valid, "other")).toThrow("expired");
  expect(() => validateGoogleIdentity(valid, "")).toThrow("expired");
});
it("accepts only the chapter executive exception with its verified Workspace domain", () => {
  const executive = { ...valid, email: 'exec@ucsbsep.org', hd: 'ucsbsep.org' };
  expect(validateGoogleIdentity(executive, 'nonce').email).toBe('exec@ucsbsep.org');
  for (const patch of [
    { email: 'other@ucsbsep.org' }, { email: 'exec@ucsbsep.com' },
    { email: 'exec@ucsbsep.org.evil.com' }, { hd: 'ucsb.edu' },
    { hd: undefined }, { email_verified: false },
  ]) expect(() => validateGoogleIdentity({ ...executive, ...patch }, 'nonce')).toThrow();
  expect(() => validateGoogleIdentity(executive, 'wrong')).toThrow('expired');
});
