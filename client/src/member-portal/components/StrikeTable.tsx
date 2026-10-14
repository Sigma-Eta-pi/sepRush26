import { useApp } from "../context";
import { Avatar, Empty } from "./ui";
import { dateLabel, findUser } from "../lib";
import { strikeSlots } from "../strike-table";
import type { User } from "../types";

export default function StrikeTable({
  pledges,
  onRecords,
}: {
  pledges: User[];
  onRecords: (id: string, filter?: string) => void;
}) {
  const { state: s, openForm } = useApp();
  const rows = pledges.map(pledge => ({
    pledge,
    slots: strikeSlots(s.strikes, s.makeups, pledge.id),
  }));
  const columns = Math.max(3, ...rows.map(row => row.slots.length));
  if (!rows.length)
    return (
      <Empty title="No pledges found" description="Try a different name." />
    );
  return (
    <section
      className="panel strike-table-panel"
      aria-label="Class strike table"
    >
      <div
        className="strike-table-scroll"
        tabIndex={0}
        role="region"
        aria-label="Strike points by pledge; scroll horizontally for more columns"
      >
        <table className="strike-matrix">
          <caption className="sr-only">
            Pledges in rows, issued strike points in numbered columns. Strike
            means this point still counts; Made up means makeup credit was
            approved.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="strike-name-column">
                Pledge
              </th>
              {Array.from({ length: columns }, (_, i) => (
                <th scope="col" key={i} aria-label={`Strike point ${i + 1}`}>
                  <span className="strike-column-label">Strike</span>
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ pledge, slots }) => {
              const pending = s.strikes.filter(
                strike =>
                  strike.pledgeId === pledge.id &&
                  (strike.status === "reported" ||
                    strike.appealStatus === "pending")
              ).length;
              return (
                <tr key={pledge.id}>
                  <th scope="row" className="strike-name-column">
                    <button
                      className="strike-table-person"
                      onClick={() => onRecords(pledge.id)}
                    >
                      <Avatar user={pledge} size="sm" />
                      <span>{pledge.name}</span>
                    </button>
                    {pending > 0 && (
                      <button
                        className="strike-table-review"
                        onClick={() => onRecords(pledge.id, "review")}
                      >
                        {pending} to review
                      </button>
                    )}
                  </th>
                  {Array.from({ length: columns }, (_, i) => {
                    const slot = slots[i];
                    return (
                      <td key={i}>
                        {slot ? (
                          <button
                            className={`strike-mark ${slot.madeUp ? "made-up" : "outstanding"}`}
                            aria-label={`${pledge.name}, strike point ${i + 1}: ${slot.madeUp ? "made up" : "strike — still counts"}`}
                            onClick={() =>
                              openForm({
                                title: `${pledge.name} · Strike ${i + 1}`,
                                description: `${slot.madeUp ? "Made up — credit approved by a pledge master." : "Strike — this point still counts."}\n\n${slot.strike.reason}\n\n${dateLabel(slot.strike.date)} · Reported by ${findUser(s, slot.strike.reporterId)?.name || "a chapter member"}\nPoint ${slot.point} of ${slot.strike.points} from this record.${slot.strike.reviewNote ? `\n\nReview: ${slot.strike.reviewNote}` : ""}${
                                  slot.madeUp
                                    ? `\n\nApproved makeup: ${s.makeups
                                        .filter(
                                          task =>
                                            task.strikeId === slot.strike.id &&
                                            task.status === "approved"
                                        )
                                        .map(task => task.title)
                                        .join(", ")}`
                                    : ""
                                }`,
                                fields: [],
                                submit: `Open ${pledge.name.split(" ")[0]}’s records`,
                                onSubmit: async () => onRecords(pledge.id),
                              })
                            }
                          >
                            {slot.madeUp ? "Made up" : "Strike"}
                          </button>
                        ) : (
                          <span
                            className="strike-mark unused"
                            aria-label="No strike"
                          >
                            —
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
