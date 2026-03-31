import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, Plus, Pencil, Trash2, X } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  location?: string;
  type: 'general' | 'social' | 'professional' | 'exec' | 'mandatory';
  createdBy: string;
  createdAt: string;
}

async function apiFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options?.headers },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const typeColors: Record<CalendarEvent['type'], string> = {
  mandatory: 'bg-red-500',
  exec: 'bg-purple-600',
  social: 'bg-blue-500',
  professional: 'bg-green-600',
  general: 'bg-[#05006C]',
};

const typeBadgeColors: Record<CalendarEvent['type'], string> = {
  mandatory: 'bg-red-100 text-red-700',
  exec: 'bg-purple-100 text-purple-700',
  social: 'bg-blue-100 text-blue-700',
  professional: 'bg-green-100 text-green-700',
  general: 'bg-[#05006C]/10 text-[#05006C]',
};

type EventForm = {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: CalendarEvent['type'];
};

const emptyForm: EventForm = { title: '', description: '', date: '', time: '', location: '', type: 'general' };

function EventFormFields({ form, setForm }: { form: EventForm; setForm: (fn: (f: EventForm) => EventForm) => void }) {
  return (
    <div className="space-y-3">
      <input
        placeholder="Title *"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        className="w-full bg-[#F5F3EE] border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C]"
      />
      <textarea
        placeholder="Description (optional)"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        className="w-full bg-[#F5F3EE] border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C] min-h-20"
      />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          className="bg-[#F5F3EE] border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C]"
        />
        <input
          type="time"
          value={form.time}
          onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
          className="bg-[#F5F3EE] border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C]"
        />
        <input
          placeholder="Location"
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          className="bg-[#F5F3EE] border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C]"
        />
        <select
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CalendarEvent['type'] }))}
          className="bg-[#F5F3EE] border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C]"
        >
          <option value="general">General</option>
          <option value="social">Social</option>
          <option value="professional">Professional</option>
          <option value="exec">Exec</option>
          <option value="mandatory">Mandatory</option>
        </select>
      </div>
    </div>
  );
}

function groupByMonth(events: CalendarEvent[]) {
  const groups: Record<string, CalendarEvent[]> = {};
  for (const event of events) {
    const d = new Date(event.date);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(event);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, events]) => {
      const [year, month] = key.split('-');
      const label = new Date(Number(year), Number(month)).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
      return { label, events: events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) };
    });
}

export default function CalendarView() {
  const { user, token } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState<EventForm>({ ...emptyForm });
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EventForm>({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);

  const isExecOrAdmin = user?.role === 'exec' || user?.role === 'admin';

  const fetchEvents = () => {
    if (!token) return;
    setLoading(true);
    apiFetch('/api/events', token)
      .then(setEvents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEvents(); }, [token]);

  const handleCreate = async () => {
    if (!token || !newForm.title || !newForm.date) return;
    setSubmitting(true);
    try {
      await apiFetch('/api/events', token, {
        method: 'POST',
        body: JSON.stringify(newForm),
      });
      setShowNew(false);
      setNewForm({ ...emptyForm });
      fetchEvents();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (id: string) => {
    if (!token) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/events/${id}`, token, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      setEditing(null);
      fetchEvents();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !window.confirm('Delete this event?')) return;
    try {
      await apiFetch(`/api/events/${id}`, token, { method: 'DELETE' });
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const grouped = groupByMonth(events);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Calendar size={24} className="text-[#05006C]" />
          <h1 className="text-[#05006C] text-2xl font-bold tracking-widest">CALENDAR</h1>
        </div>
        {isExecOrAdmin && (
          <button
            onClick={() => setShowNew(!showNew)}
            className="bg-[#05006C] text-[#EEEADE] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
          >
            <Plus size={16} /> ADD EVENT
          </button>
        )}
      </div>

      {showNew && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-[#05006C]/10 mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#05006C] font-bold text-sm tracking-wider">ADD EVENT</span>
            <button onClick={() => setShowNew(false)} className="text-[#05006C]/40 hover:text-[#05006C]"><X size={18} /></button>
          </div>
          <EventFormFields form={newForm} setForm={setNewForm} />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="bg-[#05006C] text-[#EEEADE] px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Event'}
            </button>
            <button
              onClick={() => setShowNew(false)}
              className="border border-[#05006C]/20 text-[#05006C]/70 px-3 py-1.5 rounded-lg text-xs"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-4 border border-[#05006C]/10 animate-pulse flex gap-4">
              <div className="w-16 h-16 rounded-lg bg-[#05006C]/10" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[#05006C]/10 rounded w-1/3" />
                <div className="h-3 bg-[#05006C]/5 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 rounded-xl p-4 border border-red-200">
          {error}
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-[#05006C]/10 rounded-full flex items-center justify-center mb-4">
            <Calendar size={28} className="text-[#05006C]/40" />
          </div>
          <p className="text-[#05006C]/50 mt-2">No upcoming events</p>
        </div>
      )}

      {!loading && !error && grouped.map((group) => (
        <div key={group.label} className="mb-8">
          <h2 className="text-[#05006C]/40 text-sm font-bold tracking-widest mb-4">{group.label}</h2>
          <div className="space-y-3">
            {group.events.map((event, i) => {
              const d = new Date(event.date);
              const day = d.getDate();
              const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

              if (editing === event.id) {
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-sm border border-[#05006C]/10 p-6"
                  >
                    <EventFormFields form={editForm} setForm={setEditForm} />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleEdit(event.id)}
                        disabled={submitting}
                        className="bg-[#05006C] text-[#EEEADE] px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="border border-[#05006C]/20 text-[#05006C]/70 px-3 py-1.5 rounded-lg text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-xl shadow-sm border border-[#05006C]/10 flex overflow-hidden relative group"
                >
                  <div className={`w-20 flex-shrink-0 flex flex-col items-center justify-center text-white ${typeColors[event.type]}`}>
                    <span className="text-2xl font-bold leading-none">{day}</span>
                    <span className="text-xs mt-0.5 opacity-80">{month}</span>
                  </div>
                  <div className="flex-1 p-4 pr-20">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[#05006C]">{event.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${typeBadgeColors[event.type]}`}>
                        {event.type}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-1 text-sm text-[#05006C]/60">
                      {event.time && (
                        <span className="flex items-center gap-1">
                          <Clock size={13} /> {event.time}
                        </span>
                      )}
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={13} /> {event.location}
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-[#05006C]/60 text-sm mt-2">{event.description}</p>
                    )}
                  </div>
                  {isExecOrAdmin && (
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      <button
                        onClick={() => {
                          setEditing(event.id);
                          setEditForm({
                            title: event.title,
                            description: event.description || '',
                            date: event.date?.split('T')[0] || '',
                            time: event.time || '',
                            location: event.location || '',
                            type: event.type,
                          });
                        }}
                        className="border border-[#05006C]/20 text-[#05006C]/70 bg-white px-2 py-1.5 rounded-lg hover:bg-[#05006C]/5"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="bg-red-500 text-white px-2 py-1.5 rounded-lg hover:bg-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
