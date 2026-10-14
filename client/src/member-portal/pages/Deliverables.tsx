import { motion, useReducedMotion } from "framer-motion";
import { fluidSpring } from "../components/motion";
import { MotionTabs, SurfaceTransition } from "../components/motion";
import { useEffect, useState } from "react";
import {
  ArrowSquareOutIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  RowsIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react";
import { useApp } from "../context";
import {
  Avatar,
  Badge,
  Button,
  Empty,
  PageHead,
  Progress,
} from "../components/ui";
import {
  dateLabel,
  findUser,
  inputDate,
  timeLabel,
  toISO,
  tomorrowInput,
} from "../lib";
import type { Deliverable, Submission } from "../types";
export default function Deliverables() {
  const reduceMotion = useReducedMotion();
  const { state: s, act, openForm, intent } = useApp();
  const [tab, setTab] = useState(intent?.tab || "all");
  const [view, setView] = useState("list");
  const master = s.user.role === "master",
    pledge = s.user.role === "pledge";
  const [selected, setSelected] = useState<string | null>(
    s.user.role === "master" ? intent?.focusId || null : null
  );
  useEffect(() => {
    if (!intent?.focusId) return;
    document
      .getElementById(`deliverable-${intent.focusId}`)
      ?.scrollIntoView({ block: "center" });
  }, [intent?.focusId]);
  const total = s.users.filter(u => u.role === "pledge").length;
  const pending = s.submissions.filter(x => x.status === "submitted");
  function edit(d?: Deliverable) {
    openForm({
      title: d ? "Edit deliverable" : "Give the class a clear next step",
      fields: [
        { name: "title", label: "Title", value: d?.title },
        {
          name: "description",
          label: "Instructions & expectations",
          type: "textarea",
          value: d?.description,
        },
        {
          name: "dueAt",
          label: "Due",
          type: "datetime-local",
          value: d ? inputDate(d.dueAt) : tomorrowInput(),
          help: "Enter the deadline in your device’s local timezone.",
        },
      ],
      submit: d ? "Save changes" : "Create deliverable",
      onSubmit: v =>
        act(
          d ? "deliverable.update" : "deliverable.create",
          { ...v, id: d?.id, dueAt: toISO(v.dueAt) },
          "Deliverable saved"
        ),
    });
  }
  function submit(d: Deliverable) {
    const sub = s.submissions.find(
      x => x.deliverableId === d.id && x.pledgeId === s.user.id
    );
    openForm({
      title: `Submit: ${d.title}`,
      description: d.description,
      fields: [
        {
          name: "url",
          label: "Link to your work",
          type: "url",
          value: sub?.url,
          help: "Use a document, slide deck, or file link your pledge masters can open.",
        },
        {
          name: "note",
          label: "Anything we should know?",
          type: "textarea",
          required: false,
          value: sub?.note,
        },
      ],
      submit: "Submit for review",
      onSubmit: v =>
        act(
          "deliverable.submit",
          { ...v, id: d.id },
          "Your work is ready for review"
        ),
    });
  }
  function review(sub: Submission) {
    openForm({
      title: `Review ${findUser(s, sub.pledgeId)?.name.split(" ")[0]}’s work`,
      description:
        sub.note || "Review their linked work before marking it approved.",
      fields: [
        {
          name: "status",
          label: "Outcome",
          type: "select",
          value: "approved",
          options: [
            { value: "approved", label: "Approve the work" },
            { value: "changes_requested", label: "Request changes" },
          ],
        },
        { name: "note", label: "Feedback", type: "textarea" },
      ],
      submit: "Save review",
      onSubmit: v =>
        act("deliverable.review", { ...v, id: sub.id }, "Review saved"),
    });
  }
  const filtered = s.deliverables
    .filter(d => {
      const sub = s.submissions.find(
        x => x.deliverableId === d.id && x.pledgeId === s.user.id
      );
      return (
        tab === "all" ||
        (tab === "review" &&
          (master
            ? pending.some(x => x.deliverableId === d.id)
            : sub?.status === "submitted")) ||
        (tab === "done" &&
          (master
            ? s.submissions.filter(
                x => x.deliverableId === d.id && x.status === "approved"
              ).length === total && total > 0
            : sub?.status === "approved")) ||
        (tab === "todo" && (!sub || sub.status === "changes_requested"))
      );
    })
    .sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));
  return (
    <>
      <PageHead
        eyebrow="FROM IDEAS TO ACTION"
        title="Deliverables"
        description="Clear expectations. One place for your work. Feedback that helps."
        action={
          master ? (
            <Button onClick={() => edit()}>
              <PlusIcon size={18} />
              Add deliverable
            </Button>
          ) : undefined
        }
      />
      <div className="toolbar">
        <MotionTabs className="tabs">
          <button
            className={tab === "all" ? "active" : ""}
            onClick={() => setTab("all")}
          >
            All work
          </button>
          {pledge && (
            <button
              className={tab === "todo" ? "active" : ""}
              onClick={() => setTab("todo")}
            >
              To do
            </button>
          )}
          {(master || pledge) && (
            <>
              <button
                className={tab === "review" ? "active" : ""}
                onClick={() => {
                  setTab("review");
                  // Masters land on the first submission waiting for them.
                  if (master && pending.length)
                    setSelected(pending[0].deliverableId);
                }}
              >
                In review ({pending.length})
              </button>
              <button
                className={tab === "done" ? "active" : ""}
                onClick={() => setTab("done")}
              >
                Approved
              </button>
            </>
          )}
        </MotionTabs>
        <div className="button-group">
          <button
            className={view === "list" ? "selected" : ""}
            onClick={() => setView("list")}
            aria-label="List view"
          >
            <RowsIcon size={19} />
          </button>
          <button
            className={view === "grid" ? "selected" : ""}
            onClick={() => setView("grid")}
            aria-label="Grid view"
          >
            <SquaresFourIcon size={19} />
          </button>
        </div>
      </div>
      <div className={view === "grid" ? "deliverable-grid" : "space-y-4"}>
        {filtered.map((d, i) => {
          const subs = s.submissions.filter(x => x.deliverableId === d.id);
          const sub = subs.find(x => x.pledgeId === s.user.id);
          const pledgeIds = new Set(
            s.users.filter(u => u.role === "pledge").map(u => u.id)
          );
          const done = new Set(
            subs
              .filter(x => x.status === "approved" && pledgeIds.has(x.pledgeId))
              .map(x => x.pledgeId)
          ).size;
          const overdue =
            Date.parse(d.dueAt) < Date.now() && sub?.status !== "approved";
          return (
            <motion.article
              key={d.id}
              id={`deliverable-${d.id}`}
              layout={reduceMotion ? false : "position"}
              layoutDependency={`${view}:${tab}:${selected}`}
              transition={fluidSpring}
              className={`panel deliverable-card ${intent?.focusId === d.id ? "is-focused" : ""}`}
            >
              <div className="deliverable-top">
                <span className="deliverable-number">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="grow">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2>{d.title}</h2>
                    {pledge && (
                      <Badge status={sub?.status || "neutral"}>
                        {sub ? undefined : overdue ? "Past due" : "To do"}
                      </Badge>
                    )}
                  </div>
                  <p>{d.description}</p>
                  <span
                    className={`due-label ${overdue && pledge ? "overdue" : ""}`}
                  >
                    <ClockIcon size={15} />
                    Due{" "}
                    {dateLabel(d.dueAt, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    · {timeLabel(d.dueAt)}
                  </span>
                </div>
                {master && (
                  <Button variant="ghost" onClick={() => edit(d)}>
                    Edit
                  </Button>
                )}
              </div>
              {pledge && sub?.feedback && (
                <div className="feedback">
                  <strong>Feedback from your pledge master</strong>
                  <p>{sub.feedback}</p>
                </div>
              )}
              <div className="deliverable-bottom">
                {master ? (
                  <>
                    <div className="deliverable-progress">
                      <Progress value={total ? (done / total) * 100 : 0} />
                      <span>
                        {done} of {total} approved
                      </span>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setSelected(selected === d.id ? null : d.id)
                      }
                    >
                      {selected === d.id
                        ? "Hide submissions"
                        : `View submissions (${subs.length})`}
                    </Button>
                  </>
                ) : pledge ? (
                  <>
                    <span className="muted text-sm">
                      {sub?.status === "approved"
                        ? "Nice work. You’re all set."
                        : sub?.status === "submitted"
                          ? "Your pledge masters will review this soon."
                          : "Submit a link when your work is ready."}
                    </span>
                    {!sub || sub.status === "changes_requested" ? (
                      <Button onClick={() => submit(d)}>Submit work</Button>
                    ) : (
                      <a
                        className="btn btn-secondary"
                        href={sub.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View your work
                        <ArrowSquareOutIcon size={16} />
                      </a>
                    )}
                  </>
                ) : (
                  <span className="muted text-sm">
                    Pledges submit their work here. Pledge masters review it.
                  </span>
                )}
              </div>
              {master && selected === d.id && (
                <SurfaceTransition identity={d.id} className="submission-list">
                  {subs.map(x => (
                    <div className="submission-row" key={x.id}>
                      <Avatar user={findUser(s, x.pledgeId)} size="sm" />
                      <div className="grow">
                        <strong>{findUser(s, x.pledgeId)?.name}</strong>
                        <small>Submitted {dateLabel(x.submittedAt)}</small>
                        {x.note && <p className="text-sm muted">{x.note}</p>}
                      </div>
                      <Badge status={x.status} />
                      <a
                        className="text-link"
                        href={x.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open work
                        <ArrowSquareOutIcon size={15} />
                      </a>
                      {x.status === "submitted" && (
                        <Button onClick={() => review(x)}>Review</Button>
                      )}
                    </div>
                  ))}
                  {!subs.length && (
                    <Empty
                      title="No submissions yet"
                      description="Your class’s work will appear here."
                    />
                  )}
                </SurfaceTransition>
              )}
            </motion.article>
          );
        })}
      </div>
      {!filtered.length &&
        (tab === "all" ? (
          <Empty
            title="No deliverables yet"
            description={
              master
                ? "Create the first assignment for your class."
                : "Your pledge masters will post assignments here."
            }
            action={
              master ? (
                <Button onClick={() => edit()}>Add deliverable</Button>
              ) : undefined
            }
          />
        ) : (
          <Empty
            title="You’re all caught up here"
            description="Nothing in this view right now."
            action={
              <Button variant="secondary" onClick={() => setTab("all")}>
                Show all work
              </Button>
            }
          />
        ))}
      <div className="inline-note mt-6">
        <CheckCircleIcon size={19} />
        <span>
          Progress updates when a pledge master approves a submission. Work that
          needs another pass stays easy to find.
        </span>
      </div>
    </>
  );
}
