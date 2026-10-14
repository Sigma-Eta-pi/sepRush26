import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MotionDialog, MotionTabs, fluidSpring } from "../components/motion";
import {
  PUBLIC_CHAPTER_MEMBERS,
  photoFor,
  chapterPhotoForName,
  chapterRoleForName,
  chapterMemberForName,
  chapterClassForName,
} from "@/data/chapter-members";
import type { User } from "../types";
import { useState, useEffect } from "react";
import {
  ChatCircleTextIcon,
  EnvelopeSimpleIcon,
  PencilSimpleIcon,
  ArrowUpRightIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useApp } from "../context";
import { Button, PageHead, Empty } from "../components/ui";
import { api, roleName } from "../lib";
import { sms } from "./Coffee";
import ProfileEditor from "../components/ProfileEditor";
type DirectoryMember = User & { publicRole?: string };
const directoryRole = (u: DirectoryMember) =>
  (u.role === "pledge" ? "Pledge" : u.publicRole) ||
  (u.membershipStatus === "Potential New Member"
    ? "Potential new member"
    : roleName(u.role));
const safeUrl = (url?: string) =>
  !!url && (/^https?:\/\//.test(url) || /^\/(?!\/)/.test(url));
const profileKey = (name: string) =>
  (chapterMemberForName(name)?.name || name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
function mergeDirectory(base: DirectoryMember[], imported: DirectoryMember[]) {
  const entries = new Map(
    base.map(u => [profileKey(u.directoryName || u.name), u])
  );
  for (const profile of imported) {
    const key = profileKey(profile.name),
      previous = entries.get(key);
    entries.set(key, {
      ...previous,
      ...profile,
      ...(previous?.profileEdited ? previous : {}),
      id: previous?.id || profile.id,
      name: previous?.name || profile.name,
      role: previous?.role || "active",
      pledgeClass: previous?.profileEdited
        ? previous.pledgeClass
        : (profile.pledgeClass ?? chapterClassForName(profile.name)),
      publicRole: chapterRoleForName(profile.name),
    });
  }
  return [...entries.values()];
}
const publicProfiles: DirectoryMember[] = PUBLIC_CHAPTER_MEMBERS.map(m => ({
  id: "public-" + m.photoSlug,
  name: m.name,
  role: "active",
  major: "",
  year: "",
  color: "blue",
  photoUrl: m.photoSlug ? photoFor(m.photoSlug) : undefined,
  linkedin: m.linkedin,
  publicRole: m.role,
  pledgeClass: chapterClassForName(m.name),
}));
function MemberPhoto({ member }: { member: DirectoryMember }) {
  const [failed, setFailed] = useState(false);
  const candidate =
    member.photoEdited && member.photoUrl !== undefined
      ? member.photoUrl
      : chapterPhotoForName(member.directoryName || member.name) ||
        member.photoUrl;
  const photo =
    candidate &&
    (/^https?:\/\//.test(candidate) ||
      /^data:image\/(jpeg|png|webp);base64,/.test(candidate) ||
      /^\/(?!\/)/.test(candidate))
      ? candidate
      : undefined;
  return (
    <div className="chapter-card-photo">
      {photo && !failed ? (
        <img
          src={photo}
          alt={member.name}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className="chapter-photo-initials"
          aria-label={`No photo for ${member.name}`}
        >
          {member.name
            .split(" ")
            .map(n => n[0])
            .slice(0, 2)
            .join("")}
        </span>
      )}
    </div>
  );
}
function MemberHeader({ member }: { member: DirectoryMember }) {
  const [failed, setFailed] = useState(false);
  const cover = member.coverUrl;
  const safeCover =
    cover &&
    (/^https?:\/\//.test(cover) ||
      /^data:image\/(jpeg|png|webp);base64,/.test(cover) ||
      /^\/(?!\/)/.test(cover));
  return (
    <div className="chapter-member-header">
      <div className="chapter-member-cover">
        {safeCover && !failed && (
          <img
            src={cover}
            alt=""
            loading="lazy"
            style={{ objectPosition: member.coverPosition || "center" }}
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <div className="chapter-member-pfp">
        <MemberPhoto member={member} />
      </div>
    </div>
  );
}
function ProfileDetails({
  member: u,
  onClose,
  onEdit,
}: {
  member: DirectoryMember;
  onEdit?: () => void;
  onClose: () => void;
}) {
  return (
    <MotionDialog
      className="chapter-profile-dialog"
      labelledBy="member-profile-title"
      onClose={onClose}
    >
      <button
        className="icon-button profile-close"
        aria-label="Close profile"
        onClick={onClose}
      >
        <XIcon size={22} />
      </button>
      <MemberHeader member={u} />
      <div className="chapter-profile-content">
        <div className="chapter-profile-identity">
          <p className="eyebrow">
            {directoryRole(u)}
            {u.pledgeClass ? ` · ${u.pledgeClass} class` : ""}
          </p>
          <h2 id="member-profile-title">{u.name}</h2>
          {(u.major || u.year) && (
            <p className="chapter-card-meta">
              {[u.major, u.year].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        {!!u.profileTags?.length && (
          <div className="profile-tag-options">
            {u.profileTags.map(tag => (
              <span key={tag} className="profile-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
        {u.bio && <p className="chapter-profile-bio">{u.bio}</p>}
        <div className="row-actions">
          {onEdit && (
            <Button variant="secondary" onClick={onEdit}>
              <PencilSimpleIcon /> Edit profile
            </Button>
          )}
          {sms(u) && (
            <a className="btn btn-primary" href={sms(u)!}>
              <ChatCircleTextIcon />
              Text {u.name.split(" ")[0]}
            </a>
          )}
          {(u.contactEmail || u.email) && (
            <a
              className="btn btn-secondary"
              href={"mailto:" + (u.contactEmail || u.email)}
            >
              <EnvelopeSimpleIcon />
              Email
            </a>
          )}
          {u.linkedin && /^https?:\/\//.test(u.linkedin) && (
            <a
              className="btn btn-secondary"
              href={u.linkedin}
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn <ArrowUpRightIcon />
            </a>
          )}
        </div>
        <dl className="chapter-profile-facts">
          {u.phone && (
            <div>
              <dt>Phone</dt>
              <dd>
                <a href={sms(u)!}>{u.phone}</a>
              </dd>
            </div>
          )}
          {(u.contactEmail || u.email) && (
            <div>
              <dt>Email</dt>
              <dd>
                <a href={"mailto:" + (u.contactEmail || u.email)}>
                  {u.contactEmail || u.email}
                </a>
              </dd>
            </div>
          )}
          {u.hometown && (
            <div>
              <dt>Hometown</dt>
              <dd>{u.hometown}</dd>
            </div>
          )}
          {u.instagram && (
            <div>
              <dt>Instagram</dt>
              <dd>{u.instagram}</dd>
            </div>
          )}
        </dl>
        {u.profileSections
          ?.filter(
            section =>
              ![
                "Phone",
                "Email",
                "Hometown",
                "Instagram",
                "LinkedIn",
                "Major",
                "Year",
                "Class",
                "Status",
                "Position",
                "Role",
                "Title",
              ].includes(section.title)
          )
          .map((section, index) => (
            <section
              className="chapter-profile-section"
              key={`${section.title}-${index}`}
            >
              <h3>{section.title}</h3>
              {section.body && <p>{section.body}</p>}
              {section.images?.filter(safeUrl).map(url => (
                <img
                  key={url}
                  className="chapter-extra-photo"
                  src={url}
                  alt={section.title}
                  loading="lazy"
                />
              ))}
              {section.links
                ?.filter(link => /^https?:\/\//.test(link.url))
                .map(link => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label} <ArrowUpRightIcon size={14} />
                  </a>
                ))}
            </section>
          ))}
        {u.profileImages
          ?.filter(
            url =>
              safeUrl(url) &&
              !u.profileSections?.some(section => section.images?.includes(url))
          )
          .map(url => (
            <img
              key={url}
              className="chapter-extra-photo"
              src={url}
              alt={`More from ${u.name}`}
              loading="lazy"
            />
          ))}
        {!u.phone && !u.email && !u.linkedin && (
          <p className="quiet-note">Contact details haven’t been added yet.</p>
        )}
      </div>
    </MotionDialog>
  );
}
export default function Members() {
  const reduceMotion = useReducedMotion();
  const { state: s, notify, refresh, intent } = useApp();
  const [editing, setEditing] = useState<User | null>(
    intent?.action === "edit-profile" ? s.user : null
  );
  const [restoring, setRestoring] = useState("");
  const [directory, setDirectory] = useState("chapter");
  const [selected, setSelected] = useState<DirectoryMember | null>(null);
  const [imported, setImported] = useState<DirectoryMember[]>([]);
  const [directoryError, setDirectoryError] = useState("");
  useEffect(() => {
    let cancelled = false;
    api<{ profiles: DirectoryMember[] }>("directory")
      .then(data => {
        if (!cancelled) setImported(data.profiles);
      })
      .catch(() => {
        if (!cancelled)
          setDirectoryError(
            "Notion profile details could not be loaded. Refresh to try again."
          );
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const showPublic =
    s.demo && s.demoRoster !== "chapter" && directory === "chapter";
  const base: DirectoryMember[] = showPublic
    ? publicProfiles
    : s.users.map(u => ({
        ...u,
        publicRole: chapterRoleForName(u.name),
      }));
  const members = (
    s.demoRoster === "chapter"
      ? base
      : !s.demo || showPublic
        ? mergeDirectory(base, imported)
        : base
  ).filter(
    user =>
      !s.archivedUsers?.some(
        archived =>
          profileKey(archived.directoryName || archived.name) ===
          profileKey(user.directoryName || user.name)
      )
  );
  const [query, setQuery] = useState(""),
    [role, setRole] = useState("all");
  const [memberClass, setMemberClass] = useState("all");
  const people = members.filter(
    u =>
      (role === "all" ||
        (role === "potential"
          ? u.membershipStatus === "Potential New Member"
          : u.role === role &&
            (role !== "active" ||
              u.membershipStatus !== "Potential New Member"))) &&
      (memberClass === "all" || u.pledgeClass === memberClass) &&
      `${u.name} ${u.major} ${u.pledgeClass} ${directoryRole(u)}`
        .toLowerCase()
        .includes(query.toLowerCase())
  );
  const edit = () => setEditing(s.user);
  const saved = async () => {
    setEditing(null);
    setSelected(null);
    await refresh();
    notify("Profile saved");
  };
  const removed = async () => {
    setEditing(null);
    setSelected(null);
    await refresh();
    notify("Pledge removed from the process. History retained.");
  };
  const canEdit = (member: User) =>
    member.id === s.user.id ||
    (s.user.role === "master" &&
      member.role === "pledge" &&
      s.users.some(u => u.id === member.id));
  return (
    <>
      <PageHead
        eyebrow="YOUR PEOPLE"
        title="The chapter"
        description="Faces, names, and the people behind the chapter."
        action={
          <>
            <Button variant="secondary" onClick={edit}>
              <PencilSimpleIcon />
              Edit my profile
            </Button>
            {s.user.role === "master" && (
              <Button
                aria-pressed={role === "pledge"}
                onClick={() => {
                  setDirectory("sample");
                  setRole(role === "pledge" ? "all" : "pledge");
                  setMemberClass("all");
                  setQuery("");
                }}
              >
                {role === "pledge" ? "Show everyone" : "Manage pledges"}
              </Button>
            )}
          </>
        }
      />
      {s.demo && s.demoRoster !== "chapter" && (
        <div className="chapter-preview-source">
          <MotionTabs className="segmented" aria-label="Directory preview">
            <button
              className={directory === "chapter" ? "active" : ""}
              onClick={() => {
                setDirectory("chapter");
                setRole("all");
                setMemberClass("all");
                setQuery("");
              }}
            >
              The chapter
            </button>
            <button
              className={directory === "sample" ? "active" : ""}
              onClick={() => {
                setDirectory("sample");
                setRole("all");
                setMemberClass("all");
                setQuery("");
              }}
            >
              Sample roster
            </button>
          </MotionTabs>
          <p className="quiet-note">
            {showPublic
              ? imported.length
                ? "Member details and photos from Notion. Current leadership from the SEP website."
                : "Existing public profiles from the SEP website. Process records remain fictional."
              : "Fictional members for trying the pledge process."}
          </p>
        </div>
      )}
      {directoryError && (
        <p role="alert" className="quiet-note">
          {directoryError}
        </p>
      )}
      <div className="coffee-toolbar">
        <input
          aria-label="Search members"
          placeholder="Search name, role, or major…"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
          }}
        />
        <select
          aria-label="Member role"
          value={role}
          onChange={e => {
            setRole(e.target.value);
          }}
        >
          <option value="all">Everyone ({members.length})</option>
          <option value="active">Actives</option>
          {members.some(u => u.membershipStatus === "Potential New Member") && (
            <option value="potential">Potential new members</option>
          )}
          {!showPublic && <option value="pledge">Pledges</option>}
          {!showPublic && <option value="master">Pledge masters</option>}
        </select>
        {(!s.demo || showPublic || s.demoRoster === "chapter") && (
          <select
            aria-label="Member class"
            value={memberClass}
            onChange={e => setMemberClass(e.target.value)}
          >
            <option value="all">All classes</option>
            {[
              ...new Set([
                "Founder",
                "Founding",
                "Alpha",
                ...members
                  .map(u => u.pledgeClass)
                  .filter((v): v is string => !!v),
              ]),
            ].map(label => (
              <option key={label} value={label}>
                {label} ({members.filter(u => u.pledgeClass === label).length})
              </option>
            ))}
          </select>
        )}
        <span>{people.length} members</span>
      </div>
      {s.user.role === "master" && role === "pledge" && (
        <p className="quiet-note">
          Open a pledge to edit their profile or remove them from the process.
        </p>
      )}
      <div className="chapter-photo-grid">
        {people.map(u => (
          <motion.article
            key={u.id}
            layout={reduceMotion ? false : "position"}
            layoutDependency={`${query}:${role}:${memberClass}`}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...fluidSpring, opacity: { duration: 0.14 } }}
            className="chapter-member-card"
          >
            <button
              className="chapter-card-open"
              aria-label={`View ${u.name}'s profile`}
              onClick={() => setSelected(u)}
            >
              <MemberHeader member={u} />
              <div className="chapter-card-info">
                <span className="chapter-card-role">{directoryRole(u)}</span>
                <h2>{u.name}</h2>
                {(u.major || u.year) && (
                  <p className="chapter-card-meta">
                    {[u.major, u.year].filter(Boolean).join(" · ")}
                  </p>
                )}
                {u.pledgeClass && (
                  <p className="chapter-card-class">{u.pledgeClass}</p>
                )}
                {!!u.profileTags?.length && (
                  <div className="profile-tag-options">
                    {u.profileTags.map(tag => (
                      <span className="profile-tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <span className="chapter-card-link">
                  View profile <ArrowUpRightIcon size={16} />
                </span>
              </div>
            </button>
            {sms(u) && (
              <a
                className="chapter-card-text"
                href={sms(u)!}
                aria-label={`Text ${u.name}`}
              >
                <ChatCircleTextIcon size={18} /> Text
              </a>
            )}
          </motion.article>
        ))}
      </div>
      {!people.length && (
        <Empty
          title="No members found"
          description="Clear the search and filters to see everyone."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setQuery("");
                setRole("all");
                setMemberClass("all");
              }}
            >
              Show everyone
            </Button>
          }
        />
      )}
      <AnimatePresence>
        {editing && (
          <ProfileEditor
            user={editing}
            managed={editing.id !== s.user.id}
            onClose={() => setEditing(null)}
            onSaved={() => void saved()}
            onRemoved={
              editing.id !== s.user.id ? () => void removed() : undefined
            }
          />
        )}
      </AnimatePresence>
      {s.user.role === "master" && !!s.archivedUsers?.length && (
        <details className="panel archived-pledges">
          <summary>Removed pledges ({s.archivedUsers.length})</summary>
          {s.archivedUsers.map(user => (
            <div key={user.id} className="person">
              <strong>{user.name}</strong>
              <Button
                variant="secondary"
                disabled={restoring === user.id}
                onClick={async () => {
                  setRestoring(user.id);
                  const r = await fetch(
                    `/api/process/profile/pledges/${encodeURIComponent(user.id)}/restore`,
                    { method: "POST" }
                  );
                  if (!r.ok) {
                    setRestoring("");
                    notify("Could not restore pledge.");
                    return;
                  }
                  await refresh().catch(() => {});
                  setRestoring("");
                  notify("Pledge restored");
                }}
              >
                {restoring === user.id ? "Restoring…" : "Restore to process"}
              </Button>
            </div>
          ))}
        </details>
      )}
      <AnimatePresence>
        {selected && (
          <ProfileDetails
            key={selected.id}
            member={selected}
            onClose={() => setSelected(null)}
            onEdit={
              canEdit(selected)
                ? () => {
                    setEditing(selected);
                    setSelected(null);
                  }
                : undefined
            }
          />
        )}
      </AnimatePresence>
    </>
  );
}
