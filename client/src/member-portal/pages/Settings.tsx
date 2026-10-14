import AIConnection from "../components/AIConnection";
import { useState } from "react";
import {
  ClockIcon,
  DeviceMobileIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import { useApp } from "../context";
import { Button, PageHead, SectionHead } from "../components/ui";
import { dateLabel, findUser } from "../lib";
export default function Settings() {
  const { state: s, act } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const actives = s.users.filter(u => u.role !== "pledge").length;
  return (
    <>
      <PageHead
        eyebrow="MAKE IT YOUR PROCESS"
        title="Process settings"
        description="Set the expectations. Keep everyone on the same page."
      />
      <div className="settings-layout">
        <form
          className="panel settings-form"
          onSubmit={async e => {
            e.preventDefault();
            setBusy(true);
            setError("");
            const v = Object.fromEntries(new FormData(e.currentTarget));
            try {
              await act(
                "settings.update",
                { ...v, coffeeGoal: Number(v.coffeeGoal) },
                "Your process settings are saved"
              );
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <SectionHead
            title="Your class"
            detail="These details appear throughout the member experience."
          />
          <div className="form-fields">
            <div className="form-two">
              <label className="field">
                <span>Class name</span>
                <input
                  name="cohort"
                  required
                  defaultValue={s.settings.cohort}
                  maxLength={80}
                />
              </label>
              <label className="field">
                <span>Term</span>
                <input
                  name="term"
                  required
                  defaultValue={s.settings.term}
                  maxLength={80}
                />
              </label>
            </div>
            <label className="field">
              <span>Chapter</span>
              <input
                name="chapter"
                required
                defaultValue={s.settings.chapter}
                maxLength={120}
              />
            </label>
            <div className="form-two">
              <label className="field">
                <span>Process starts</span>
                <input
                  name="startDate"
                  type="date"
                  required
                  defaultValue={s.settings.startDate}
                />
              </label>
              <label className="field">
                <span>Process ends</span>
                <input
                  name="endDate"
                  type="date"
                  required
                  defaultValue={s.settings.endDate}
                />
              </label>
            </div>
            <label className="field">
              <span>Coffee chats each pledge needs</span>
              <input
                name="coffeeGoal"
                type="number"
                inputMode="numeric"
                required
                min={1}
                max={100}
                defaultValue={s.settings.coffeeTarget ?? s.settings.coffeeGoal}
              />
              <small>
                Pledges choose which actives to meet. A chat counts once that
                active confirms it. There are {actives} actives and pledge
                masters right now
                {actives < (s.settings.coffeeTarget ?? 0)
                  ? `, so pledges currently need ${s.settings.coffeeGoal}.`
                  : "."}
              </small>
            </label>
            <label className="field">
              <span>Welcome headline</span>
              <input
                name="welcome"
                required
                defaultValue={s.settings.welcome}
                maxLength={120}
              />
            </label>
            <label className="field">
              <span>Message to your class</span>
              <textarea
                name="announcement"
                rows={5}
                required
                defaultValue={s.settings.announcement}
                maxLength={2000}
              />
              <small>This announcement appears on every pledge’s Overview.</small>
            </label>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="settings-save">
            <Button disabled={busy} type="submit">
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
        <aside className="space-y-5">
          <AIConnection />
          <section className="panel settings-aside">
            <ShieldCheckIcon size={26} />
            <h3>Clear roles, clear ownership.</h3>
            <p>
              Pledges log their own chats and work. Actives confirm their chats and
              verify their makeup tasks. Pledge masters review reports, award
              credit, and manage the process.
            </p>
          </section>
          <section className="panel settings-aside">
            <DeviceMobileIcon size={26} />
            <h3>Your chapter, in your pocket.</h3>
            <p>
              Open the website on your phone and use your browser’s share menu
              to add it to your home screen.
            </p>
            <small>
              Live access requires a connection. Native push notifications are
              not enabled.
            </small>
          </section>
          <section className="panel settings-aside">
            <ClockIcon size={26} />
            <h3>Activity history</h3>
            <div className="audit-list">
              {s.audit.slice(0, 10).map(a => (
                <div key={a.id}>
                  <strong>{a.subject}</strong>
                  <span>
                    {findUser(s, a.actor)?.name} · {dateLabel(a.at)}
                  </span>
                </div>
              ))}
              {!s.audit.length && <p>Changes will appear here.</p>}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
