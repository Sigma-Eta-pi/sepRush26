import {
  ArrowRightIcon,
  FlagIcon,
  HandHeartIcon,
  CoffeeIcon,
  CalendarBlankIcon,
  UsersThreeIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react";
import { useApp } from "../context";
import { useStrikeActions } from "../strike-actions";
import {
  Avatar,
  Badge,
  Button,
  PageHead,
  SectionHead,
  Empty,
} from "../components/ui";
import { dateLabel, findUser } from "../lib";
export default function ActiveOverview() {
  const { state: s, navigate, act, openForm } = useApp(),
    { report, offer } = useStrikeActions();
  const pending = s.coffee.filter(
    c => c.activeId === s.user.id && c.status === "pending"
  );
  const tasks = s.makeups.filter(t => t.ownerId === s.user.id);
  const upcoming = s.events
    .filter(e => Date.parse(e.endsAt) > Date.now())
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 3);
  const openMakeups = () =>
    navigate("accountability", { tab: "makeups", filter: "mine" });
  const openChats = () => navigate("coffee");
  const pledges = s.users.filter(u => u.role === "pledge").length,
    met = s.coffee.filter(
      c => c.activeId === s.user.id && c.status === "complete"
    ).length;
  const review = (c: (typeof pending)[number], status: string) => {
    const p = findUser(s, c.pledgeId),
      first = p?.name.split(" ")[0];
    openForm(
      status === "complete"
        ? {
            title: `Confirm you met ${p?.name}?`,
            description: "This counts toward their coffee chats.",
            fields: [],
            submit: "Yes, we met",
            onSubmit: () =>
              act(
                "coffee.update",
                { id: c.id, status },
                `Chat with ${first} confirmed`
              ),
          }
        : {
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
                { id: c.id, status, note: v.note },
                `Chat with ${first} rejected`
              ),
          }
    );
  };
  return (
    <>
      <PageHead
        eyebrow="SIGMA ETA PI · ACTIVE DASHBOARD"
        title={`Hi, ${s.user.name.split(" ")[0]}.`}
        description="Meet the new class and confirm the chats you’ve had."
      />
      <section className="active-actions" aria-label="Active member actions">
        <button className="active-action" onClick={openChats}>
          <CoffeeIcon size={25} />
          <strong>
            {pending.length ? "Confirm coffee chats" : "Coffee chats"}
          </strong>
          <span>
            {pending.length
              ? `${pending.length} waiting for you to confirm`
              : `You’ve met ${met} of ${pledges} pledges`}
          </span>
          <ArrowRightIcon size={19} />
        </button>
        <button className="active-action" onClick={() => navigate("calendar")}>
          <CalendarBlankIcon size={25} />
          <strong>Class calendar</strong>
          <span>See the class schedule and deadlines.</span>
          <ArrowRightIcon size={19} />
        </button>
        <button className="active-action" onClick={() => navigate("members")}>
          <UsersThreeIcon size={25} />
          <strong>Member profiles</strong>
          <span>Get to know the pledges before you meet.</span>
          <ArrowRightIcon size={19} />
        </button>
        <button className="active-action" onClick={offer}>
          <HandHeartIcon size={25} />
          <strong>Request a makeup</strong>
          <span>Offer one of your tasks for strike credit.</span>
          <ArrowRightIcon size={19} />
        </button>
        <button className="active-action" onClick={() => report()}>
          <FlagIcon size={25} />
          <strong>Report a strike</strong>
          <span>Record what happened for master review.</span>
          <ArrowRightIcon size={19} />
        </button>
      </section>
      <div className="overview-columns">
        <section className="panel overview-panel">
          <SectionHead
            title="Coffee chats to confirm"
            detail="Pledges who logged a chat with you."
            action={
              <Button variant="ghost" onClick={() => navigate("coffee")}>
                Class chats <ArrowRightIcon />
              </Button>
            }
          />
          {pending.length ? (
            pending.map(c => {
              const p = findUser(s, c.pledgeId);
              return (
                <div key={c.id} className="simple-row coffee-request">
                  <Avatar user={p} />
                  <span className="row-grow">
                    <strong>{p?.name}</strong>
                    <small>Says you met {dateLabel(c.date)}</small>
                    {c.note && <q className="coffee-message">{c.note}</q>}
                  </span>
                  <div className="row-actions">
                    <Button onClick={() => review(c, "complete")}>
                      <CheckCircleIcon />
                      Confirm
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => review(c, "declined")}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <Empty
              title="No chats waiting"
              description="When a pledge logs a chat with you, it appears here with their message."
            />
          )}
        </section>
        <section className="panel overview-panel">
          <SectionHead
            title="Your makeup tasks"
            action={
              <Button variant="ghost" onClick={openMakeups}>
                View all <ArrowRightIcon />
              </Button>
            }
          />
          {tasks.length ? (
            tasks.slice(0, 4).map(t => (
              <button key={t.id} className="simple-row" onClick={openMakeups}>
                <span className="row-grow">
                  <strong>{t.title}</strong>
                  <small>
                    {t.pledgeId
                      ? findUser(s, t.pledgeId)?.name
                      : "Not assigned"}{" "}
                    · Due {dateLabel(t.dueAt)}
                  </small>
                </span>
                <Badge status={t.status} />
              </button>
            ))
          ) : (
            <Empty
              title="Have a task for the class?"
              description="Request a makeup opportunity. Pledge masters approve it before a pledge claims it."
              action={
                <Button variant="secondary" onClick={offer}>
                  Request a makeup
                </Button>
              }
            />
          )}
        </section>
      </div>
      <section className="panel overview-panel">
        <SectionHead
          title="Coming up"
          action={
            <Button variant="ghost" onClick={() => navigate("calendar")}>
              Full calendar <ArrowRightIcon />
            </Button>
          }
        />
        {upcoming.length ? (
          upcoming.map(e => (
            <button
              key={e.id}
              className="simple-row"
              onClick={() => navigate("calendar", { focusId: e.id })}
            >
              <span className="date-chip">{dateLabel(e.startsAt)}</span>
              <span className="row-grow">
                <strong>{e.title}</strong>
                <small>{e.location}</small>
              </span>
              <ArrowRightIcon />
            </button>
          ))
        ) : (
          <p className="quiet-note">
            Your pledge masters will add the class schedule here.
          </p>
        )}
      </section>
    </>
  );
}
