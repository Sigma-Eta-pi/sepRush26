import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  Clock,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  location?: string;
  type: "general" | "social" | "professional" | "exec" | "mandatory";
  createdBy: string;
  createdAt: string;
}

async function apiFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const typeColors: Record<CalendarEvent["type"], string> = {
  mandatory: "bg-red-500",
  exec: "bg-purple-600",
  social: "bg-blue-500",
  professional: "bg-green-600",
  general: "bg-[#05006C]",
};

const typeDot: Record<CalendarEvent["type"], string> = {
  mandatory: "bg-red-500",
  exec: "bg-purple-500",
  social: "bg-blue-500",
  professional: "bg-green-500",
  general: "bg-[#05006C]",
};

const typeBadge: Record<CalendarEvent["type"], string> = {
  mandatory: "bg-red-100 text-red-700",
  exec: "bg-purple-100 text-purple-700",
  social: "bg-blue-100 text-blue-700",
  professional: "bg-green-100 text-green-700",
  general: "bg-[#05006C]/10 text-[#05006C]",
};

type EventForm = {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: CalendarEvent["type"];
};

const blank: EventForm = {
  title: "",
  description: "",
  date: "",
  time: "",
  location: "",
  type: "general",
};

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function FormModal({
  heading,
  form,
  setForm,
  onSave,
  onClose,
  busy,
}: {
  heading: string;
  form: EventForm;
  setForm: React.Dispatch<React.SetStateAction<EventForm>>;
  onSave: () => void;
  onClose: () => void;
  busy: boolean;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#05006C] font-bold tracking-wider text-sm">
            {heading}
          </h3>
          <button
            onClick={onClose}
            className="text-[#05006C]/40 hover:text-[#05006C] transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3">
          <input
            placeholder="Title *"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full bg-[#F5F3EE] border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C] focus:outline-none focus:border-[#05006C]/40"
          />
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={e =>
              setForm(f => ({ ...f, description: e.target.value }))
            }
            className="w-full bg-[#F5F3EE] border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C] min-h-[80px] resize-none focus:outline-none focus:border-[#05006C]/40"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[#05006C]/50 text-xs mb-1">Date *</p>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full bg-[#F5F3EE] border border-[#05006C]/15 rounded-lg px-3 py-2.5 text-sm text-[#05006C] focus:outline-none focus:border-[#05006C]/40"
              />
            </div>
            <div>
              <p className="text-[#05006C]/50 text-xs mb-1">Time</p>
              <input
                type="time"
                value={form.time}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className="w-full bg-[#F5F3EE] border border-[#05006C]/15 rounded-lg px-3 py-2.5 text-sm text-[#05006C] focus:outline-none focus:border-[#05006C]/40"
              />
            </div>
          </div>
          <input
            placeholder="Location"
            value={form.location}
            onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            className="w-full bg-[#F5F3EE] border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C] focus:outline-none focus:border-[#05006C]/40"
          />
          <select
            value={form.type}
            onChange={e =>
              setForm(f => ({
                ...f,
                type: e.target.value as CalendarEvent["type"],
              }))
            }
            className="w-full bg-[#F5F3EE] border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C] focus:outline-none"
          >
            <option value="general">General</option>
            <option value="social">Social</option>
            <option value="professional">Professional</option>
            <option value="exec">Exec</option>
            <option value="mandatory">Mandatory</option>
          </select>
        </div>
        <div className="flex gap-2 mt-5">
          <button
            onClick={onSave}
            disabled={busy || !form.title || !form.date}
            className="flex-1 bg-[#05006C] text-[#EEEADE] py-2.5 rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-[#0A0080] transition-colors"
          >
            {busy ? "Saving…" : "Save Event"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#05006C]/20 text-[#05006C]/60 rounded-lg text-sm hover:bg-[#05006C]/5 transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function CalendarView() {
  const { user, token } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const [view, setView] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selected, setSelected] = useState(toDateStr(today));

  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState<EventForm>({ ...blank });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EventForm>({ ...blank });
  const [busy, setBusy] = useState(false);

  const canEdit = user?.role === "exec" || user?.role === "admin";

  const load = () => {
    if (!token) return;
    setLoading(true);
    apiFetch("/api/events", token)
      .then(setEvents)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, [token]);

  const create = async () => {
    if (!token || !newForm.title || !newForm.date) return;
    setBusy(true);
    try {
      await apiFetch("/api/events", token, {
        method: "POST",
        body: JSON.stringify(newForm),
      });
      setShowNew(false);
      setNewForm({ ...blank });
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const save = async (id: string) => {
    if (!token) return;
    setBusy(true);
    try {
      await apiFetch(`/api/events/${id}`, token, {
        method: "PUT",
        body: JSON.stringify(editForm),
      });
      setEditingId(null);
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!token || !window.confirm("Delete this event?")) return;
    try {
      await apiFetch(`/api/events/${id}`, token, { method: "DELETE" });
      setEvents(p => p.filter(e => e.id !== id));
    } catch (e: any) {
      alert(e.message);
    }
  };

  // ── grid ──────────────────────────────────────────────────────────────────
  const yr = view.getFullYear();
  const mo = view.getMonth();
  const firstDow = new Date(yr, mo, 1).getDay();
  const days = new Date(yr, mo + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const byDate: Record<string, CalendarEvent[]> = {};
  for (const ev of events) {
    const k = ev.date?.split("T")[0];
    if (k) {
      if (!byDate[k]) byDate[k] = [];
      byDate[k].push(ev);
    }
  }

  const todayStr = toDateStr(today);
  const selEvents = byDate[selected] || [];
  const monthLabel = view.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar size={24} className="text-[#05006C]" />
          <h1 className="text-[#05006C] text-2xl font-bold tracking-widest">
            CALENDAR
          </h1>
        </div>
        {canEdit && (
          <button
            onClick={() => {
              setNewForm({ ...blank });
              setShowNew(true);
            }}
            className="bg-[#05006C] text-[#EEEADE] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#0A0080] transition-colors"
          >
            <Plus size={16} /> ADD EVENT
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 rounded-xl p-4 border border-red-200 mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Month grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-[#05006C]/10 overflow-hidden">
          {/* Nav */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#05006C]/10">
            <button
              onClick={() => setView(new Date(yr, mo - 1, 1))}
              className="p-1.5 rounded-lg hover:bg-[#05006C]/5 text-[#05006C]/50 hover:text-[#05006C] transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-[#05006C] font-bold tracking-widest text-sm">
              {monthLabel.toUpperCase()}
            </span>
            <button
              onClick={() => setView(new Date(yr, mo + 1, 1))}
              className="p-1.5 rounded-lg hover:bg-[#05006C]/5 text-[#05006C]/50 hover:text-[#05006C] transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* DOW headers */}
          <div className="grid grid-cols-7 border-b border-[#05006C]/10">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div
                key={d}
                className="text-center text-[#05006C]/40 text-xs font-bold tracking-wider py-2.5"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day)
                return (
                  <div
                    key={i}
                    className="h-16 border-b border-r border-[#05006C]/5 bg-[#F5F3EE]/40"
                  />
                );
              const ds = `${yr}-${String(mo + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const evs = byDate[ds] || [];
              const isToday = ds === todayStr;
              const isSel = ds === selected;
              return (
                <button
                  key={i}
                  onClick={() => setSelected(ds)}
                  className={`h-16 border-b border-r border-[#05006C]/5 p-1.5 text-left transition-colors ${isSel ? "bg-[#05006C]/8" : "hover:bg-[#05006C]/4"}`}
                >
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full
                    ${isToday ? "bg-[#05006C] text-[#EEEADE]" : isSel ? "text-[#05006C]" : "text-[#05006C]/60"}`}
                  >
                    {day}
                  </span>
                  {evs.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-0.5 px-0.5">
                      {evs.slice(0, 3).map(ev => (
                        <span
                          key={ev.id}
                          className={`w-1.5 h-1.5 rounded-full ${typeDot[ev.type]}`}
                        />
                      ))}
                      {evs.length > 3 && (
                        <span className="text-[8px] text-[#05006C]/30 leading-none">
                          +{evs.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 px-5 py-3 border-t border-[#05006C]/10">
            {(Object.entries(typeDot) as [CalendarEvent["type"], string][]).map(
              ([t, c]) => (
                <div key={t} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${c}`} />
                  <span className="text-[10px] text-[#05006C]/50 capitalize">
                    {t}
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Day panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#05006C]/10 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[#05006C]/10">
            <p className="text-[#05006C] font-bold text-sm tracking-wider">
              {new Date(selected + "T12:00:00")
                .toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })
                .toUpperCase()}
            </p>
          </div>
          <div className="p-4 flex-1 min-h-[200px]">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center py-12"
                >
                  <div className="w-5 h-5 border-2 border-[#05006C]/20 border-t-[#05006C] rounded-full animate-spin" />
                </motion.div>
              ) : selEvents.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-10 text-center"
                >
                  <Calendar size={28} className="text-[#05006C]/15 mb-2" />
                  <p className="text-[#05006C]/30 text-sm">No events</p>
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  {selEvents.map(ev => (
                    <div
                      key={ev.id}
                      className="rounded-xl border border-[#05006C]/10 overflow-hidden"
                    >
                      <div className={`h-1 ${typeColors[ev.type]}`} />
                      <div className="p-3">
                        <div className="flex items-start gap-2 justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#05006C] text-sm truncate">
                              {ev.title}
                            </p>
                            <span
                              className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${typeBadge[ev.type]}`}
                            >
                              {ev.type}
                            </span>
                          </div>
                          {canEdit && (
                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingId(ev.id);
                                  setEditForm({
                                    title: ev.title,
                                    description: ev.description || "",
                                    date: ev.date?.split("T")[0] || "",
                                    time: ev.time || "",
                                    location: ev.location || "",
                                    type: ev.type,
                                  });
                                }}
                                className="text-[#05006C]/40 hover:text-[#05006C] p-1 transition-colors"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => remove(ev.id)}
                                className="text-red-400 hover:text-red-600 p-1 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="mt-1.5 space-y-0.5">
                          {ev.time && (
                            <div className="flex items-center gap-1.5 text-xs text-[#05006C]/50">
                              <Clock size={11} />
                              {ev.time}
                            </div>
                          )}
                          {ev.location && (
                            <div className="flex items-center gap-1.5 text-xs text-[#05006C]/50">
                              <MapPin size={11} />
                              {ev.location}
                            </div>
                          )}
                        </div>
                        {ev.description && (
                          <p className="text-xs text-[#05006C]/50 mt-1.5 leading-relaxed">
                            {ev.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showNew && (
          <FormModal
            key="new"
            heading="ADD EVENT"
            form={newForm}
            setForm={setNewForm}
            onSave={create}
            onClose={() => setShowNew(false)}
            busy={busy}
          />
        )}
        {editingId && (
          <FormModal
            key="edit"
            heading="EDIT EVENT"
            form={editForm}
            setForm={setEditForm}
            onSave={() => save(editingId)}
            onClose={() => setEditingId(null)}
            busy={busy}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
