import ActiveOverview from "./ActiveOverview";
import {
  ArrowRightIcon,
  FlagIcon,
  HandHeartIcon,
  CoffeeIcon,
  CalendarBlankIcon,
  ChatsIcon,
  FileTextIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import { useApp } from "../context";
import {
  Avatar,
  Button,
  PageHead,
  Progress,
  SectionHead,
  Empty,
} from "../components/ui";
import {
  coffeeTally,
  dateLabel,
  progress,
  strikeBalance,
  timeLabel,
} from "../lib";
export default function Today() {
  const { state: s, navigate, openForm, act } = useApp(),
    pledge = s.user.role === "pledge",
    master = s.user.role === "master";
  const people = s.users.filter(u => u.role === "pledge");
  const reports = s.strikes.filter(
    x =>
      s.users.some(u => u.id === x.pledgeId) &&
      (x.status === "reported" || x.appealStatus === "pending")
  ).length;
  const balance = pledge
    ? strikeBalance(s, s.user.id)
    : people.reduce((n, p) => n + strikeBalance(s, p.id), 0);
  const makeupReview = s.makeups.filter(t =>
    master
      ? ["proposed", "submitted", "verified", "completed"].includes(t.status)
      : t.ownerId === s.user.id && t.status === "submitted"
  ).length;
  const makeupsOpen = s.makeups.filter(t => t.status === "open").length;
  const openQuestions = s.questions.filter(q => !q.resolved).length;
  function ask() {
    openForm({
      title: "Ask your pledge masters",
      description:
        "Ask the class, or keep it between you and your pledge masters.",
      fields: [
        { name: "title", label: "What’s on your mind?" },
        { name: "body", label: "A little context", type: "textarea" },
        {
          name: "private",
          label: "Only me & the pledge masters",
          type: "checkbox",
          help: "Private questions never appear in the class conversation.",
        },
      ],
      submit: "Ask question",
      onSubmit: async v => {
        await act(
          "question.create",
          { ...v, private: v.private === "on" },
          "Question posted"
        );
        navigate("questions", { tab: "mine" });
      },
    });
  }
  const tallies = people.map(p => coffeeTally(s, p.id));
  const mine = coffeeTally(s, s.user.id);
  const completed = pledge
    ? mine.confirmed.length
    : tallies.reduce((n, t) => n + t.confirmed.length, 0);
  const goal = pledge
    ? s.settings.coffeeGoal
    : s.settings.coffeeGoal * people.length;
  const finished = tallies.filter(t => !t.left).length;
  const chatsToConfirm = s.coffee.filter(
    c => c.activeId === s.user.id && c.status === "pending"
  ).length;
  const approved = pledge
    ? progress(s, s.user).done
    : people.reduce((n, p) => n + progress(s, p).done, 0);
  const workTotal = s.deliverables.length * (pledge ? 1 : people.length);
  const toReview = s.submissions.filter(
    x =>
      x.status === "submitted" &&
      s.deliverables.some(d => d.id === x.deliverableId)
  ).length;
  const nextWork = s.deliverables
    .filter(
      d =>
        Date.parse(d.dueAt) >= Date.now() &&
        !s.submissions.some(
          x =>
            x.deliverableId === d.id &&
            x.pledgeId === s.user.id &&
            ["submitted", "approved"].includes(x.status)
        )
    )
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];
  const nextEvent = s.events
    .filter(e => Date.parse(e.endsAt) > Date.now())
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
  // Everything waiting on a pledge master, in one list.
  const queue = [
    {
      n: toReview,
      label: "Deliverable submissions to review",
      icon: <FileTextIcon size={20} />,
      go: () => navigate("deliverables", { tab: "review" }),
    },
    {
      n: openQuestions,
      label: "Open questions to answer",
      icon: <ChatsIcon size={20} />,
      go: () => navigate("questions", { tab: "open" }),
    },
    {
      n: chatsToConfirm,
      label: "Coffee chats waiting for you to confirm",
      icon: <CoffeeIcon size={20} />,
      go: () => navigate("coffee"),
    },
    {
      n: makeupReview,
      label: "Makeup tasks and submissions to review",
      icon: <HandHeartIcon size={20} />,
      go: () => navigate("accountability", { tab: "makeups", filter: "review" }),
    },
    {
      n: reports,
      label: "Strike reports and responses to review",
      icon: <FlagIcon size={20} />,
      go: () =>
        navigate("accountability", {
          tab: "strikes",
          view: "list",
          filter: "review",
        }),
    },
  ].filter(item => item.n);
  const due = [
    ...s.events.map(e => ({
      id: e.id,
      title: e.title,
      date: e.startsAt,
      detail: e.location,
      page: "calendar" as const,
    })),
    ...s.deliverables.map(d => ({
      id: d.id,
      title: d.title,
      date: d.dueAt,
      detail: "Deliverable due",
      page: "deliverables" as const,
    })),
  ]
    .filter(x => Date.parse(x.date) >= Date.now())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);
  if (s.user.role === "active") return <ActiveOverview />;
  return (
    <>
      <PageHead
        eyebrow={`${s.settings.cohort} · ${s.settings.term}`}
        title={
          master
            ? "Pledge master overview"
            : `Hi, ${s.user.name.split(" ")[0]}.`
        }
        description={
          pledge
            ? s.settings.welcome
            : master
              ? "A clear view of the whole process."
              : "Your chats, reports, and makeup tasks."
        }
      />
      {pledge && !s.user.profileEdited && (
        <button
          className="profile-nudge"
          onClick={() => navigate("members", { action: "edit-profile" })}
        >
          <UserCircleIcon size={24} />
          <span className="row-grow">
            <strong>Finish your profile</strong>
            <small>
              Actives look you up before a coffee chat. Add your photo, major
              and a short intro.
            </small>
          </span>
          <ArrowRightIcon />
        </button>
      )}
      <section className="priority-grid" aria-label="Process overview">
        <button
          className="priority-card"
          onClick={() =>
            navigate(
              "coffee",
              pledge && mine.left ? { filter: "remaining" } : undefined
            )
          }
        >
          <CoffeeIcon size={23} />
          <span>Coffee chats</span>
          <strong>
            {completed}
            <small> / {goal}</small>
          </strong>
          <p>
            {pledge
              ? mine.pending.length
                ? `Confirmed · ${mine.pending.length} awaiting confirmation`
                : "Confirmed by actives"
              : `Confirmed · ${finished} of ${people.length} pledges at ${s.settings.coffeeGoal}`}
          </p>
          <Progress
            value={goal ? (completed / goal) * 100 : 0}
            label="Coffee chats confirmed"
          />
          <span className="priority-link">
            {pledge
              ? mine.left
                ? `Find your next chat · ${mine.left} left`
                : "View my coffee chats"
              : "See who has met whom"}{" "}
            <ArrowRightIcon />
          </span>
        </button>
        <button
          className="priority-card"
          onClick={() =>
            navigate(
              "deliverables",
              master
                ? toReview
                  ? { tab: "review" }
                  : undefined
                : nextWork
                  ? { focusId: nextWork.id }
                  : undefined
            )
          }
        >
          <FileTextIcon size={23} />
          <span>Deliverables</span>
          <strong>
            {approved}
            <small> / {workTotal}</small>
          </strong>
          <p>
            {master
              ? toReview
                ? `Approved · ${toReview} waiting for review`
                : "Approved across the class"
              : nextWork
                ? `Approved · next: ${nextWork.title}, due ${dateLabel(nextWork.dueAt)}`
                : "Approved · nothing due right now"}
          </p>
          <Progress
            value={workTotal ? (approved / workTotal) * 100 : 0}
            label="Deliverables approved"
          />
          <span className="priority-link">
            {master
              ? toReview
                ? `Review ${toReview} submission${toReview === 1 ? "" : "s"}`
                : "Open deliverables"
              : nextWork
                ? "Open what’s due next"
                : "Open my deliverables"}{" "}
            <ArrowRightIcon />
          </span>
        </button>
        <button
          className="priority-card"
          onClick={() =>
            navigate(
              "calendar",
              nextEvent ? { focusId: nextEvent.id } : undefined
            )
          }
        >
          <CalendarBlankIcon size={23} />
          <span>Next event</span>
          <strong className="priority-title">
            {nextEvent ? nextEvent.title : "Nothing scheduled"}
          </strong>
          <p>
            {nextEvent
              ? `${dateLabel(nextEvent.startsAt, { weekday: "short", month: "short", day: "numeric" })} · ${timeLabel(nextEvent.startsAt)} · ${nextEvent.location}`
              : master
                ? "Add the class schedule in the calendar."
                : "Your pledge masters will add the schedule."}
          </p>
          <span className="priority-link">
            {nextEvent ? "Open this event" : "Open the calendar"}{" "}
            <ArrowRightIcon />
          </span>
        </button>
      </section>
      {master && (
        <section className="panel overview-panel">
          <SectionHead
            title="Needs your review"
            detail="Everything waiting on a pledge master."
          />
          {queue.length ? (
            queue.map(item => (
              <button key={item.label} className="simple-row" onClick={item.go}>
                <span className="queue-icon">{item.icon}</span>
                <span className="row-grow">
                  <strong>{item.label}</strong>
                </span>
                <span className="queue-count">{item.n}</span>
                <ArrowRightIcon />
              </button>
            ))
          ) : (
            <p className="quiet-note">You’re all caught up.</p>
          )}
        </section>
      )}
      {master && (
        <section className="panel overview-panel">
          <SectionHead
            title="Class progress"
            detail={`${people.length} pledges · ${s.settings.coffeeGoal} coffee chats each · Select a pledge for their chats`}
            action={
              <Button variant="ghost" onClick={() => navigate("coffee")}>
                All coffee chats <ArrowRightIcon />
              </Button>
            }
          />
          <div className="progress-list">
            {people.map(p => {
              const g = progress(s, p);
              return (
                <button
                  className="simple-row"
                  key={p.id}
                  onClick={() => navigate("coffee", { pledgeId: p.id })}
                >
                  <Avatar user={p} />
                  <span className="row-grow">
                    <strong>{p.name}</strong>
                    <small>
                      {g.coffee}/{s.settings.coffeeGoal} chats · {g.done}/
                      {s.deliverables.length} deliverables
                    </small>
                    <Progress
                      value={g.percent}
                      label={`${p.name} overall progress`}
                    />
                  </span>
                  {master && (
                    <span
                      className={`balance-pill ${strikeBalance(s, p.id) ? "has-strikes" : ""}`}
                    >
                      {strikeBalance(s, p.id)} strikes
                    </span>
                  )}
                  <ArrowRightIcon />
                </button>
              );
            })}
          </div>
        </section>
      )}{" "}
      <div className="overview-columns">
        <section className="panel overview-panel">
          <SectionHead
            title="Coming up"
            action={
              <Button variant="ghost" onClick={() => navigate("calendar")}>
                Calendar <ArrowRightIcon />
              </Button>
            }
          />
          {due.length ? (
            due.map(e => (
              <button
                key={e.id}
                className="simple-row"
                onClick={() => navigate(e.page, { focusId: e.id })}
              >
                <span className="date-chip">
                  <CalendarBlankIcon size={18} />
                  {dateLabel(e.date)}
                </span>
                <span className="row-grow">
                  <strong>{e.title}</strong>
                  <small>{e.detail}</small>
                </span>
                <ArrowRightIcon />
              </button>
            ))
          ) : (
            <Empty
              title="Your schedule is clear"
              description="Events and deadlines will appear here when pledge masters add them."
            />
          )}
        </section>
        <section className="panel overview-panel">
          <SectionHead
            title={master ? "Class announcement" : "From your pledge masters"}
          />
          <p className="announcement-copy">{s.settings.announcement}</p>
          <div className="row-actions">
            {master ? (
              <Button
                variant="secondary"
                onClick={() =>
                  navigate(
                    "questions",
                    openQuestions ? { tab: "open" } : undefined
                  )
                }
              >
                {openQuestions
                  ? `Answer ${openQuestions} open question${openQuestions === 1 ? "" : "s"}`
                  : "View questions"}{" "}
                <ArrowRightIcon />
              </Button>
            ) : (
              <>
                <Button variant="secondary" onClick={ask}>
                  Ask a question
                </Button>
                <Button variant="ghost" onClick={() => navigate("questions")}>
                  Browse answers <ArrowRightIcon />
                </Button>
              </>
            )}
            {master && (
              <Button variant="ghost" onClick={() => navigate("settings")}>
                Edit announcement <ArrowRightIcon />
              </Button>
            )}
          </div>
          <small className="quiet-note">
            {master
              ? "Answer open questions and private messages from the class."
              : "Choose a class question or a private question to your pledge masters."}
          </small>
        </section>
      </div>
      {pledge && (
        <button
          className="panel standing-row"
          onClick={() =>
            navigate(
              "accountability",
              balance && makeupsOpen
                ? { tab: "makeups", filter: "available" }
                : { tab: "strikes" }
            )
          }
        >
          <FlagIcon size={20} />
          <span className="row-grow">
            <strong>
              {balance
                ? `${balance} outstanding strike point${balance === 1 ? "" : "s"}`
                : "No outstanding strikes"}
            </strong>
            <small>
              {balance && makeupsOpen
                ? `${makeupsOpen} makeup task${makeupsOpen === 1 ? "" : "s"} available to clear them`
                : "Your strike records and makeup work"}
            </small>
          </span>
          <span className="priority-link">
            {balance && makeupsOpen ? "See makeups" : "View records"}{" "}
            <ArrowRightIcon />
          </span>
        </button>
      )}
    </>
  );
}
