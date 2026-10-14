import { createHash } from "node:crypto";
import { z } from "zod";
import { allowedLoginEmail } from "../google-identity.js";

const role = z.enum([
  "active",
  "exec",
  "admin",
  "pnm",
  "pledge",
  "pledge_master",
]);
const schema = z
  .object({
    members: z
      .array(
        z
          .object({
            name: z.string().trim().min(1).max(150),
            email: z
              .string()
              .trim()
              .toLowerCase()
              .refine(allowedLoginEmail, "Use a UCSB Google email or exec@ucsbsep.org"),
            role,
            existingUserId: z.string().min(1).max(160).optional(),
            approveRoleChange: z.literal(true).optional(),
            approvePrivilegedRole: z.literal(true).optional(),
          })
          .strict()
      )
      .min(1)
      .max(500),
  })
  .strict();
export type ExistingRosterAccount = {
  id: string;
  email: string;
  role: string;
  name: string | null;
  hasProfile: boolean;
  archived: boolean;
};
export type ProvisionedMember = {
  name: string;
  email: string;
  role: z.infer<typeof role>;
  id: string | null;
  action: "create" | "keep" | "change-role";
  previousRole: string | null;
  previousEmail: string | null;
  createProfile: boolean;
};
const nameKey = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

export function planRosterProvisioning(
  input: unknown,
  existing: ExistingRosterAccount[]
) {
  const parsed = schema.parse(input);
  const usedEmails = new Set<string>(),
    usedIds = new Set<string>();
  const members: ProvisionedMember[] = parsed.members
    .map((member): ProvisionedMember => {
      if (usedEmails.has(member.email))
        throw new Error(`Duplicate roster email: ${member.email}`);
      usedEmails.add(member.email);
      const emailMatches = existing.filter(
        u => u.email.toLowerCase() === member.email
      );
      if (emailMatches.length > 1)
        throw new Error(
          `Ambiguous existing email: ${member.email}; resolve duplicate accounts first.`
        );
      const account = member.existingUserId
        ? existing.find(u => u.id === member.existingUserId)
        : emailMatches[0];
      if (member.existingUserId && !account)
        throw new Error(`Unknown existingUserId for ${member.email}.`);
      if (account && account.email.toLowerCase() !== member.email)
        throw new Error(
          `Email changes are not allowed by this tool (${member.email}). Correct the existing account identity separately, then rerun.`
        );
      if (
        !account &&
        existing.some(u => u.name && nameKey(u.name) === nameKey(member.name))
      )
        throw new Error(
          `A same-name account already exists for ${member.name}. Verify its exact Google email; this tool never merges by name.`
        );
      if (account?.archived)
        throw new Error(
          `Account ${member.email} is archived. Restore it explicitly before provisioning.`
        );
      if (account && usedIds.has(account.id))
        throw new Error(`Account ID appears more than once: ${account.id}`);
      if (account) usedIds.add(account.id);
      if (account && account.role !== member.role && !member.approveRoleChange)
        throw new Error(
          `Role change ${account.role} -> ${member.role} for ${member.email} requires approveRoleChange: true.`
        );
      if (
        ["admin", "exec", "pledge_master"].includes(member.role) &&
        (!account || account.role !== member.role) &&
        !member.approvePrivilegedRole
      )
        throw new Error(
          `Privileged role ${member.role} for ${member.email} requires approvePrivilegedRole: true.`
        );
      return {
        name: member.name,
        email: member.email,
        role: member.role,
        id: account?.id || null,
        action: !account
          ? "create"
          : account.role === member.role
            ? "keep"
            : "change-role",
        previousRole: account?.role || null,
        previousEmail: account?.email || null,
        createProfile: !account?.hasProfile,
      };
    })
    .sort((a, b) => a.email.localeCompare(b.email));
  const plan = {
    members,
    summary: {
      create: members.filter(m => m.action === "create").length,
      changeRole: members.filter(m => m.action === "change-role").length,
      keep: members.filter(m => m.action === "keep").length,
      createProfile: members.filter(m => m.createProfile).length,
      unlistedAccountsUntouched: existing.filter(
        u => !members.some(m => m.id === u.id)
      ).length,
    },
  };
  return {
    ...plan,
    fingerprint: createHash("sha256")
      .update(JSON.stringify(plan))
      .digest("hex"),
  };
}
