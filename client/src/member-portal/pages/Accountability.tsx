import TextReports from "../components/TextReports";
import { AnimatePresence } from "framer-motion";
import { MotionTabs, SurfaceTransition } from "../components/motion";
import { useStrikeActions } from "../strike-actions";
import { useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  FlagIcon,
  HandHeartIcon,
  PlusIcon,
  ShieldCheckIcon,
  ClockIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react";
import { useApp } from "../context";
import { Avatar, Badge, Button, Empty, PageHead } from "../components/ui";
import {
  dateLabel,
  findUser,
  strikeBalance,
  todayInput,
  toISO,
  tomorrowInput,
} from "../lib";
import ProfileEditor from "../components/ProfileEditor";
import StrikeTable from "../components/StrikeTable";
import type { User, Makeup, Strike, Field } from "../types";
export default function Accountability() {
  const { state: s, act, openForm, refresh, notify, intent } = useApp();
  const { report, offer, assign } = useStrikeActions();
  const [tab, setTab] = useState(intent?.tab || "strikes");
  const [strikeView, setStrikeView] = useState(
    s.user.role === "master" ? intent?.view || "grid" : "list"
  );
  const [pledgeFilter, setPledgeFilter] = useState(intent?.pledgeId || "all");
  const [strikeFilter, setStrikeFilter] = useState(
    (intent?.tab !== "makeups" && intent?.filter) || "all"
  );
  const [search, setSearch] = useState("");
  const [editingPledge, setEditingPledge] = useState<User | null>(null);
  const [filter, setFilter] = useState(
    (intent?.tab === "makeups" && intent.filter) ||
      (s.user.role === "active" ? "mine" : "all")
  );
  const master = s.user.role === "master",
    pledge = s.user.role === "pledge";
  const myMakeups = s.makeups.filter(t => t.pledgeId === s.user.id);
  const reviewCount =
    s.strikes.filter(
      x =>
        s.users.some(u => u.id === x.pledgeId) &&
        (x.status === "reported" || x.appealStatus === "pending")
    ).length +
    s.makeups.filter(t =>
      master
        ? ["proposed", "submitted", "verified", "completed"].includes(t.status)
        : t.ownerId === s.user.id && t.status === "submitted"
    ).length;
  function reviewStrike(x: Strike) {
    const appeal = x.appealStatus === "pending";
    openForm({
      title: appeal ? "Review the pledge’s response" : "Review this report",
      description: appeal ? x.appeal : x.reason,
      fields: [
        {
          name: "status",
          label: "Decision",
          type: "select",
          value: appeal ? "dismissed" : "approved",
          options: appeal
            ? [
                {
                  value: "dismissed",
                  label: "Accept response and dismiss strike",
                },
                { value: "upheld", label: "Keep the strike" },
              ]
            : [
                { value: "approved", label: "Approve this report" },
                { value: "dismissed", label: "Dismiss this report" },
              ],
        },
        { name: "note", label: "Explain your decision", type: "textarea" },
      ],
      submit: "Save decision",
      onSubmit: v =>
        act(
          appeal ? "strike.appealReview" : "strike.review",
          { ...v, id: x.id },
          "Decision saved"
        ),
    });
  }
  function appeal(x: Strike) {
    openForm({
      title: "Add your perspective",
      description:
        "Your response is shared with the pledge masters and the active who reported this. The strike stays in place while it is reviewed.",
      fields: [
        {
          name: "note",
          label: "What should your pledge masters know?",
          type: "textarea",
        },
      ],
      submit: "Send response",
      onSubmit: v =>
        act("strike.appeal", { ...v, id: x.id }, "Your response was sent"),
    });
  }
  function claim(t: Makeup) {
    const available = s.strikes.filter(
      x =>
        x.pledgeId === s.user.id &&
        x.status === "approved" &&
        x.points -
          s.makeups
            .filter(
              m =>
                m.strikeId === x.id &&
                [
                  "claimed",
                  "changes_requested",
                  "submitted",
                  "verified",
                  "approved",
                ].includes(m.status)
            )
            .reduce((n, m) => n + m.credit, 0) >=
          t.credit
    );
    openForm({
      title: `Help with: ${t.title}`,
      description: available.length
        ? "Choose the strike this work will make up. Credit is applied after the work is reviewed."
        : "You don’t have an approved strike with enough remaining credit for this task.",
      fields: available.length
        ? [
            {
              name: "strikeId",
              label: "Apply this work to",
              type: "select",
              options: available.map(x => ({
                value: x.id,
                label: `${dateLabel(x.date)} · ${x.reason.slice(0, 65)}`,
              })),
            },
          ]
        : [],
      submit: available.length ? "Claim opportunity" : "Got it",
      info: !available.length,
      onSubmit: available.length
        ? v => act("makeup.claim", { ...v, id: t.id }, "Opportunity claimed")
        : async () => {},
    });
  }
  function submit(t: Makeup) {
    openForm({
      title: "Share what you completed",
      description: t.description,
      fields: [
        {
          name: "evidence",
          label: "Completion notes & links",
          type: "textarea",
          value: t.evidence,
          help: "Include enough detail for the task owner to verify your work.",
        },
      ],
      submit: "Submit for review",
      onSubmit: v =>
        act(
          "makeup.submit",
          { ...v, id: t.id },
          "Work submitted to the task owner"
        ),
    });
  }
  function review(t: Makeup) {
    if (t.status === "proposed") {
      openForm({
        title: "Review this makeup opportunity",
        description: `${t.title}\n\n${t.description}\n\nRequested credit: ${t.credit}`,
        fields: [
          {
            name: "status",
            label: "Decision",
            type: "select",
            value: "open",
            options: [
              { value: "open", label: "Approve and publish" },
              { value: "rejected", label: "Do not approve" },
            ],
          },
        ],
        submit: "Save decision",
        onSubmit: v =>
          act(
            "makeup.approveOffer",
            { ...v, id: t.id },
            "Opportunity reviewed"
          ),
      });
      return;
    }
    const eligibleStrikes = s.strikes.filter(
      strike =>
        strike.pledgeId === t.pledgeId &&
        strike.status === "approved" &&
        strike.points -
          s.makeups
            .filter(
              other =>
                other.id !== t.id &&
                other.strikeId === strike.id &&
                [
                  "claimed",
                  "changes_requested",
                  "submitted",
                  "verified",
                  "approved",
                ].includes(other.status)
            )
            .reduce((sum, other) => sum + other.credit, 0) >=
          t.credit
    );
    openForm({
      title: master ? "Review completed work" : "Confirm the completed work",
      description: t.evidence,
      fields: [
        {
          name: "status",
          label: "Outcome",
          type: "select",
          value: "approved",
          options: [
            {
              value: "approved",
              label: master
                ? t.strikeId
                  ? "Approve and apply strike credit"
                  : "Approve completed work"
                : "Confirm work for pledge-master approval",
            },
            { value: "changes_requested", label: "Request changes" },
          ],
        },
        ...(master && !t.strikeId
          ? [
              {
                name: "strikeId",
                label: "Apply credit to",
                type: "select",
                value: "later",
                options: [
                  {
                    value: "later",
                    label: "Later — save completed work without credit",
                  },
                  ...eligibleStrikes.map(strike => ({
                    value: strike.id,
                    label: `${dateLabel(strike.date)} · ${strike.reason}`,
                  })),
                ],
                help: eligibleStrikes.length
                  ? "Choose an approved strike to reduce its balance, or apply credit later."
                  : "No eligible approved strike yet. Completed work stays saved; a pledge master can apply credit later.",
              } as Field,
            ]
          : []),
        { name: "note", label: "Feedback", type: "textarea" },
      ],
      submit: master ? "Save review" : "Send confirmation",
      onSubmit: v =>
        act(
          "makeup.review",
          {
            ...v,
            id: t.id,
            strikeId:
              v.status === "approved" && v.strikeId !== "later"
                ? v.strikeId
                : undefined,
          },
          master ? "Review saved" : "Sent to pledge masters for final credit"
        ),
    });
  }
  const tasks = s.makeups.filter(t => {
    if (filter === "mine")
      return pledge ? t.pledgeId === s.user.id : t.ownerId === s.user.id;
    if (filter === "available") return t.status === "open";
    if (filter === "review")
      return master
        ? ["proposed", "submitted", "verified", "completed"].includes(t.status)
        : t.ownerId === s.user.id && t.status === "submitted";
    return (
      master ||
      (t.status !== "proposed" && t.status !== "rejected") ||
      t.ownerId === s.user.id
    );
  });
  const visibleStrikes = s.strikes.filter(
    x =>
      (pledgeFilter === "all" || x.pledgeId === pledgeFilter) &&
      (strikeFilter === "all" ||
        (strikeFilter === "review"
          ? x.status === "reported" || x.appealStatus === "pending"
          : strikeFilter === "open"
            ? x.status === "approved" &&
              x.points >
                s.makeups
                  .filter(m => m.strikeId === x.id && m.status === "approved")
                  .reduce((n, m) => n + m.credit, 0)
            : x.status === strikeFilter))
  );
  const pledges = s.users.filter(
    u =>
      u.role === "pledge" &&
      !u.archived &&
      u.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <>
      <PageHead
        eyebrow={master ? undefined : "RECORDS & REVIEWS"}
        title="Strikes & makeups"
        description={
          master
            ? "Tap a pledge or strike to see details."
            : "Clear records, thoughtful reviews, and useful ways to contribute."
        }
        action={
          !pledge ? (
            <>
              {(!master || tab === "strikes") && (
                <Button onClick={() => report()}>
                  <FlagIcon size={17} />
                  {master ? "Issue a strike" : "Report a strike"}
                </Button>
              )}
              {(!master || tab === "makeups") && (
                <Button
                  variant={master ? "primary" : "secondary"}
                  onClick={offer}
                >
                  <PlusIcon size={17} />
                  {master ? "Create a makeup" : "Request a makeup"}
                </Button>
              )}
            </>
          ) : undefined
        }
      />
      {!master && (
        <div className="accountability-banner">
          <span className="large-icon">
            <ShieldCheckIcon size={28} />
          </span>
          <div>
            <h2>
              {pledge
                ? `${strikeBalance(s, s.user.id)} open strike${strikeBalance(s, s.user.id) === 1 ? "" : "s"}`
                : master
                  ? "Class strike overview"
                  : "Your reports & makeup tasks"}
            </h2>
            <p>
              {pledge
                ? "Your records are visible to you, your pledge masters, and the reporting active."
                : master
                  ? "Issue strikes directly. Review reports from actives and track makeup credit across the class."
                  : "Reports need approval. Task owners verify makeup work. Pledge masters award the credit."}
            </p>
          </div>
          <div className="accountability-side">
            <strong>
              {pledge
                ? myMakeups
                    .filter(t => t.status === "approved")
                    .reduce((n, t) => n + t.credit, 0)
                : reviewCount}
            </strong>
            <span>{pledge ? "credits earned" : "awaiting review"}</span>
          </div>
        </div>
      )}
      {master && <TextReports />}
      <div className="toolbar">
        <MotionTabs className="tabs">
          <button
            className={tab === "strikes" ? "active" : ""}
            onClick={() => setTab("strikes")}
          >
            <FlagIcon size={17} />
            {pledge ? "My records" : master ? "Strikes" : "My reports"}
            {!master && ` (${s.strikes.length})`}
          </button>
          <button
            className={tab === "makeups" ? "active" : ""}
            onClick={() => setTab("makeups")}
          >
            <HandHeartIcon size={17} />
            {master ? "Makeups" : "Makeup opportunities"}
            {master &&
              s.makeups.some(t =>
                ["proposed", "submitted", "verified", "completed"].includes(
                  t.status
                )
              ) && (
                <span className="badge">
                  {
                    s.makeups.filter(t =>
                      [
                        "proposed",
                        "submitted",
                        "verified",
                        "completed",
                      ].includes(t.status)
                    ).length
                  }{" "}
                  to review
                </span>
              )}
          </button>
        </MotionTabs>
        {tab === "makeups" && (
          <select
            className="filter-select"
            aria-label="Filter makeup opportunities"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="all">All opportunities</option>
            <option value="available">Available to claim</option>
            <option value="mine">
              {pledge ? "My work" : "My opportunities"}
            </option>
            {!pledge && <option value="review">Needs review</option>}
          </select>
        )}
      </div>
      {master && tab === "strikes" && (
        <div className="strike-view-toolbar">
          <MotionTabs
            className="tabs strike-view-tabs"
            aria-label="Strike view"
          >
            {[
              ["grid", "Pledge cards"],
              ["table", "Strike table"],
              ["list", "All records"],
            ].map(([view, label]) => (
              <button
                key={view}
                className={strikeView === view ? "active" : ""}
                onClick={() => setStrikeView(view)}
              >
                {label}
              </button>
            ))}
          </MotionTabs>
          {strikeView !== "list" ? (
            <input
              aria-label="Search pledges"
              placeholder="Find a pledge…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          ) : (
            <>
              <select
                aria-label="Filter pledge strikes"
                value={pledgeFilter}
                onChange={e => setPledgeFilter(e.target.value)}
              >
                <option value="all">All pledges, including history</option>
                {[...s.users, ...(s.archivedUsers || [])]
                  .filter(u => u.role === "pledge")
                  .map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                      {u.archived ? " (removed)" : ""}
                    </option>
                  ))}
              </select>
              <select
                aria-label="Filter strike status"
                value={strikeFilter}
                onChange={e => setStrikeFilter(e.target.value)}
              >
                <option value="all">All records</option>
                <option value="open">Outstanding</option>
                <option value="review">Needs review</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </>
          )}
        </div>
      )}
      <AnimatePresence>
        {editingPledge && (
          <ProfileEditor
            user={editingPledge}
            managed
            onClose={() => setEditingPledge(null)}
            onSaved={async () => {
              setEditingPledge(null);
              await refresh();
              notify("Pledge profile saved");
            }}
            onRemoved={async () => {
              setEditingPledge(null);
              await refresh();
              notify("Pledge removed; history retained");
            }}
          />
        )}
      </AnimatePresence>
      <SurfaceTransition identity={`${tab}:${strikeView}`}>
        {master && tab === "strikes" && strikeView === "table" ? (
          <StrikeTable
            pledges={pledges}
            onRecords={(id, filter = "all") => {
              setPledgeFilter(id);
              setStrikeFilter(filter);
              setStrikeView("list");
            }}
          />
        ) : master && tab === "strikes" && strikeView === "grid" ? (
          <section aria-label="Pledge strike cards">
            <p className="strike-class-count">
              {pledges.length} {search ? "matching" : "current"} pledge
              {pledges.length === 1 ? "" : "s"} · Includes pledges with no
              strikes
            </p>
            <div className="strike-class-grid">
              {pledges.map(p => {
                const strikes = s.strikes.filter(x => x.pledgeId === p.id),
                  approved = strikes
                    .filter(x => x.status === "approved")
                    .reduce((n, x) => n + x.points, 0),
                  outstanding = strikeBalance(s, p.id),
                  pending = strikes.filter(
                    x =>
                      s.users.some(u => u.id === x.pledgeId) &&
                      (x.status === "reported" || x.appealStatus === "pending")
                  ).length;
                return (
                  <article
                    className="panel pledge-strike-card"
                    key={p.id}
                    aria-label={`${p.name} strike summary`}
                  >
                    <div className="person">
                      <Avatar user={p} />
                      <div>
                        <h2>{p.name}</h2>
                        <span className="chapter-card-class">
                          {p.pledgeClass || "Alpha"}
                        </span>
                      </div>
                      <button
                        className="text-link"
                        aria-label={`Edit ${p.name}'s profile`}
                        title="Edit profile"
                        onClick={() => setEditingPledge(p)}
                      >
                        <PencilSimpleIcon size={17} />
                      </button>
                    </div>
                    <button
                      className="strike-score"
                      onClick={() => {
                        setPledgeFilter(p.id);
                        setStrikeFilter("all");
                        setStrikeView("list");
                      }}
                      aria-label={`View ${p.name}'s strike records`}
                    >
                      <strong>{outstanding}</strong>
                      <span>
                        outstanding strike{outstanding === 1 ? "" : "s"}
                      </span>
                    </button>
                    <div className="strike-grid-metrics">
                      <span>{approved} issued</span>
                      <span>{Math.max(0, approved - outstanding)} made up</span>
                      {pending ? (
                        <button
                          onClick={() => {
                            setPledgeFilter(p.id);
                            setStrikeFilter("review");
                            setStrikeView("list");
                          }}
                        >
                          {pending} to review
                        </button>
                      ) : (
                        <span>0 to review</span>
                      )}
                    </div>
                    <Button onClick={() => report(p.id)}>
                      <FlagIcon size={17} />
                      Issue strike
                    </Button>
                  </article>
                );
              })}
              {!pledges.length && (
                <Empty
                  title="No pledges found"
                  description="Try a different name."
                />
              )}
            </div>
          </section>
        ) : tab === "makeups" ? (
          <>
            <div className="makeup-grid">
              {tasks.map(t => {
                const owner = findUser(s, t.ownerId);
                const isOwner = t.ownerId === s.user.id;
                const mine = t.pledgeId === s.user.id;
                return (
                  <article
                    className={`panel makeup-card ${intent?.focusId === t.id ? "is-focused" : ""}`}
                    key={t.id}
                  >
                    <div className="flex justify-between items-center gap-3">
                      <span className="credit-pill">
                        <HandHeartIcon size={16} />
                        {t.credit} strike credit{t.credit > 1 ? "s" : ""}
                      </span>
                      <Badge status={t.status} />
                    </div>
                    <h2>{t.title}</h2>
                    <p className="makeup-description">{t.description}</p>
                    <div className="person">
                      <Avatar user={owner} size="sm" />
                      <span>
                        <strong>{owner?.name}</strong>
                        <small>Task owner</small>
                      </span>
                      <span className="makeup-due">
                        <ClockIcon size={14} />
                        {dateLabel(t.dueAt)}
                      </span>
                    </div>
                    {t.pledgeId && (
                      <div className="assigned-line">
                        Assigned to{" "}
                        <strong>{findUser(s, t.pledgeId)?.name}</strong>
                      </div>
                    )}
                    {t.pledgeId &&
                      !t.strikeId &&
                      (master || isOwner || mine) &&
                      t.status !== "approved" && (
                        <p className="muted text-sm">
                          {t.status === "completed"
                            ? "Work approved. No strike credit applied yet."
                            : "No strike linked yet. Credit is applied separately after approval."}
                        </p>
                      )}
                    {t.evidence && (
                      <div className="feedback">
                        <strong>Completion notes</strong>
                        <p>{t.evidence}</p>
                      </div>
                    )}
                    {t.reviewNote && (
                      <div className="feedback">
                        <strong>Review feedback</strong>
                        <p>{t.reviewNote}</p>
                      </div>
                    )}
                    <div className="makeup-actions">
                      {master && t.status === "open" && (
                        <Button
                          variant="secondary"
                          onClick={() => assign(t)}
                          disabled={Date.parse(t.dueAt) < Date.now()}
                        >
                          Assign to pledge
                        </Button>
                      )}
                      {pledge && t.status === "open" && (
                        <Button
                          onClick={() => claim(t)}
                          disabled={Date.parse(t.dueAt) < Date.now()}
                        >
                          {Date.parse(t.dueAt) < Date.now()
                            ? "Deadline passed"
                            : "I can help"}
                          <ArrowRightIcon size={16} />
                        </Button>
                      )}
                      {mine &&
                        ["claimed", "changes_requested"].includes(t.status) && (
                          <Button onClick={() => submit(t)}>
                            Submit completed work
                          </Button>
                        )}
                      {((master &&
                        [
                          "proposed",
                          "verified",
                          "submitted",
                          "completed",
                        ].includes(t.status)) ||
                        (isOwner && t.status === "submitted")) && (
                        <Button onClick={() => review(t)}>
                          {t.status === "completed"
                            ? "Apply strike credit"
                            : t.status === "proposed"
                              ? "Review opportunity"
                              : "Review work"}
                        </Button>
                      )}
                      {t.status === "approved" && (
                        <span className="success-line">
                          <CheckCircleIcon size={18} />
                          Credit applied to the linked strike
                        </span>
                      )}
                      {t.status === "verified" && !master && (
                        <span className="muted text-sm">
                          Waiting for final pledge-master approval
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
            {!tasks.length && (
              <Empty
                title={
                  filter === "all"
                    ? "No makeup tasks yet"
                    : "Nothing in this view"
                }
                description={
                  pledge
                    ? filter === "all"
                      ? "Tasks appear here once an active offers one and a pledge master approves it."
                      : "Other makeup tasks may be in a different view."
                    : "Offer a task from your own chapter work."
                }
                action={
                  <>
                    {filter !== "all" && (
                      <Button variant="secondary" onClick={() => setFilter("all")}>
                        Show all makeups
                      </Button>
                    )}
                    {!pledge && (
                      <Button variant="secondary" onClick={offer}>
                        {master ? "Create a makeup" : "Request a makeup"}
                      </Button>
                    )}
                  </>
                }
              />
            )}
          </>
        ) : (
          <div className="space-y-4">
            {master && pledgeFilter !== "all" && (
              <div className="row-actions">
                <button
                  className="back-link"
                  onClick={() => {
                    setPledgeFilter("all");
                    setStrikeFilter("all");
                    setStrikeView("grid");
                  }}
                >
                  <ArrowLeftIcon size={17} />
                  All pledges
                </button>
                <Button onClick={() => report(pledgeFilter)}>
                  <FlagIcon size={17} />
                  Issue strike to{" "}
                  {findUser(s, pledgeFilter)?.name.split(" ")[0] || "pledge"}
                </Button>
              </div>
            )}
            {visibleStrikes.map(x => {
              const credit = s.makeups
                .filter(t => t.strikeId === x.id && t.status === "approved")
                .reduce((n, t) => n + t.credit, 0);
              return (
                <article className="panel strike-card" key={x.id}>
                  <div className="strike-heading">
                    <div className="person">
                      <Avatar user={findUser(s, x.pledgeId)} />
                      <span>
                        <strong>{findUser(s, x.pledgeId)?.name}</strong>
                        <small>
                          Reported by {findUser(s, x.reporterId)?.name} ·{" "}
                          {dateLabel(x.date)}
                        </small>
                      </span>
                    </div>
                    <Badge status={x.status} />
                  </div>
                  <p className="strike-reason">{x.reason}</p>
                  <div className="strike-meta">
                    <span>
                      {x.points} point{x.points > 1 ? "s" : ""}
                    </span>
                    {credit > 0 && (
                      <span className="success-line">
                        {Math.min(credit, x.points)} made up
                      </span>
                    )}
                    <span>
                      {x.status === "reported"
                        ? "Not counted until reviewed"
                        : x.status === "dismissed"
                          ? "Not counted"
                          : `${Math.max(0, x.points - credit)} outstanding`}
                    </span>
                  </div>
                  {x.reviewNote && (
                    <div className="feedback">
                      <strong>Pledge-master review</strong>
                      <p>{x.reviewNote}</p>
                    </div>
                  )}
                  {x.appeal && (
                    <div className="feedback">
                      <strong>
                        Pledge response ·{" "}
                        {x.appealStatus === "pending"
                          ? "Awaiting review"
                          : x.appealStatus}
                      </strong>
                      <p>{x.appeal}</p>
                    </div>
                  )}
                  <div className="row-actions mt-4">
                    {master &&
                      (x.status === "reported" ||
                        x.appealStatus === "pending") && (
                        <Button onClick={() => reviewStrike(x)}>
                          Review{" "}
                          {x.appealStatus === "pending" ? "response" : "report"}
                        </Button>
                      )}
                    {master && x.status === "approved" && (
                      <Button
                        variant="ghost"
                        onClick={() =>
                          openForm({
                            title: "Dismiss this strike?",
                            description:
                              "This removes the outstanding points and retains the record and your explanation.",
                            fields: [
                              {
                                name: "note",
                                label: "Reason for dismissal",
                                type: "textarea",
                              },
                            ],
                            submit: "Dismiss strike",
                            onSubmit: v =>
                              act(
                                "strike.dismiss",
                                { id: x.id, ...v },
                                "Strike dismissed"
                              ),
                          })
                        }
                      >
                        Dismiss strike
                      </Button>
                    )}
                    {pledge && x.status === "approved" && !x.appealStatus && (
                      <Button variant="secondary" onClick={() => appeal(x)}>
                        Add my perspective
                      </Button>
                    )}
                    {pledge &&
                      x.status === "approved" &&
                      credit < x.points &&
                      (() => {
                        // Work already claimed for this strike beats looking for more.
                        const claimed = myMakeups.some(
                          t =>
                            t.strikeId === x.id &&
                            !["approved", "rejected", "cancelled"].includes(
                              t.status
                            )
                        );
                        return (
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setTab("makeups");
                              setFilter(claimed ? "mine" : "available");
                            }}
                          >
                            {claimed ? "View my makeup work" : "Find a makeup"}
                            <ArrowRightIcon size={16} />
                          </Button>
                        );
                      })()}
                  </div>
                </article>
              );
            })}
            {!visibleStrikes.length &&
              (pledgeFilter !== "all" || strikeFilter !== "all" ? (
                <Empty
                  title="No records match these filters"
                  description="Clear the filters to see every strike record."
                  action={
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setPledgeFilter("all");
                        setStrikeFilter("all");
                      }}
                    >
                      Show all records
                    </Button>
                  }
                />
              ) : (
                <Empty
                  title="A clean slate"
                  description={
                    pledge
                      ? "You have no strike records."
                      : master
                        ? "No strikes have been issued or reported."
                        : "You haven’t reported any strikes."
                  }
                  action={
                    !pledge ? (
                      <Button variant="secondary" onClick={() => report()}>
                        {master ? "Issue a strike" : "Report a strike"}
                      </Button>
                    ) : undefined
                  }
                />
              ))}
          </div>
        )}
      </SurfaceTransition>
    </>
  );
}
