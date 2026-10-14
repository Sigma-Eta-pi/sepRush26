import { expect, it } from "vitest";
import {
  planRosterProvisioning,
  type ExistingRosterAccount,
} from "../server/process/roster-provisioning";
const account: ExistingRosterAccount = {
  id: "existing",
  name: "Existing Member",
  email: "member@ucsb.edu",
  role: "active",
  archived: false,
  hasProfile: true,
};
const member = {
  name: "Existing Member",
  email: "member@ucsb.edu",
  role: "active",
};
it("preserves exact-email account IDs, names and existing profiles without changing roles", () => {
  const plan = planRosterProvisioning(
    {
      members: [
        { ...member, name: "New display name", email: " MEMBER@UCSB.EDU " },
      ],
    },
    [account]
  );
  expect(plan.members[0]).toMatchObject({
    id: "existing",
    action: "keep",
    createProfile: false,
    role: "active",
  });
  expect(account.name).toBe("Existing Member");
});
it("requires an explicit role and exact school domain; never aliases the school emails", () => {
  expect(() =>
    planRosterProvisioning(
      { members: [{ name: "Name", email: "new@ucsb.edu" }] },
      []
    )
  ).toThrow();
  expect(() =>
    planRosterProvisioning(
      { members: [{ ...member, email: "member@gmail.com" }] },
      []
    )
  ).toThrow();
  expect(() =>
    planRosterProvisioning(
      { members: [{ ...member, email: "member@umail.ucsb.edu" }] },
      [account]
    )
  ).toThrow("same-name");
});
it("rejects duplicate/ambiguous identities and explicit IDs pointing at another email", () => {
  expect(() =>
    planRosterProvisioning({ members: [member, member] }, [])
  ).toThrow("Duplicate");
  expect(() =>
    planRosterProvisioning({ members: [member] }, [
      account,
      { ...account, id: "duplicate" },
    ])
  ).toThrow("Ambiguous");
  expect(() =>
    planRosterProvisioning(
      { members: [{ ...member, existingUserId: "missing" }] },
      [account]
    )
  ).toThrow("Unknown");
  expect(() =>
    planRosterProvisioning(
      {
        members: [
          { ...member, email: "changed@ucsb.edu", existingUserId: account.id },
        ],
      },
      [account]
    )
  ).toThrow("Email changes");
});
it("requires acknowledgement for any existing role change, including legacy member roles", () => {
  expect(() =>
    planRosterProvisioning({ members: [member] }, [
      { ...account, role: "member" },
    ])
  ).toThrow("approveRoleChange");
  expect(
    planRosterProvisioning(
      { members: [{ ...member, approveRoleChange: true }] },
      [{ ...account, role: "member" }]
    ).members[0].action
  ).toBe("change-role");
});
it("requires explicit privileged role acknowledgement for promotion and bootstrap", () => {
  const privileged = {
    ...member,
    role: "pledge_master",
    approveRoleChange: true,
  };
  expect(() =>
    planRosterProvisioning({ members: [privileged] }, [account])
  ).toThrow("approvePrivilegedRole");
  expect(() =>
    planRosterProvisioning({ members: [{ ...member, role: "admin" }] }, [])
  ).toThrow("approvePrivilegedRole");
  expect(
    planRosterProvisioning(
      { members: [{ ...privileged, approvePrivilegedRole: true }] },
      [account]
    ).members[0]
  ).toMatchObject({ id: account.id, action: "change-role" });
});
it("never restores archived accounts or deletes unlisted accounts", () => {
  expect(() =>
    planRosterProvisioning({ members: [member] }, [
      { ...account, archived: true },
    ])
  ).toThrow("archived");
  const plan = planRosterProvisioning({ members: [member] }, [
    account,
    { ...account, id: "unlisted", email: "other@ucsb.edu" },
  ]);
  expect(plan.summary.unlistedAccountsUntouched).toBe(1);
  expect(plan.members).toHaveLength(1);
});
it("fingerprints are stable for member order and change with reviewed state", () => {
  const second = {
    name: "New Pledge",
    email: "new@umail.ucsb.edu",
    role: "pledge",
  };
  const a = planRosterProvisioning({ members: [member, second] }, [account]);
  const b = planRosterProvisioning({ members: [second, member] }, [account]);
  expect(a.fingerprint).toBe(b.fingerprint);
  expect(
    planRosterProvisioning({ members: [member, second] }, [
      { ...account, hasProfile: false },
    ]).fingerprint
  ).not.toBe(a.fingerprint);
});
