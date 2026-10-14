import { SkeletonForm } from "@/components/DashboardSkeleton";
import { MotionDialog, SurfaceTransition, MotionTabs } from "./motion";
import { useEffect, useState } from "react";
import {
  XIcon,
  PlusIcon,
  CheckIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react";
import { useApp } from "../context";
import type { User } from "../types";
import { Button } from "./ui";
import { chapterPhotoForName } from "@/data/chapter-members";
const commonDetails = [
  "Birthday",
  "Minor",
  "Hobbies",
  "Career Interests",
  "Favorite Foods",
  "Favorite Movies",
  "Favorite Book",
  "Favorite Music",
  "Favorite Snacks",
  "Drinks",
  "Dream Job",
  "Dream Vacation",
  "Hometown",
  "Life Goal",
];
const coreDetails = new Set([
  "Name",
  "Phone",
  "Email",
  "Major",
  "Year",
  "Class",
  "Status",
  "Position",
  "Role",
  "Title",
  "LinkedIn",
  "Instagram",
  "Hometown",
]);
export default function ProfileEditor({
  user,
  managed = false,
  welcome = false,
  onClose,
  onSaved,
  onRemoved,
}: {
  user: User;
  managed?: boolean;
  /** First-time setup: same form, worded as creating a profile. */
  welcome?: boolean;
  onClose: () => void;
  onSaved: (user: User) => void;
  onRemoved?: () => void;
}) {
  const { state: appState } = useApp();
  const [draft, setDraft] = useState<User>(structuredClone(user));
  const [changedImages, setChangedImages] = useState<string[]>([]);
  const [tab, setTab] = useState("basics"),
    [tag, setTag] = useState(""),
    [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [remove, setRemove] = useState(false),
    [dirty, setDirty] = useState(false);
  const endpoint = managed
    ? `/api/process/profile/pledges/${encodeURIComponent(user.id)}`
    : "/api/process/profile";
  useEffect(() => {
    let cancelled = false;
    fetch(endpoint)
      .then(async r => {
        if (!r.ok) throw new Error("Could not load this profile.");
        return r.json();
      })
      .then(p => {
        if (!cancelled) {
          setDraft(p);
          setLoading(false);
        }
      })
      .catch(e => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [endpoint]);
  const update = (key: keyof User, value: unknown) => {
    if (["photoUrl", "coverUrl"].includes(key))
      setChangedImages(keys => [...new Set([...keys, key])]);
    setDraft(d => ({ ...d, [key]: value }));
    setDirty(true);
  };
  const sections = (draft.profileSections || []).filter(
    s => !coreDetails.has(s.title)
  );
  const updateSections = (next: typeof sections) =>
    update("profileSections", next);
  const field = (
    key: keyof User,
    label: string,
    type = "text",
    placeholder = ""
  ) => (
    <label className="profile-field">
      <span>{label}</span>
      <input
        type={type}
        value={String(draft[key] || "")}
        placeholder={placeholder}
        maxLength={key === "linkedin" || key === "instagram" ? 2000 : 150}
        required={key === "name"}
        onChange={e => update(key, e.target.value)}
      />
    </label>
  );
  async function file(key: "photoUrl" | "coverUrl", image?: File) {
    if (!image) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(image.type) ||
      image.size > 2 * 1024 * 1024
    ) {
      setError("Choose a JPG, PNG, or WebP image under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      update(key, reader.result as string);
      setError("");
    };
    reader.readAsDataURL(image);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const keys = [
      "name",
      "phone",
      "contactEmail",
      "major",
      "year",
      "hometown",
      "bio",
      "linkedin",
      "instagram",
      "pledgeClass",
      "photoUrl",
      "coverUrl",
      "coverPosition",
      "profileTags",
      "profileSections",
      "profileImages",
    ] as const;
    const body = Object.fromEntries(
      keys
        .filter(
          k =>
            !["photoUrl", "coverUrl"].includes(k) || changedImages.includes(k)
        )
        .map(k => [
          k,
          k === "profileSections"
            ? sections
            : (draft[k] ??
              (["profileTags", "profileImages"].includes(k)
                ? []
                : k === "coverPosition"
                  ? "center 50%"
                  : "")),
        ])
    );
    try {
      const r = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error || "Could not save profile.");
      onSaved(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function archive() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(endpoint, { method: "DELETE" });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error || "Could not remove pledge.");
      onRemoved?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const displayPhoto =
    draft.photoEdited || changedImages.includes("photoUrl")
      ? draft.photoUrl
      : chapterPhotoForName(draft.directoryName || draft.name) ||
        draft.photoUrl;
  const close = () => {
    if (busy) return;
    if (!dirty || window.confirm("Discard your unsaved profile changes?"))
      onClose();
  };
  return (
    <MotionDialog
      className="profile-editor"
      labelledBy="profile-editor-title"
      onClose={close}
      busy={busy}
      dismissOutside={false}
    >
      <form onSubmit={save}>
        <div className="profile-editor-top">
          <div>
            <p className="eyebrow">
              {managed ? "PLEDGE PROFILE" : "YOUR PROFILE"}
            </p>
            <h2 id="profile-editor-title">
              {managed
                ? `Edit ${user.name}`
                : welcome
                  ? "Create your profile"
                  : "Edit my profile"}
            </h2>
            <p>Share the details you want your chapter to know.</p>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Close profile editor"
            onClick={close}
          >
            <XIcon size={22} />
          </button>
        </div>
        <MotionTabs
          className="profile-editor-tabs"
          role="tablist"
          aria-label="Profile sections"
        >
          {[
            ["basics", "Basics & tags"],
            ["details", "More about me"],
            ["photos", "Photos & header"],
          ].map(([id, label]) => (
            <button
              type="button"
              key={id}
              role="tab"
              tabIndex={tab === id ? 0 : -1}
              onKeyDown={e => {
                const ids = ["basics", "details", "photos"];
                let next = ids.indexOf(id);
                if (e.key === "ArrowRight") next = (next + 1) % ids.length;
                else if (e.key === "ArrowLeft")
                  next = (next + ids.length - 1) % ids.length;
                else if (e.key === "Home") next = 0;
                else if (e.key === "End") next = ids.length - 1;
                else return;
                e.preventDefault();
                setTab(ids[next]);
                e.currentTarget.parentElement
                  ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
                  [next]?.focus();
              }}
              aria-selected={tab === id}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </MotionTabs>
        <SurfaceTransition identity={tab} className="profile-editor-body">
          {loading && !error && (
            <SkeletonForm fields={5} label="Loading profile" />
          )}
          <fieldset
            hidden={loading && !error}
            disabled={loading || busy}
            className="profile-editor-fields"
          >
            {error && (
              <p role="alert" className="profile-error">
                {error}
              </p>
            )}
            {tab === "basics" && (
              <>
                <div className="profile-form-grid">
                  {field("name", "Name")}
                  {field("phone", "Phone number", "tel")}
                  {field(
                    "contactEmail",
                    "Contact email",
                    "email",
                    draft.email || ""
                  )}
                  {field("major", "Major")}
                  {field("year", "Year", "text", "e.g. Junior or 2028")}
                  {field("hometown", "Hometown")}
                  {field(
                    "linkedin",
                    "LinkedIn",
                    "url",
                    "https://www.linkedin.com/in/…"
                  )}
                  {field("instagram", "Instagram")}
                </div>
                <p className="quiet-note">
                  {appState.demo
                    ? "Imported email (demo)"
                    : "Google sign-in email"}
                  : {user.email || "Not set"}
                </p>
                <fieldset className="profile-tag-field">
                  <legend>Class tag</legend>
                  <div className="profile-tag-options">
                    {[
                      ...new Set(
                        [
                          "Founder",
                          "Founding",
                          "Alpha",
                          draft.pledgeClass,
                        ].filter(Boolean)
                      ),
                    ].map(c => (
                      <button
                        type="button"
                        key={c}
                        aria-pressed={draft.pledgeClass === c}
                        className={`profile-tag ${draft.pledgeClass === c ? "selected" : ""}`}
                        onClick={() => update("pledgeClass", c)}
                      >
                        {draft.pledgeClass === c && <CheckIcon size={14} />} {c}
                      </button>
                    ))}
                  </div>
                  <label className="profile-field">
                    <span>Class name</span>
                    <input
                      aria-label="Class name"
                      maxLength={50}
                      value={draft.pledgeClass || ""}
                      onChange={e => update("pledgeClass", e.target.value)}
                      placeholder="Choose a class above or add a new one"
                    />
                  </label>
                </fieldset>
                <fieldset className="profile-tag-field">
                  <legend>Tags</legend>
                  <p className="quiet-note">
                    Interests, skills, or what you’re working on.
                  </p>
                  <div className="profile-tag-options">
                    {(draft.profileTags || []).map(t => (
                      <button
                        type="button"
                        key={t}
                        className="profile-tag selected"
                        aria-label={`Remove tag ${t}`}
                        onClick={() =>
                          update(
                            "profileTags",
                            draft.profileTags?.filter(v => v !== t)
                          )
                        }
                      >
                        {t}
                        <XIcon size={14} />
                      </button>
                    ))}
                  </div>
                  <div className="profile-add-row">
                    <input
                      aria-label="New profile tag"
                      placeholder="e.g. Design, Startups, Climbing"
                      value={tag}
                      maxLength={40}
                      onChange={e => setTag(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (
                            tag.trim() &&
                            (draft.profileTags?.length || 0) < 12
                          ) {
                            update("profileTags", [
                              ...new Set([
                                ...(draft.profileTags || []),
                                tag.trim(),
                              ]),
                            ]);
                            setTag("");
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={
                        !tag.trim() || (draft.profileTags?.length || 0) >= 12
                      }
                      onClick={() => {
                        update("profileTags", [
                          ...new Set([
                            ...(draft.profileTags || []),
                            tag.trim(),
                          ]),
                        ]);
                        setTag("");
                      }}
                    >
                      <PlusIcon />
                      Add tag
                    </Button>
                  </div>
                </fieldset>
                <label className="profile-field">
                  <span>About me</span>
                  <textarea
                    rows={4}
                    value={draft.bio || ""}
                    maxLength={5000}
                    onChange={e => update("bio", e.target.value)}
                    placeholder="A short introduction…"
                  />
                </label>
              </>
            )}
            {tab === "details" && (
              <>
                <p className="quiet-note">
                  Your imported details are here. Edit them, remove anything, or
                  add a new detail.
                </p>
                {sections.map((section, index) => (
                  <div className="profile-detail-editor" key={index}>
                    <div className="profile-add-row">
                      <input
                        aria-label={`Detail ${index + 1} title`}
                        value={section.title}
                        maxLength={80}
                        onChange={e =>
                          updateSections(
                            sections.map((s, i) =>
                              i === index ? { ...s, title: e.target.value } : s
                            )
                          )
                        }
                      />
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Remove ${section.title}`}
                        onClick={() =>
                          updateSections(sections.filter((_, i) => i !== index))
                        }
                      >
                        <XIcon size={18} />
                      </button>
                    </div>
                    <textarea
                      aria-label={section.title}
                      rows={3}
                      maxLength={5000}
                      value={section.body}
                      onChange={e =>
                        updateSections(
                          sections.map((s, i) =>
                            i === index ? { ...s, body: e.target.value } : s
                          )
                        )
                      }
                    />
                    {section.images?.map(url => (
                      <img
                        key={url}
                        src={url}
                        alt={section.title}
                        className="profile-edit-thumb"
                      />
                    ))}
                  </div>
                ))}
                <div className="profile-add-row">
                  <input
                    list="profile-detail-options"
                    aria-label="New detail name"
                    placeholder="Add a detail, e.g. Hobbies"
                    value={detail}
                    maxLength={80}
                    onChange={e => setDetail(e.target.value)}
                  />
                  <datalist id="profile-detail-options">
                    {commonDetails
                      .filter(t => !sections.some(s => s.title === t))
                      .map(t => (
                        <option key={t} value={t} />
                      ))}
                  </datalist>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={!detail.trim()}
                    onClick={() => {
                      updateSections([
                        ...sections,
                        { title: detail.trim(), body: "" },
                      ]);
                      setDetail("");
                    }}
                  >
                    <PlusIcon />
                    Add detail
                  </Button>
                </div>
              </>
            )}
            {tab === "photos" && (
              <>
                <p className="quiet-note">
                  Your profile photo overlaps your header. JPG, PNG, or WebP, up
                  to 2 MB each.
                </p>
                {(
                  [
                    ["photoUrl", "Profile photo"],
                    ["coverUrl", "Header photo"],
                  ] as const
                ).map(([key, label]) => (
                  <section className="profile-photo-editor" key={key}>
                    <h3>{label}</h3>
                    {(key === "photoUrl" ? displayPhoto : draft[key]) && (
                      <img
                        src={key === "photoUrl" ? displayPhoto : draft[key]}
                        alt={label}
                        className={
                          key === "photoUrl"
                            ? "profile-edit-portrait"
                            : "profile-edit-cover"
                        }
                      />
                    )}
                    <label className="profile-upload">
                      <PencilSimpleIcon /> Choose photo
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={e => void file(key, e.target.files?.[0])}
                      />
                    </label>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => update(key, "")}
                    >
                      Remove photo
                    </button>
                    <label className="profile-field">
                      <span>Or use an image link</span>
                      <input
                        aria-label={`${label} URL`}
                        value={
                          draft[key]?.startsWith("data:")
                            ? ""
                            : draft[key] || ""
                        }
                        placeholder="https://…"
                        onChange={e => update(key, e.target.value)}
                      />
                    </label>
                  </section>
                ))}
              </>
            )}
            {managed && onRemoved && (
              <section className="profile-remove">
                <h3>Process membership</h3>
                <p>
                  Remove this pledge from the current process. Their history is
                  retained and a pledge master can restore them.
                </p>
                {remove ? (
                  <div className="profile-add-row">
                    <Button
                      type="button"
                      disabled={busy}
                      onClick={() => void archive()}
                    >
                      Remove {user.name.split(" ")[0]}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setRemove(false)}
                    >
                      Keep in process
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => setRemove(true)}
                  >
                    Remove from process
                  </button>
                )}
              </section>
            )}
          </fieldset>
        </SurfaceTransition>
        <footer className="profile-editor-footer">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={close}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={busy || loading}>
            {busy ? "Saving…" : welcome ? "Save and continue" : "Save profile"}
          </Button>
        </footer>
      </form>
    </MotionDialog>
  );
}
