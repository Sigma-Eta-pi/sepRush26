// Calendar dates and instants are distinct: timestamps must carry a timezone so
// a server's local timezone never changes the meaning of a submitted deadline.
export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

export function isInstant(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match =
    /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.exec(
      value
    );
  if (!match || !isCalendarDate(match[1])) return false;
  if (+match[2] > 23 || +match[3] > 59 || +(match[4] || 0) > 59) return false;
  if (match[5] !== "Z") {
    const [hour, minute] = match[5].slice(1).split(":").map(Number);
    if (hour > 23 || minute > 59) return false;
  }
  return Number.isFinite(Date.parse(value));
}

export const isProcessDate = (value: unknown): value is string =>
  isCalendarDate(value) || isInstant(value);
