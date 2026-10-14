import { MotionTabs, SurfaceTransition } from "../components/motion";
import { useEffect, useState } from "react";
import {
  CalendarBlankIcon,
  CaretLeftIcon,
  CaretRightIcon,
  DownloadSimpleIcon,
  MapPinIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { useApp } from "../context";
import { canOpenPage } from "../routing";
import { Badge, Button, Empty, PageHead } from "../components/ui";
import {
  dateKey,
  dateLabel,
  exportCalendar,
  findUser,
  inputDate,
  timeLabel,
  toISO,
  tomorrowInput,
} from "../lib";
import type { Event, Field } from "../types";
export default function Calendar() {
  const { state: s, act, openForm, notify, navigate, intent } = useApp();
  const weekStart = (date: Date) => {
    const d = new Date(date);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
  };
  const weekOffset = (iso: string) =>
    Math.round(
      (weekStart(new Date(iso)).getTime() - weekStart(new Date()).getTime()) /
        604800000
    );
  const focused = s.events.find(e => e.id === intent?.focusId);
  // A button that names an event opens on that event's week.
  const [offset, setOffset] = useState(
    focused ? weekOffset(focused.startsAt) : 0
  );
  const [view, setView] = useState("agenda");
  const [filter, setFilter] = useState("all");
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropDay, setDropDay] = useState("");
  const master = s.user.role === "master";
  const first = new Date();
  first.setHours(12, 0, 0, 0);
  first.setDate(first.getDate() - ((first.getDay() + 6) % 7) + offset * 7);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(first);
    d.setDate(d.getDate() + i);
    return d;
  });
  function edit(e?: Event) {
    if (e && !master) {
      openForm({
        title: e.title,
        description: `${dateLabel(e.startsAt, { weekday: "long", month: "long", day: "numeric" })}, ${timeLabel(e.startsAt)}–${timeLabel(e.endsAt)} · ${e.location}\n\n${e.description}`,
        submit: "Save availability",
        fields: [
          {
            name: "status",
            label: "Will you be there?",
            type: "select",
            value: e.rsvps[s.user.id] || "going",
            options: [
              { value: "going", label: "I’ll be there" },
              { value: "unavailable", label: "I have a conflict" },
            ],
          },
        ],
        onSubmit: v =>
          act("event.rsvp", { id: e.id, ...v }, "Availability updated"),
      });
      return;
    }
    const fields: Field[] = [
      { name: "title", label: "Event name", value: e?.title },
      {
        name: "startsAt",
        label: "Starts",
        type: "datetime-local",
        value: e ? inputDate(e.startsAt) : tomorrowInput(),
        help: "Enter times in your device’s local timezone.",
      },
      {
        name: "endsAt",
        label: "Ends",
        type: "datetime-local",
        value: e
          ? inputDate(e.endsAt)
          : inputDate(
              new Date(
                Date.parse(toISO(tomorrowInput())) + 3600000
              ).toISOString()
            ),
      },
      { name: "location", label: "Location", value: e?.location },
      {
        name: "eventType",
        label: "Event type",
        type: "select",
        value: e?.type || "chapter",
        options: ["chapter", "workshop", "social", "milestone"].map(v => ({
          value: v,
          label: v[0].toUpperCase() + v.slice(1),
        })),
      },
      {
        name: "description",
        label: "What to know",
        type: "textarea",
        value: e?.description,
      },
    ];
    openForm({
      title: e ? "Edit event" : "Make room for something good",
      description: e
        ? `${Object.values(e.rsvps).filter(v => v === "going").length} attending · ${Object.values(e.rsvps).filter(v => v === "unavailable").length} with a conflict`
        : undefined,
      fields,
      submit: e ? "Save event" : "Create event",
      onSubmit: v =>
        act(
          e ? "event.update" : "event.create",
          {
            ...v,
            id: e?.id,
            startsAt: toISO(v.startsAt),
            endsAt: toISO(v.endsAt),
          },
          "Calendar updated"
        ),
    });
  }
  const items = [
    ...s.events.map(e => ({
      id: e.id,
      title: e.title,
      start: e.startsAt,
      end: e.endsAt,
      location: e.location,
      type: e.type,
      group: "events",
      event: e,
    })),
    ...s.deliverables.map(d => ({
      id: d.id,
      title: d.title,
      start: d.dueAt,
      end: d.dueAt,
      location: "Deliverable due",
      type: "deadline",
      group: "deadlines",
      event: undefined,
    })),
    ...s.makeups
      .filter(
        t =>
          t.pledgeId &&
          (master || t.pledgeId === s.user.id || t.ownerId === s.user.id) &&
          !["approved", "completed", "rejected", "cancelled"].includes(t.status)
      )
      .map(t => ({
        id: t.id,
        title: t.title,
        start: t.dueAt,
        end: t.dueAt,
        location: "Makeup due",
        type: "deadline",
        group: "makeups",
        event: undefined,
      })),
  ]
    .filter(e => filter === "all" || e.group === filter)
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  async function drop(day: Date, id: string) {
    const e = s.events.find(e => e.id === id);
    setDropDay("");
    setDragging(null);
    if (!e || !master) return;
    const from = new Date(e.startsAt),
      to = new Date(day);
    to.setHours(from.getHours(), from.getMinutes(), 0, 0);
    const duration = Date.parse(e.endsAt) - Date.parse(e.startsAt);
    try {
      await act(
        "event.update",
        {
          ...e,
          eventType: e.type,
          startsAt: to.toISOString(),
          endsAt: new Date(to.getTime() + duration).toISOString(),
        },
        "Event moved"
      );
    } catch (err) {
      notify((err as Error).message);
    }
  }
  function details(item: (typeof items)[number]) {
    if (item.event) edit(item.event);
    else
      openForm({
        title: item.title,
        description: `${dateLabel(item.start)} at ${timeLabel(item.start)} · ${item.location}`,
        fields: [],
        ...(item.group === "deadlines" &&
        !canOpenPage(s.user.role, "deliverables")
          ? { submit: "Got it", info: true, onSubmit: async () => {} }
          : {
              submit:
                item.group === "deadlines"
                  ? "Open this deliverable"
                  : "Open this makeup",
              onSubmit: async () =>
                item.group === "deadlines"
                  ? navigate("deliverables", { focusId: item.id })
                  : navigate("accountability", {
                      tab: "makeups",
                      filter: "all",
                      focusId: item.id,
                    }),
            }),
      });
  }
  useEffect(() => {
    if (focused) edit(focused);
    // Opens once for the event the previous page pointed at.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const nextItem = items.find(
    item =>
      Date.parse(item.start) > Date.now() && weekOffset(item.start) !== offset
  );
  return (
    <>
      <PageHead
        eyebrow="MAKE TIME FOR WHAT MATTERS"
        title="Calendar"
        description="Chapter events, deliverables, and makeup deadlines."
        action={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                exportCalendar(s);
                notify(
                  "Calendar downloaded. Import it into your calendar app."
                );
              }}
            >
              <DownloadSimpleIcon size={18} />
              Export calendar
            </Button>
            {master && (
              <Button onClick={() => edit()}>
                <PlusIcon size={18} />
                Add event
              </Button>
            )}
          </>
        }
      />
      <div className="calendar-controls">
        <div className="calendar-date-control">
          <div className="button-group">
            <button
              aria-label="Previous week"
              onClick={() => setOffset(o => o - 1)}
            >
              <CaretLeftIcon />
            </button>
            <button
              aria-label="Next week"
              onClick={() => setOffset(o => o + 1)}
            >
              <CaretRightIcon />
            </button>
          </div>
          <h2>
            {new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              timeZone: "America/Los_Angeles",
            }).formatRange(first, days[6])}
          </h2>
          <Button variant="secondary" onClick={() => setOffset(0)}>
            Today
          </Button>
        </div>
        <MotionTabs className="tabs compact">
          <button
            className={view === "week" ? "active" : ""}
            onClick={() => setView("week")}
          >
            Week
          </button>
          <button
            className={view === "agenda" ? "active" : ""}
            onClick={() => setView("agenda")}
          >
            Agenda
          </button>
        </MotionTabs>
      </div>
      <div className="calendar-filter-row">
        <div className="filter-pills">
          {[
            ["all", "Everything"],
            ["events", "Chapter events"],
            ["deadlines", "Deliverables"],
            ["makeups", "Makeups"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={filter === id ? "selected" : ""}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="muted text-xs">
          Pacific Time ·{" "}
          {master
            ? "Drag events to reschedule, or click to edit"
            : "Click an event to RSVP"}
        </span>
      </div>
      <SurfaceTransition identity={`${view}:${offset}:${filter}`}>
        {view === "week" ? (
          <div className="calendar-scroll">
            <div className="week-calendar">
              {days.map(day => {
                const key = dateKey(day);
                const today = key === dateKey(new Date());
                const daily = items.filter(e => dateKey(e.start) === key);
                return (
                  <div
                    key={key}
                    className={`calendar-day ${today ? "is-today" : ""} ${dropDay === key ? "drop-target" : ""}`}
                    onDragOver={e => {
                      if (master && dragging) {
                        e.preventDefault();
                        setDropDay(key);
                      }
                    }}
                    onDragLeave={() => setDropDay("")}
                    onDrop={e => {
                      e.preventDefault();
                      void drop(day, e.dataTransfer.getData("text/plain"));
                    }}
                  >
                    <div className="calendar-day-head">
                      <span>
                        {dateLabel(day.toISOString(), { weekday: "short" })}
                      </span>
                      <strong>{day.getDate()}</strong>
                      {today && <i />}
                    </div>
                    <div className="calendar-day-body">
                      {daily.map(item => (
                        <button
                          key={item.id}
                          className={`calendar-event event-${item.type}`}
                          draggable={master && !!item.event}
                          onDragStart={e => {
                            e.dataTransfer.setData("text/plain", item.id);
                            setDragging(item.id);
                          }}
                          onDragEnd={() => {
                            setDragging(null);
                            setDropDay("");
                          }}
                          onClick={() => details(item)}
                        >
                          <span className="event-time">
                            {timeLabel(item.start)}
                          </span>
                          <strong>{item.title}</strong>
                          <span className="event-location">
                            {item.location}
                          </span>
                          <span className="event-type">
                            {item.type === "deadline" ? "Due" : item.type}
                          </span>
                        </button>
                      ))}
                      {!daily.length && (
                        <span className="free-day">
                          A little breathing room
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {days.map(day => {
              const daily = items.filter(
                e => dateKey(e.start) === dateKey(day)
              );
              return (
                daily.length > 0 && (
                  <section key={dateKey(day)}>
                    <h3 className="agenda-date">
                      {dateLabel(day.toISOString(), {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </h3>
                    <div className="panel">
                      {daily.map(item => (
                        <button
                          className="agenda-row"
                          key={item.id}
                          onClick={() => details(item)}
                        >
                          <span className="agenda-time">
                            {timeLabel(item.start)}
                          </span>
                          <div>
                            <strong>{item.title}</strong>
                            <small>
                              <MapPinIcon size={13} />
                              {item.location}
                            </small>
                          </div>
                          <Badge status={item.type}>{item.type}</Badge>
                        </button>
                      ))}
                    </div>
                  </section>
                )
              );
            })}
            {!items.some(item =>
              days.some(day => dateKey(day) === dateKey(item.start))
            ) && (
              <Empty
                title="Nothing on the calendar this week"
                description={
                  nextItem
                    ? `Next up: ${nextItem.title}, ${dateLabel(nextItem.start, { weekday: "long", month: "long", day: "numeric" })}.`
                    : master
                      ? "Add an event to start the class schedule."
                      : "Your pledge masters haven’t scheduled anything else yet."
                }
                action={
                  <>
                    {nextItem && (
                      <Button
                        variant="secondary"
                        onClick={() => setOffset(weekOffset(nextItem.start))}
                      >
                        Go to that week
                      </Button>
                    )}
                    {master && (
                      <Button onClick={() => edit()}>Add an event</Button>
                    )}
                  </>
                }
              />
            )}
          </div>
        )}
      </SurfaceTransition>
      <div className="calendar-bottom-note">
        <CalendarBlankIcon size={18} />
        <p>
          Export includes chapter events, deliverables, and assigned makeup
          deadlines. Export again when the schedule changes.
        </p>
      </div>
    </>
  );
}
