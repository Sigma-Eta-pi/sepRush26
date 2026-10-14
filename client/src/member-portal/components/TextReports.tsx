import { useState } from "react";
import type { SmsInbox, SmsItem } from "../../../../shared/sms";
import { useApp } from "../context";
import { Button, Empty } from "./ui";
import { SkeletonRows } from "@/components/DashboardSkeleton";
import { dateLabel, todayInput } from "../lib";

async function request<T>(path = "", body?: unknown): Promise<T> {
  const response = await fetch("/api/sms" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Unable to load text reports.");
  return data;
}
export default function TextReports() {
  const { state, openForm, refresh, notify } = useApp();
  const [inbox, setInbox] = useState<SmsInbox | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState(false);
  if (state.user.role !== "master") return null;
  async function load() {
    try {
      setInbox(await request<SmsInbox>());
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function action(path: string, body: unknown) {
    setBusy(true);
    setError("");
    try {
      await request(path, body);
      await Promise.all([load(), refresh()]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function bind() {
    openForm({
      title: "Verify a texting number",
      description:
        "Confirm this number directly with the member first. This grants permission to submit pending reports by text.",
      fields: [
        {
          name: "userId",
          label: "Active or pledge master",
          type: "select",
          options: state.users
            .filter(u => u.role !== "pledge" && !u.archived)
            .map(u => ({ value: u.id, label: u.name })),
        },
        {
          name: "phone",
          label: "Verified phone number",
          type: "text",
          help: "Include the area code, e.g. +1 805 555 0123.",
        },
      ],
      submit: "I verified this number · Save",
      onSubmit: async values => {
        await request("/binding", { ...values, verified: true });
        await load();
        notify("Texting number verified");
      },
    });
  }
  function convert(item: SmsItem) {
    openForm({
      title: "Confirm text report",
      description: item.text,
      fields: [
        {
          name: "pledgeId",
          label: "Pledge",
          type: "select",
          options: [
            { value: "", label: "Choose a pledge…" },
            ...state.users
              .filter(u => u.role === "pledge" && !u.archived)
              .map(u => ({ value: u.id, label: u.name })),
          ],
        },
        {
          name: "reason",
          label: "What happened?",
          type: "textarea",
          value: item.candidate?.reason || "",
        },
        {
          name: "date",
          label: "Incident date",
          type: "date",
          value: item.candidate?.date || todayInput(),
        },
        {
          name: "points",
          label: "Strike points",
          type: "select",
          value: String(item.candidate?.points || 1),
          options: [1, 2, 3].map(n => ({ value: String(n), label: String(n) })),
        },
      ],
      submit: "Create pending report",
      onSubmit: async v => {
        await request("/resolve", {
          id: item.id,
          decision: "report",
          fields: { ...v, points: Number(v.points) },
        });
        await Promise.all([load(), refresh()]);
        notify("Pending strike report created");
      },
    });
  }
  function review(item: SmsItem) {
    const strike = state.strikes.find(s => s.id === item.strikeId);
    if (!strike || strike.status !== "reported") return;
    openForm({
      title: "Review text report",
      description: `Original text: ${item.text}\n\nReport: ${strike.reason}`,
      fields: [
        {
          name: "status",
          label: "Decision",
          type: "select",
          value: "approved",
          options: [
            { value: "approved", label: "Approve strike" },
            { value: "dismissed", label: "Dismiss report" },
          ],
        },
        { name: "note", label: "Explain your decision", type: "textarea" },
      ],
      submit: "Save decision",
      onSubmit: async v => {
        const response = await fetch("/api/process/actions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "strike.review", id: strike.id, ...v }),
        });
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error || "Unable to review report.");
        await Promise.all([load(), refresh()]);
        notify("Strike review saved");
      },
    });
  }
  const name = (id?: string) =>
    state.users.find(u => u.id === id)?.name || "Unverified sender";
  const visible =
    inbox?.items.filter(
      item =>
        history ||
        ["review", "failed", "processing"].includes(item.status) ||
        state.strikes.some(
          s => s.id === item.strikeId && s.status === "reported"
        )
    ) || [];
  return (
    <details
      className="panel text-reports"
      onToggle={event => {
        if (event.currentTarget.open) void load();
      }}
    >
      <summary>
        Text reports <span>Review texts and manage verified numbers</span>
      </summary>
      <div className="text-reports-content">
        <p>Texts become pending reports. Only your approval adds a strike.</p>
        {error && <p role="alert">{error}</p>}
        {!inbox ? (
          error ? (
            <Button variant="secondary" onClick={load}>
              Try again
            </Button>
          ) : (
            <SkeletonRows
              count={3}
              avatar={false}
              label="Loading text reports"
            />
          )
        ) : (
          <>
            <p className="text-report-status">
              {inbox.demo
                ? "Demo only · sample extraction, no AI charges or SMS delivery."
                : inbox.enabled && inbox.configured
                  ? "Import enabled · awaiting forwarded messages."
                  : "Setup required · connect chapter Gmail, Voice number, relay secret and AI key."}{" "}
              {inbox.lastReceivedAt &&
                `Last received: ${new Date(inbox.lastReceivedAt).toLocaleString()}.`}{" "}
              {inbox.callsToday}/{inbox.dailyLimit} extraction attempts today.
            </p>
            <div className="text-report-actions">
              <Button variant="secondary" onClick={bind}>
                Verify a member’s number
              </Button>
              <Button variant="ghost" disabled={busy} onClick={load}>
                Refresh
              </Button>
              {inbox.demo && (
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => action("/demo", {})}
                >
                  Try a sample text
                </Button>
              )}
              <label>
                <input
                  type="checkbox"
                  checked={history}
                  onChange={e => setHistory(e.target.checked)}
                />{" "}
                Show handled texts
              </label>
            </div>
            {visible.length === 0 && (
              <Empty
                title="No texts need review"
                description="New reports and messages needing clarification will appear here."
              />
            )}
            {visible.map(item => {
              const strike = state.strikes.find(s => s.id === item.strikeId);
              const status = strike
                ? strike.status === "reported"
                  ? "Awaiting approval"
                  : strike.status === "approved"
                    ? "Strike approved"
                    : "Report dismissed"
                : {
                    review: "Needs clarification",
                    failed: "Import needs attention",
                    processing: "Processing",
                    ignored: "No report created",
                    reported: "Report created",
                  }[item.status];
              return (
                <article className="text-report-card" key={item.id}>
                  <div className="text-report-top">
                    <strong>
                      {name(item.reporterId)}
                      {item.demo ? " · Demo" : ""}
                    </strong>
                    <span>{status}</span>
                  </div>
                  <small>
                    {item.phone || "Sender number could not be read"} ·{" "}
                    {dateLabel(item.receivedAt)}
                  </small>
                  <blockquote>{item.text}</blockquote>
                  {item.candidate && (
                    <p>
                      <strong>
                        {item.candidate.pledgeName || "Pledge unclear"}
                      </strong>
                      {item.candidate.reason && ` · ${item.candidate.reason}`}
                    </p>
                  )}
                  {item.candidate && item.candidate.intent === "strike" && (
                    <p>
                      Incident date:{" "}
                      {strike?.date || item.candidate.date
                        ? dateLabel(strike?.date || item.candidate.date!)
                        : "Needs confirmation"}{" "}
                      · Strike points:{" "}
                      {strike?.points ?? item.candidate.points ?? 1}
                    </p>
                  )}
                  <p>
                    {strike && strike.status !== "reported"
                      ? strike.reviewNote
                      : item.note}
                  </p>
                  <div className="text-report-actions">
                    {strike?.status === "reported" && (
                      <Button disabled={busy} onClick={() => review(item)}>
                        Review strike
                      </Button>
                    )}
                    {!strike && item.status !== "processing" && (
                      <>
                        <Button
                          variant="secondary"
                          disabled={busy || !item.phone}
                          onClick={() => convert(item)}
                        >
                          Confirm report details
                        </Button>
                        {item.status !== "ignored" && (
                          <Button
                            variant="ghost"
                            disabled={busy}
                            onClick={() =>
                              action("/resolve", {
                                id: item.id,
                                decision: "ignore",
                              })
                            }
                          >
                            Dismiss text
                          </Button>
                        )}
                      </>
                    )}
                    {["failed", "review", "processing"].includes(
                      item.status
                    ) && (
                      <Button
                        variant="ghost"
                        disabled={busy}
                        onClick={() => action("/retry", { id: item.id })}
                      >
                        Retry extraction
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
            <details>
              <summary>Verified numbers ({inbox.bindings.length})</summary>
              {inbox.bindings.map(b => (
                <div className="text-report-binding" key={b.userId}>
                  <span>
                    {name(b.userId)} · {b.phone}
                  </span>
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onClick={() => action("/unbind", { userId: b.userId })}
                  >
                    Remove texting access
                  </Button>
                </div>
              ))}
            </details>
          </>
        )}
      </div>
    </details>
  );
}
