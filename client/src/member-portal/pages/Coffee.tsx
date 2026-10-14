import { useEffect, useMemo, useRef, useState } from "react";
import {
  CaretDownIcon,
  ChatCircleTextIcon,
  CheckCircleIcon,
  PlusIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { useApp } from "../context";
import {
  Avatar,
  Badge,
  Button,
  PageHead,
  Progress,
  SectionHead,
  Empty,
} from "../components/ui";
import { coffeeTally, dateLabel, findUser, todayInput } from "../lib";
import type { Coffee as Chat, User } from "../types";
export const sms = (u: User) =>
  u.phone ? "sms:" + u.phone.replace(/[^+\d]/g, "") : null;
const initials = (name = "") =>
  name
    .split(" ")
    .map(n => n[0])
    .slice(0, 2)
    .join("");
export default function Coffee() {
  const { state: s } = useApp();
  return (
    <>
      <PageHead
        eyebrow="CONNECT WITH THE CHAPTER"
        title="Coffee chats"
        description={
          s.user.role === "pledge"
            ? `Meet ${s.settings.coffeeGoal} actives. Log each chat with a thank-you, and it counts once they confirm.`
            : `Pledges log their chats. You confirm the ones with you. Each pledge meets ${s.settings.coffeeGoal} actives.`
        }
      />
      {s.user.role === "pledge" ? (
        <PledgeChats />
      ) : (
        <>
          <ChatsToConfirm />
          <ClassChart />
        </>
      )}
    </>
  );
}

/** A pledge's own list: who they've met, who's left, and logging a chat. */
function PledgeChats() {
  const { state: s, openForm, act, intent } = useApp();
  const actives = s.users.filter(u => u.role !== "pledge");
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState(intent?.filter || "all");
  const goal = s.settings.coffeeGoal,
    tally = coffeeTally(s, s.user.id);
  // The latest record per active; a rejected one can be logged again.
  const latest = useMemo(() => {
    const records = new Map<string, Chat>();
    for (const chat of [...s.coffee].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    ))
      if (chat.pledgeId === s.user.id) records.set(chat.activeId, chat);
    return records;
  }, [s.coffee, s.user.id]);
  const status = (u: User) => {
    const c = latest.get(u.id);
    return !c || c.status === "declined" ? "remaining" : c.status;
  };
  const filtered = actives.filter(
    u =>
      u.name.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "all" || status(u) === filter)
  );
  const log = (u: User) =>
    openForm({
      title: `Log your chat with ${u.name}`,
      description: `${u.name.split(" ")[0]} reads your message, then confirms that you met.`,
      fields: [
        {
          name: "date",
          label: "When did you meet?",
          type: "date",
          value: todayInput(),
        },
        {
          name: "note",
          label: `Your thank-you to ${u.name.split(" ")[0]}`,
          type: "textarea",
          help: "Thank them and share something you took away from the chat.",
        },
      ],
      submit: "Send for confirmation",
      onSubmit: v =>
        act(
          "coffee.log",
          { activeId: u.id, ...v },
          `Sent to ${u.name.split(" ")[0]} to confirm`
        ),
    });
  return (
    <>
      <section className="panel coffee-goal">
        <div>
          <strong>
            {tally.confirmed.length}
            <small> / {goal} confirmed</small>
          </strong>
          <p>
            {tally.left
              ? `${tally.left} more to go`
              : "You’ve met your coffee chat goal"}
            {tally.pending.length
              ? ` · ${tally.pending.length} awaiting confirmation`
              : ""}
          </p>
        </div>
        <Progress
          value={goal ? (tally.confirmed.length / goal) * 100 : 0}
          label="Coffee chats confirmed"
        />
      </section>
      <div className="panel coffee-toolbar">
        <input
          aria-label="Search actives"
          placeholder="Search an active…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          aria-label="Chat status"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="all">All actives</option>
          <option value="remaining">Not met yet</option>
          <option value="pending">Awaiting confirmation</option>
          <option value="complete">Confirmed</option>
        </select>
      </div>
      <div className="panel member-list">
        {filtered.map(u => {
          const c = latest.get(u.id),
            phone = sms(u),
            open = !c || c.status === "declined";
          return (
            <div key={u.id} className="simple-row coffee-person">
              <Avatar user={u} />
              <span className="row-grow">
                <strong>{u.name}</strong>
                <small>
                  {u.major}
                  {u.year ? " · " + u.year : ""}
                </small>
                {c && !open && <small>Met {dateLabel(c.date)}</small>}
                {c?.status === "declined" && (
                  <small className="coffee-rejected">
                    {u.name.split(" ")[0]} didn’t confirm your{" "}
                    {dateLabel(c.date)} chat
                    {c.reviewNote ? `: “${c.reviewNote}”` : "."} Log it again
                    once you’ve met.
                  </small>
                )}
              </span>
              <div className="row-actions">
                {open ? (
                  <>
                    <a
                      className={`btn btn-secondary ${!phone ? "disabled-link" : ""}`}
                      href={phone || undefined}
                      aria-disabled={!phone}
                      title={!phone ? "Phone number not added yet" : undefined}
                    >
                      <ChatCircleTextIcon />
                      {phone ? "Text" : "No phone yet"}
                    </a>
                    <Button onClick={() => log(u)}>
                      <PlusIcon />
                      Log chat
                    </Button>
                  </>
                ) : (
                  <Badge status={c.status}>
                    {c.status === "complete" ? "Confirmed" : undefined}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
        {!filtered.length && (
          <Empty
            title={
              filter === "pending" && !search
                ? "Nothing awaiting confirmation"
                : "No actives match"
            }
            description="Clear the search and status to see everyone."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
              >
                Show all actives
              </Button>
            }
          />
        )}
      </div>
      <p className="quiet-note">
        You choose which {goal} actives to meet. A chat counts once that active
        confirms it.
      </p>
    </>
  );
}

/** Chats pledges logged with the signed-in active, for them to confirm. */
function ChatsToConfirm() {
  const { state: s, openForm, act } = useApp();
  const mine = s.coffee.filter(c => c.activeId === s.user.id),
    waiting = mine.filter(c => c.status === "pending"),
    met = mine.filter(c => c.status === "complete").length;
  return (
    <section className="panel overview-panel coffee-confirm">
      <SectionHead
        title="Waiting for you to confirm"
        detail={`You’ve confirmed ${met} chat${met === 1 ? "" : "s"} with this class.`}
      />
      {waiting.length ? (
        waiting.map(c => {
          const p = findUser(s, c.pledgeId),
            first = p?.name.split(" ")[0];
          return (
            <div key={c.id} className="simple-row coffee-request">
              <Avatar user={p} />
              <span className="row-grow">
                <strong>{p?.name}</strong>
                <small>Says you met {dateLabel(c.date)}</small>
                {c.note && <q className="coffee-message">{c.note}</q>}
              </span>
              <div className="row-actions">
                <Button
                  onClick={() =>
                    openForm({
                      title: `Confirm you met ${p?.name}?`,
                      description: "This counts toward their coffee chats.",
                      fields: [],
                      submit: "Yes, we met",
                      onSubmit: () =>
                        act(
                          "coffee.update",
                          { id: c.id, status: "complete" },
                          `Chat with ${first} confirmed`
                        ),
                    })
                  }
                >
                  <CheckCircleIcon />
                  Confirm
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    openForm({
                      title: `Reject ${first}’s chat?`,
                      description: `It won’t count. ${first} can log it again after you’ve met.`,
                      fields: [
                        {
                          name: "note",
                          label: `Note to ${first} (optional)`,
                          type: "textarea",
                          required: false,
                        },
                      ],
                      submit: "Reject chat",
                      onSubmit: v =>
                        act(
                          "coffee.update",
                          { id: c.id, status: "declined", note: v.note },
                          `Chat with ${first} rejected`
                        ),
                    })
                  }
                >
                  <XCircleIcon />
                  Reject
                </Button>
              </div>
            </div>
          );
        })
      ) : (
        <p className="quiet-note">
          Nothing to confirm. When a pledge logs a chat with you, it appears
          here with their message.
        </p>
      )}
    </section>
  );
}

/** Pledges down the side, their chats along the top, one square per chat. */
function ClassChart() {
  const { state: s, intent } = useApp();
  const pledges = s.users.filter(u => u.role === "pledge"),
    actives = s.users.filter(u => u.role !== "pledge"),
    goal = s.settings.coffeeGoal;
  const [search, setSearch] = useState(""),
    [sort, setSort] = useState("name"),
    [open, setOpen] = useState(
      pledges.find(p => p.id === intent?.pledgeId)?.id || ""
    );
  const opened = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (intent?.pledgeId)
      opened.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [intent?.pledgeId]);
  const rows = useMemo(
    () => pledges.map(p => ({ pledge: p, ...coffeeTally(s, p.id) })),
    [s]
  );
  // The axis is as long as the goal, or the busiest pledge if they went past it.
  const slots = Math.max(
    goal,
    ...rows.map(r => r.confirmed.length + r.pending.length)
  );
  const shown = rows
    .filter(r => r.pledge.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sort === "left"
        ? b.left - a.left || a.pledge.name.localeCompare(b.pledge.name)
        : sort === "done"
          ? b.confirmed.length - a.confirmed.length ||
            a.pledge.name.localeCompare(b.pledge.name)
          : a.pledge.name.localeCompare(b.pledge.name)
    );
  const confirmed = rows.reduce((n, r) => n + r.confirmed.length, 0),
    finished = rows.filter(r => !r.left).length;
  return (
    <section className="panel overview-panel chat-chart">
      <SectionHead
        title="Class coffee chats"
        detail={`${confirmed} confirmed · ${finished} of ${pledges.length} pledges at ${goal} · Select a pledge to see who they met`}
      />
      <div className="chat-chart-tools">
        <input
          aria-label="Search pledges"
          placeholder="Search a pledge…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          aria-label="Sort pledges"
          value={sort}
          onChange={e => setSort(e.target.value)}
        >
          <option value="name">Sort by name</option>
          <option value="left">Most left first</option>
          <option value="done">Most confirmed first</option>
        </select>
        <span className="chat-legend">
          <i className="chat-cell done" /> Confirmed
          <i className="chat-cell mine" /> With you
          <i className="chat-cell pending" /> Awaiting
          <i className="chat-cell" /> Left
        </span>
      </div>
      {shown.length ? (
        <div
          className="chat-chart-scroll"
          tabIndex={0}
          aria-label="Coffee chats by pledge"
        >
          <div className="chat-chart-row chat-chart-axis" aria-hidden="true">
            <span className="chat-chart-name">Pledge</span>
            <span className="chat-cells">
              {Array.from({ length: slots }, (_, i) => (
                <i
                  key={i}
                  className={`chat-tick ${i + 1 === goal ? "goal" : ""}`}
                >
                  {i === 0 || (i + 1) % 5 === 0 || i + 1 === goal ? i + 1 : ""}
                </i>
              ))}
            </span>
            <span className="chat-chart-count">Left</span>
          </div>
          {shown.map(r => {
            const p = r.pledge,
              expanded = open === p.id,
              chats = [...r.confirmed, ...r.pending];
            return (
              <div
                key={p.id}
                ref={expanded ? opened : undefined}
                className={`chat-chart-group ${expanded ? "open" : ""}`}
              >
                <button
                  className="chat-chart-row"
                  aria-expanded={expanded}
                  aria-label={`${p.name}: ${r.confirmed.length} of ${goal} confirmed, ${r.pending.length} awaiting, ${r.left} left`}
                  onClick={() => setOpen(expanded ? "" : p.id)}
                >
                  <span className="chat-chart-name">
                    <Avatar user={p} size="sm" />
                    <strong>{p.name}</strong>
                  </span>
                  <span className="chat-cells" aria-hidden="true">
                    {Array.from({ length: slots }, (_, i) => {
                      const c = chats[i],
                        a = c && findUser(s, c.activeId);
                      return (
                        <i
                          key={i}
                          title={
                            c
                              ? `${a?.name} · ${dateLabel(c.date)}${c.status === "pending" ? " · awaiting confirmation" : ""}`
                              : undefined
                          }
                          className={`chat-cell ${
                            !c
                              ? ""
                              : c.status === "pending"
                                ? "pending"
                                : c.activeId === s.user.id
                                  ? "done mine"
                                  : "done"
                          } ${i + 1 === goal ? "goal" : ""}`}
                        >
                          {c ? initials(a?.name) : ""}
                        </i>
                      );
                    })}
                  </span>
                  <span className="chat-chart-count">
                    <strong>{r.left}</strong>
                    <small>
                      {r.confirmed.length}/{goal}
                    </small>
                    <CaretDownIcon size={14} />
                  </span>
                </button>
                {expanded && (
                  <div className="chat-chart-detail">
                    <div>
                      <h4>
                        Met {r.confirmed.length}
                        {r.pending.length
                          ? ` · ${r.pending.length} awaiting`
                          : ""}
                      </h4>
                      {chats.length ? (
                        chats.map(c => {
                          const a = findUser(s, c.activeId);
                          return (
                            <div key={c.id} className="chat-detail-row">
                              <Avatar user={a} size="sm" />
                              <span className="row-grow">
                                <strong>{a?.name}</strong>
                                <small>{dateLabel(c.date)}</small>
                                {c.note && (
                                  <q className="coffee-message">{c.note}</q>
                                )}
                              </span>
                              {c.status === "pending" && (
                                <Badge status="pending">Awaiting</Badge>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="quiet-note">No chats logged yet.</p>
                      )}
                    </div>
                    <div>
                      <h4>
                        {r.left
                          ? `${r.left} left · can still meet`
                          : "Goal met · hasn’t met"}
                      </h4>
                      <p className="chat-unmet">
                        {actives
                          .filter(a => !chats.some(c => c.activeId === a.id))
                          .map(a => (
                            <span key={a.id}>{a.name}</span>
                          ))}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <Empty
          title={pledges.length ? "No pledges match" : "No pledges yet"}
          description={
            pledges.length
              ? "Clear the search to see the whole class."
              : "Pledges appear here once they join the process."
          }
          action={
            pledges.length ? (
              <Button variant="secondary" onClick={() => setSearch("")}>
                Show all pledges
              </Button>
            ) : undefined
          }
        />
      )}
    </section>
  );
}
