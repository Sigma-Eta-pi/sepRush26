export type Role = "pledge" | "active" | "master";
export type User = {
  id: string;
  name: string;
  email?: string;
  contactEmail?: string;
  profileTags?: string[];
  profileEdited?: boolean;
  photoEdited?: boolean;
  directoryName?: string;
  archived?: boolean;
  role: Role;
  major: string;
  year: string;
  color: string;
  phone?: string;
  photoUrl?: string;
  coverUrl?: string;
  coverPosition?: string;
  hometown?: string;
  profileSections?: {
    title: string;
    body: string;
    images?: string[];
    links?: { label: string; url: string }[];
  }[];
  profileImages?: string[];
  membershipStatus?: string;
  sourceUrl?: string;
  bio?: string;
  linkedin?: string;
  instagram?: string;
  pledgeClass?: string;
};
export type Settings = {
  chapter: string;
  cohort: string;
  term: string;
  startDate: string;
  endDate: string;
  /** Chats each pledge needs, as served: never more than there are actives. */
  coffeeGoal: number;
  /** The number a pledge master chose, before capping at the roster. */
  coffeeTarget?: number;
  timezone: string;
  welcome: string;
  announcement: string;
};
export type Event = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  location: string;
  description: string;
  type: string;
  ownerId: string;
  rsvps: Record<string, string>;
};
export type Coffee = {
  id: string;
  pledgeId: string;
  activeId: string;
  status: string;
  date: string;
  location: string;
  /** The pledge's thank-you to the active. */
  note: string;
  /** Why the active rejected it, when they said. */
  reviewNote?: string;
  createdAt: string;
};
export type Strike = {
  id: string;
  pledgeId: string;
  reporterId: string;
  reason: string;
  date: string;
  status: string;
  points: number;
  reviewNote: string;
  appeal: string;
  appealStatus: string;
  createdAt: string;
};
export type Makeup = {
  id: string;
  title: string;
  ownerId: string;
  description: string;
  dueAt: string;
  credit: number;
  status: string;
  pledgeId: string | null;
  strikeId: string | null;
  evidence: string;
  reviewNote: string;
};
export type Deliverable = {
  id: string;
  title: string;
  description: string;
  dueAt: string;
  ownerId: string;
};
export type Submission = {
  id: string;
  deliverableId: string;
  pledgeId: string;
  url: string;
  note: string;
  status: string;
  feedback: string;
  submittedAt: string;
};
export type Question = {
  id: string;
  title: string;
  body: string;
  authorId: string;
  private: boolean;
  resolved: boolean;
  createdAt: string;
  replies: { id: string; authorId: string; body: string; createdAt: string }[];
};
export type State = {
  archivedUsers?: User[];
  classProgress: { pledgeId: string; approvedDeliverables: number }[];
  user: User;
  users: User[];
  settings: Settings;
  events: Event[];
  coffee: Coffee[];
  strikes: Strike[];
  makeups: Makeup[];
  deliverables: Deliverable[];
  submissions: Submission[];
  questions: Question[];
  audit: {
    id: number;
    actor: string;
    action: string;
    subject: string;
    at: string;
  }[];
  demo: boolean;
  /** The signed-in person is a chapter admin and may view as other members. */
  canViewAs?: boolean;
  /** Set while an admin views as `user`; everything is read-only. */
  viewingAs?: { viewerId: string; viewerName: string };
  demoRoster?: "chapter";
};
export type Page =
  | "today"
  | "calendar"
  | "coffee"
  | "deliverables"
  | "accountability"
  | "questions"
  | "members"
  | "settings"
  | "updates"
  | "chapter-calendar"
  | "tasks"
  | "connections"
  | "alumni"
  | "docs"
  | "admin";
export type Field = {
  name: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "password"
    | "date"
    | "datetime-local"
    | "number"
    | "textarea"
    | "select"
    | "checkbox"
    | "url";
  value?: string | number | boolean;
  options?: { value: string; label: string }[];
  required?: boolean;
  help?: string;
  min?: number;
  max?: number;
};
// Where a button meant to land: the destination page opens on this exact view.
export type Intent = {
  tab?: string;
  view?: string;
  filter?: string;
  pledgeId?: string;
  focusId?: string;
  action?: string;
};
export type FormSpec = {
  title: string;
  description?: string;
  fields: Field[];
  submit?: string;
  /** Read-only details: one button to close, nothing to cancel. */
  info?: boolean;
  onSubmit: (v: Record<string, string>) => Promise<unknown>;
};
