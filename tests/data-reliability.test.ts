import { describe, expect, it } from "vitest";
import { applyAction, snapshot } from "../server/process/engine";
import { sampleWorkspace } from "../server/process/sample";
import { isCalendarDate, isInstant } from "../server/process/dates";
import {
  enrichMemberProfiles,
  type ImportedMember,
} from "../server/process/member-directory";
import { mutateProcess } from "../server/process/store";

function fixture() {
  const { users, doc } = sampleWorkspace();
  return { users, doc, master: users[0], pledge: users[57], active: users[2] };
}

describe("reliable identities, dates and progress", () => {
  it("prefers a unique matching email over an earlier same-name profile", () => {
    const { pledge } = fixture();
    const wrong = {
      ...pledge,
      email: "different@ucsb.edu",
      phone: "wrong",
    } as ImportedMember;
    const right = {
      ...pledge,
      name: "Updated Name",
      phone: "correct",
    } as ImportedMember;
    expect(enrichMemberProfiles([pledge], [wrong, right])[0].phone).toBe(
      "correct"
    );
    expect(enrichMemberProfiles([pledge], [right, wrong])[0].phone).toBe(
      "correct"
    );
  });

  it("does not silently import ambiguous matching identities", () => {
    const { pledge } = fixture();
    const one = { ...pledge, phone: "one" } as ImportedMember;
    const two = { ...pledge, phone: "two" } as ImportedMember;
    expect(enrichMemberProfiles([pledge], [one, two])[0].phone).toBe(
      pledge.phone
    );
    one.email = "one@ucsb.edu";
    two.email = "two@ucsb.edu";
    expect(enrichMemberProfiles([pledge], [one, two])[0].phone).toBe(
      pledge.phone
    );
  });

  it("rejects rolled-over dates and ambiguous timestamp inputs", () => {
    expect(isCalendarDate("2028-02-29")).toBe(true);
    for (const value of [
      "2026-02-29",
      "2026-02-30",
      "10/05/2026",
      "2026-13-01",
    ])
      expect(isCalendarDate(value)).toBe(false);
    for (const value of [
      "2026-10-05T17:00",
      "2026-02-30T17:00:00Z",
      "2026-10-05T24:00:00Z",
    ])
      expect(isInstant(value)).toBe(false);
    // Both fall-back instants are valid and distinct; the client must specify which.
    expect(isInstant("2026-11-01T01:30:00-07:00")).toBe(true);
    expect(isInstant("2026-11-01T01:30:00-08:00")).toBe(true);
  });

  it("rejects ambiguous event times before saving anything", () => {
    const f = fixture(),
      before = structuredClone(f.doc);
    expect(() =>
      applyAction(f.doc, f.users, f.master, {
        type: "event.create",
        title: "Meeting",
        startsAt: "2026-11-01T01:30",
        endsAt: "2026-11-01T02:30",
        location: "Campus",
        description: "Meet",
        eventType: "chapter",
      })
    ).toThrow("timezone");
    expect(f.doc).toEqual(before);
  });

  it("uses current roster permissions even when passed a stale actor object", () => {
    const f = fixture(),
      staleMaster = { ...f.master };
    f.master.role = "active";
    expect(() =>
      applyAction(f.doc, f.users, staleMaster, {
        type: "event.create",
      })
    ).toThrow("Only pledge masters");
    expect(snapshot(f.doc, f.users, staleMaster).user.role).toBe("active");
    f.master.archived = true;
    expect(() => snapshot(f.doc, f.users, staleMaster)).toThrow(
      "Member access"
    );
  });

  it("counts each current deliverable once and excludes orphaned submissions", () => {
    const f = fixture();
    f.doc.records.submission = [
      {
        id: "s1",
        pledgeId: f.pledge.id,
        deliverableId: "deliverable-1",
        status: "approved",
      },
      {
        id: "s2",
        pledgeId: f.pledge.id,
        deliverableId: "deliverable-1",
        status: "approved",
      },
      {
        id: "s3",
        pledgeId: f.pledge.id,
        deliverableId: "deleted",
        status: "approved",
      },
    ];
    const state = snapshot(f.doc, f.users, f.master);
    expect(
      state.classProgress.find(p => p.pledgeId === f.pledge.id)
        ?.approvedDeliverables
    ).toBe(1);
    expect(f.doc.records.submission).toHaveLength(3); // History is retained.
  });
});

describe("makeup integrity", () => {
  it("does not publish an already-expired makeup offer", () => {
    const f = fixture();
    const before = structuredClone(f.doc);
    expect(() =>
      applyAction(f.doc, f.users, f.master, {
        type: "makeup.offer",
        title: "Task",
        description: "Help",
        credit: 1,
        dueAt: "2000-01-01T00:00:00Z",
      })
    ).toThrow("deadline has passed");
    expect(f.doc).toEqual(before);
  });

  it("does not approve an offer that expired while awaiting approval", () => {
    const f = fixture();
    f.doc.records.makeup = [
      { id: "expired", status: "proposed", dueAt: "2000-01-01T00:00:00Z" },
    ];
    expect(() =>
      applyAction(f.doc, f.users, f.master, {
        type: "makeup.approveOffer",
        id: "expired",
        status: "open",
      })
    ).toThrow("deadline has passed");
    expect(f.doc.records.makeup[0].status).toBe("proposed");
  });

  it("rejects historical mismatched credit and excess approved credit", () => {
    const f = fixture();
    f.doc.records.strike = [
      { id: "s", pledgeId: f.pledge.id, points: 1, status: "approved" },
    ];
    const task = {
      id: "t",
      pledgeId: "someone-else",
      strikeId: "s",
      credit: 1,
      status: "submitted",
    };
    f.doc.records.makeup = [task];
    const review = {
      type: "makeup.review",
      id: "t",
      status: "approved",
      note: "Checked",
    };
    expect(() => applyAction(f.doc, f.users, f.master, review)).toThrow(
      "same pledge"
    );
    task.pledgeId = f.pledge.id;
    f.doc.records.makeup.push({ ...task, id: "approved", status: "approved" });
    expect(() => applyAction(f.doc, f.users, f.master, review)).toThrow(
      "enough approved"
    );
    expect(task.status).toBe("submitted");
  });

  it("concurrent assignments cannot reserve more credit than the strike", async () => {
    const f = fixture();
    f.doc.records.strike = [
      { id: "s", pledgeId: f.pledge.id, points: 1, status: "approved" },
    ];
    f.doc.records.makeup = ["one", "two"].map(id => ({
      id,
      title: id,
      status: "open",
      credit: 1,
      dueAt: "2099-01-01T00:00:00Z",
    }));
    let data = f.doc,
      version = 0;
    const store = {
      read: async () => ({ version, data: structuredClone(data) }),
      compareAndSwap: async (v: number | string, next: typeof data) => {
        if (v !== version) return false;
        version++;
        data = next;
        return true;
      },
    };
    const results = await Promise.allSettled(
      ["one", "two"].map(id =>
        mutateProcess(store, f.users, f.master, {
          type: "makeup.assign",
          id,
          strikeId: "s",
        })
      )
    );
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(
      data.records.makeup.filter(t => t.status === "claimed")
    ).toHaveLength(1);
    expect(data.audit).toHaveLength(1);
  });
});
