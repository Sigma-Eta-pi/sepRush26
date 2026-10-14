import { MotionDialog } from "./motion";
import { useState, type ReactNode, type ButtonHTMLAttributes } from "react";
import {
  ArrowRightIcon,
  CheckIcon,
  PlusIcon,
  XIcon,
  CalendarBlankIcon,
} from "@phosphor-icons/react";
import type { FormSpec, User } from "../types";
import { statusName } from "../lib";
import { chapterPhotoForName } from "@/data/chapter-members";
export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button className={`btn btn-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}
export function Avatar({
  user,
  size = "md",
}: {
  user?: User;
  size?: "sm" | "md" | "lg";
}) {
  const photo =
    user?.photoEdited && user.photoUrl !== undefined
      ? user.photoUrl
      : (user && chapterPhotoForName(user.directoryName || user.name)) ||
        user?.photoUrl;
  return (
    <span
      className={`avatar avatar-${size} avatar-${user?.color || "sage"}`}
      aria-hidden="true"
    >
      {photo &&
        (/^https?:\/\//.test(photo) ||
          /^data:image\/(jpeg|png|webp);base64,/.test(photo) ||
          /^\/(?!\/)/.test(photo)) && (
          <img
            loading="lazy"
            decoding="async"
            src={photo}
            alt=""
            onError={e => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
      {user?.name
        .split(" ")
        .map(n => n[0])
        .slice(0, 2)
        .join("") || "Σ"}
    </span>
  );
}
export function Badge({
  status,
  children,
}: {
  status?: string;
  children?: ReactNode;
}) {
  return (
    <span className={`badge badge-${status || "neutral"}`}>
      <span className="badge-dot" />
      {children || statusName(status || "")}
    </span>
  );
}
export function Progress({ value, label }: { value: number; label?: string }) {
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-valuenow={Math.max(
        0,
        Math.min(100, Number.isFinite(value) ? value : 0)
      )}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || "Completion"}
    >
      <span
        style={{
          transform: `scaleX(${Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0)) / 100})`,
        }}
      />
    </div>
  );
}
export function SectionHead({
  title,
  detail,
  action,
}: {
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {detail && <p>{detail}</p>}
      </div>
      {action}
    </div>
  );
}
export function PageHead({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="page-actions">{action}</div>}
    </div>
  );
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <CheckIcon size={25} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function TextLink({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="text-link" onClick={onClick}>
      {children}
      <ArrowRightIcon size={15} />
    </button>
  );
}
export function AddButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button onClick={onClick}>
      <PlusIcon size={17} />
      {children}
    </Button>
  );
}
export function DateTile({ day, month }: { day: string; month: string }) {
  return (
    <div className="date-tile">
      <span>{month}</span>
      <strong>{day}</strong>
    </div>
  );
}
export function InlineNote({ children }: { children: ReactNode }) {
  return (
    <div className="inline-note">
      <CalendarBlankIcon size={18} />
      <span>{children}</span>
    </div>
  );
}
export function FormDialog({
  spec,
  onClose,
}: {
  spec: FormSpec;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <MotionDialog labelledBy="dialog-title" busy={busy} onClose={onClose}>
      <form
        onSubmit={async e => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const data = Object.fromEntries(
            new FormData(e.currentTarget)
          ) as Record<string, string>;
          try {
            await spec.onSubmit(data);
            onClose();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="modal-head">
          <div>
            <div className="eyebrow">SIGMA ETA PI</div>
            <h2 id="dialog-title">{spec.title}</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            disabled={busy}
          >
            <XIcon size={21} />
          </button>
        </div>
        {spec.description && (
          <p className="modal-description">{spec.description}</p>
        )}
        <div className="form-fields">
          {spec.fields.map(f => (
            <label
              className={`field ${f.type === "checkbox" ? "field-check" : ""}`}
              key={f.name}
            >
              <span>
                {f.label}
                {f.required === false && f.type !== "checkbox" && (
                  <small>Optional</small>
                )}
              </span>
              {f.type === "textarea" ? (
                <textarea
                  aria-label={f.label}
                  name={f.name}
                  defaultValue={String(f.value || "")}
                  required={f.required !== false}
                  maxLength={4000}
                  rows={4}
                />
              ) : f.type === "select" ? (
                <select
                  aria-label={f.label}
                  name={f.name}
                  defaultValue={String(f.value || "")}
                  required={f.required !== false}
                >
                  <option value="" disabled>
                    Select an option
                  </option>
                  {f.options?.map(o => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : f.type === "checkbox" ? (
                <input
                  aria-label={f.label}
                  type="checkbox"
                  name={f.name}
                  defaultChecked={!!f.value}
                />
              ) : (
                <input
                  aria-label={f.label}
                  name={f.name}
                  type={f.type || "text"}
                  defaultValue={String(f.value ?? "")}
                  required={f.required !== false}
                  min={f.min}
                  max={f.max}
                  maxLength={f.type === "password" ? 256 : 2000}
                />
              )}{" "}
              {f.help && <small>{f.help}</small>}
            </label>
          ))}
        </div>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <div className="modal-footer">
          {!spec.info && (
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : spec.submit || "Save changes"}
          </Button>
        </div>
      </form>
    </MotionDialog>
  );
}
