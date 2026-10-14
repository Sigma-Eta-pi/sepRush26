import type { CSSProperties, ReactNode } from "react";
import "./dashboard-skeleton.css";

export type SkeletonVariant =
  | "overview"
  | "list"
  | "cards"
  | "calendar"
  | "form";

// Layout of each dashboard route, so the placeholder matches what replaces it.
const variants: Record<string, SkeletonVariant> = {
  "": "overview",
  members: "cards",
  accountability: "cards",
  calendar: "calendar",
  coffee: "list",
  deliverables: "list",
  questions: "list",
  settings: "form",
  updates: "list",
  "chapter-calendar": "calendar",
  tasks: "list",
  connections: "cards",
  alumni: "cards",
  docs: "list",
  admin: "list",
};
export function skeletonVariantForPath(path: string): SkeletonVariant {
  const route = path.replace(/^\/dashboard\/?/, "").replace(/\/$/, "");
  return variants[route] || "overview";
}

export function Sk({
  w,
  h = 12,
  circle,
  dark,
  className = "",
  style,
}: {
  w?: number | string;
  h?: number | string;
  circle?: boolean;
  dark?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={`dsk ${circle ? "dsk-circle" : ""} ${dark ? "dsk-on-dark" : ""} ${className}`}
      style={{ width: w ?? "100%", height: h, ...style }}
    />
  );
}

function Status({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className} role="status" aria-busy="true">
      <span className="dsk-sr">{label}</span>
      {children}
    </div>
  );
}

const widths = ["62%", "48%", "70%", "40%", "56%", "66%"];

export function SkeletonRows({
  count = 5,
  avatar = true,
  action = true,
  label = "Loading",
}: {
  count?: number;
  avatar?: boolean;
  action?: boolean;
  label?: string;
}) {
  return (
    <Status label={label} className="dsk-panel">
      {Array.from({ length: count }, (_, i) => (
        <div className="dsk-row" key={i}>
          {avatar && <Sk circle w={38} h={38} />}
          <div className="dsk-row-text">
            <Sk w={widths[i % widths.length]} h={13} />
            <Sk w={widths[(i + 3) % widths.length]} h={10} />
          </div>
          {action && <Sk w={84} h={32} style={{ borderRadius: 9 }} />}
        </div>
      ))}
    </Status>
  );
}

export function SkeletonCards({
  count = 8,
  media = true,
  label = "Loading",
}: {
  count?: number;
  media?: boolean;
  label?: string;
}) {
  return (
    <Status label={label} className="dsk-cards">
      {Array.from({ length: count }, (_, i) => (
        <div className="dsk-panel" key={i}>
          {media && <Sk className="dsk-card-media" h={96} />}
          <div className="dsk-panel-pad">
            <Sk w={widths[i % widths.length]} h={15} />
            <Sk w="85%" h={10} />
            <Sk w="55%" h={10} />
            <Sk w={110} h={32} style={{ borderRadius: 9, marginTop: 6 }} />
          </div>
        </div>
      ))}
    </Status>
  );
}

export function SkeletonForm({
  fields = 4,
  label = "Loading",
}: {
  fields?: number;
  label?: string;
}) {
  return (
    <Status label={label} className="dsk-form">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i}>
          <Sk w={110} h={10} />
          <Sk h={i === fields - 1 ? 92 : 42} style={{ borderRadius: 9 }} />
        </div>
      ))}
    </Status>
  );
}

function Head({ actions = 1 }: { actions?: number }) {
  return (
    <div className="dsk-head">
      <div>
        <Sk w={150} h={10} />
        <Sk w={280} h={30} style={{ maxWidth: "70vw" }} />
        <Sk w={360} h={12} style={{ maxWidth: "80vw" }} />
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {Array.from({ length: actions }, (_, i) => (
          <Sk key={i} w={132} h={40} style={{ borderRadius: 10 }} />
        ))}
      </div>
    </div>
  );
}
function Toolbar() {
  return (
    <div className="dsk-toolbar">
      <div>
        <Sk w={96} h={36} style={{ borderRadius: 10 }} />
        <Sk w={96} h={36} style={{ borderRadius: 10 }} />
        <Sk w={96} h={36} style={{ borderRadius: 10 }} />
      </div>
      <Sk w={210} h={38} style={{ borderRadius: 10 }} />
    </div>
  );
}

export function PageSkeleton({
  variant = "list",
  label = "Loading this page",
}: {
  variant?: SkeletonVariant;
  label?: string;
}) {
  return (
    <Status label={label} className="dsk-page">
      {variant === "overview" && (
        <>
          <Head actions={0} />
          <div className="dsk-three">
            {[0, 1, 2].map(i => (
              <div className="dsk-panel dsk-panel-pad" key={i}>
                <Sk circle w={26} h={26} />
                <Sk w={110} h={11} />
                <Sk w={64} h={34} />
                <Sk w="70%" h={10} />
              </div>
            ))}
          </div>
          <SkeletonRows count={4} />
          <div className="dsk-two">
            <SkeletonRows count={3} avatar={false} action={false} />
            <div className="dsk-panel dsk-panel-pad">
              <Sk w={170} h={15} />
              <Sk h={10} />
              <Sk w="88%" h={10} />
              <Sk w="60%" h={10} />
              <Sk w={150} h={38} style={{ borderRadius: 10 }} />
            </div>
          </div>
        </>
      )}
      {variant === "list" && (
        <>
          <Head />
          <Toolbar />
          <SkeletonRows count={7} />
        </>
      )}
      {variant === "cards" && (
        <>
          <Head actions={2} />
          <Toolbar />
          <SkeletonCards count={8} />
        </>
      )}
      {variant === "calendar" && (
        <>
          <Head actions={2} />
          <Toolbar />
          <div className="dsk-week">
            {Array.from({ length: 7 }, (_, i) => (
              <div className="dsk-panel" key={i}>
                <Sk w={34} h={10} />
                <Sk w={24} h={20} />
                {i % 2 === 0 && <Sk h={54} style={{ borderRadius: 9 }} />}
                {i % 3 === 0 && <Sk h={54} style={{ borderRadius: 9 }} />}
              </div>
            ))}
          </div>
        </>
      )}
      {variant === "form" && (
        <>
          <Head actions={0} />
          <div className="dsk-two">
            <div className="dsk-panel dsk-panel-pad">
              <SkeletonForm fields={5} />
            </div>
            <div style={{ display: "grid", gap: 18, alignContent: "start" }}>
              <div className="dsk-panel dsk-panel-pad">
                <Sk w={180} h={15} />
                <Sk h={10} />
                <Sk w="70%" h={10} />
              </div>
              <SkeletonRows count={4} avatar={false} action={false} />
            </div>
          </div>
        </>
      )}
    </Status>
  );
}

/** Full-screen dashboard placeholder: sidebar, top bar and a page body. */
export default function DashboardSkeleton({
  variant,
  label = "Loading your chapter",
}: {
  variant?: SkeletonVariant;
  label?: string;
}) {
  const resolved =
    variant ||
    skeletonVariantForPath(
      typeof window === "undefined" ? "" : window.location.pathname
    );
  return (
    <div className="dsk-shell">
      <aside className="dsk-sidebar" aria-hidden="true">
        <div className="dsk-sidebar-brand">
          <Sk dark w={36} h={36} style={{ borderRadius: 8 }} />
          <div style={{ display: "grid", gap: 7 }}>
            <Sk dark w={104} h={12} />
            <Sk dark w={72} h={9} />
          </div>
        </div>
        <Sk dark h={52} style={{ borderRadius: 12 }} />
        <Sk dark h={38} style={{ borderRadius: 10 }} />
        {[3, 4].map((items, group) => (
          <div className="dsk-sidebar-group" key={group}>
            <Sk dark w={70} h={9} style={{ marginLeft: 10 }} />
            {Array.from({ length: items }, (_, i) => (
              <div className="dsk-sidebar-item" key={i}>
                <Sk dark w={19} h={19} style={{ borderRadius: 6 }} />
                <Sk dark w={[112, 92, 128, 84][i]} h={11} />
              </div>
            ))}
          </div>
        ))}
        <div className="dsk-sidebar-foot">
          <Sk dark circle w={36} h={36} />
          <div style={{ display: "grid", gap: 7 }}>
            <Sk dark w={110} h={11} />
            <Sk dark w={70} h={9} />
          </div>
        </div>
      </aside>
      <div className="dsk-main">
        <div className="dsk-topbar" aria-hidden="true">
          <Sk w={190} h={12} />
          <Sk w={96} h={28} style={{ borderRadius: 14 }} />
        </div>
        <div className="dsk-content">
          <PageSkeleton variant={resolved} label={label} />
        </div>
      </div>
      <div className="dsk-dock" aria-hidden="true">
        {[0, 1, 2, 3, 4].map(i => (
          <Sk dark key={i} h={51} />
        ))}
      </div>
    </div>
  );
}

/** Fallback for the non-dashboard routes that load lazily. */
export function PlainSkeleton({ label = "Loading" }: { label?: string }) {
  return (
    <Status label={label} className="dsk-plain">
      <div>
        <Sk dark w="55%" h={26} />
        <Sk dark h={12} />
        <Sk dark w="80%" h={12} />
        <Sk dark h={46} style={{ borderRadius: 10, marginTop: 10 }} />
      </div>
    </Status>
  );
}
