import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  CameraIcon,
  ChatCircleTextIcon,
  IdentificationCardIcon,
} from "@phosphor-icons/react";
import { useApp } from "../context";
import { Avatar, Button } from "./ui";
import ProfileEditor from "./ProfileEditor";

/** A pledge's first stop: create a profile before the rest of the dashboard. */
export default function ProfileWelcome({ onLater }: { onLater: () => void }) {
  const { state: s, refresh, notify } = useApp();
  const [editing, setEditing] = useState(false);
  return (
    <section className="panel profile-welcome">
      <Avatar user={s.user} size="lg" />
      <p className="eyebrow">
        {s.settings.cohort} · {s.settings.term}
      </p>
      <h1>Welcome, {s.user.name.split(" ")[0]}. Start with your profile.</h1>
      <p>
        Actives look you up before a coffee chat, and your class uses it to
        reach you. It takes a couple of minutes.
      </p>
      <ul>
        <li>
          <IdentificationCardIcon size={20} />
          Your name, major, year and hometown
        </li>
        <li>
          <ChatCircleTextIcon size={20} />
          A phone number so actives can text you
        </li>
        <li>
          <CameraIcon size={20} />A photo and a short intro
        </li>
      </ul>
      <div className="row-actions">
        <Button onClick={() => setEditing(true)}>Create my profile</Button>
        <Button variant="ghost" onClick={onLater}>
          I’ll do this later
        </Button>
      </div>
      <AnimatePresence>
        {editing && (
          <ProfileEditor
            user={s.user}
            welcome
            onClose={() => setEditing(false)}
            onSaved={() => {
              setEditing(false);
              notify("Profile created. Welcome to the class.");
              void refresh().catch(() => {});
            }}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
