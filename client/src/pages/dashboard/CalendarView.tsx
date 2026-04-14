import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Clock, Plus, Pencil, Trash2, X, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

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
  source?: string;
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

const typeDot: Record<CalendarEvent['type'], string> = {
  mandatory: 'bg-red-500',
  exec: 'bg-purple-500',
  social: 'bg-blue-500',
  professional: 'bg-green-500',
  general: 'bg-[#05006C]',
};

const typeBadge: Record<CalendarEvent['type'], string> = {
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

const blank: EventForm = { title: '', description: '', date: '', time: '', location: '', type: 'general' };

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#05006C] font-bold tracking-wider text-sm">{heading}</h3>
          <button onClick={onClose} className="text-[#05006C]/40 hover:text-[#05006C] transition-colors"><X size={18} /></button>
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
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full bg-[#F5F3EE] border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C] min-h-[80px] resize-none focus:outline-none focus:border-[#05006C]/40"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[#05006C]/50 text-xs mb-1">Date *</p>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full bg-[#F5F3EE] border border-[#05006C]/15 rounded-lg px-3 py-2.5 text-sm text-[#05006C] focus:outline-none focus:border-[#05006C]/40" />
            </div>
            <div>
              <p className="text-[#05006C]/50 text-xs mb-1">Time</p>
              <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className="w-full bg-[#F5F3EE] border border-[#05006C]/15 rounded-lg px-3 py-2.5 text-sm text-[#05006C] focus:outline-none focus:border-[#05006C]/40" />
            </div>
          </div>
          <input placeholder="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            className="w-full bg-[#F5F3EE] border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C] focus:outline-none focus:border-[#05006C]/40" />
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as CalendarEvent['type'] }))}
            className="w-full bg-[#F5F3EE] border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C] focus:outline-none">
            <option value="general">General</option>
            <option value="social">Social</option>
            <option value="professional">Professional</option>
            <option value="exec">Exec</option>
            <option value="mandatory">Mandatory</option>
          </select>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onSave} disabled={busy || !form.title || !form.date}
            className="flex-1 bg-[#05006C] text-[#EEEADE] py-2.5 rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-[#0A0080] transition-colors">
            {busy ? 'Saving…' : 'Save Event'}
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-[#05006C]/20 text-[#05006C]/60 rounded-lg text-sm hover:bg-[#05006C]/5 transition-colors">
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
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const today = new Date();
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(toDateStr(today));

  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState<EventForm>({ ...blank });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EventForm>({ ...blank });
  const [busy, setBusy] = useState(false);

  const canEdit = user?.role === 'exec' || user?.role === 'admin';

  const load = () => {
    if (!token) return;
    setLoading(true);
    apiFetch('/api/events', token).then(setEvents).catch(e => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(load, [token]);

  const create = async () => {
    if (!token || !newForm.title || !newForm.date) return;
    setBusy(true);
    try { await apiFetch('/api/events', token, { method: 'POST', body: JSON.stringify(newForm) }); setShowNew(false); setNewForm({ ...blank }); load(); }
    catch (e: any) { alert(e.message); } finally { setBusy(false); }
  };

  const save = async (id: string) => {
    if (!token) return;
    setBusy(true);
    try { await apiFetch(`/api/events/${id}`, token, { method: 'PUT', body: JSON.stringify(editForm) }); setEditingId(null); load(); }
    catch (e: any) { alert(e.message); } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    if (!token || !window.confirm('Delete this event?')) return;
    try { await apiFetch(`/api/events/${id}`, token, { method: 'DELETE' }); setEvents(p => p.filter(e => e.id !== id)); }
    catch (e: any) { alert(e.message); }
  };

  const syncGcal = async () => {
    if (!token) return;
    setSyncing(true);
    setSyncMsg('');
    try {
      const res = await apiFetch('/api/gcal/sync', token, { method: 'POST' });
      setSyncMsg(`Synced ${res.total} events`);
      load();
      setTimeout(() => setSyncMsg(''), 4000);
    } catch (e: any) {
      setSyncMsg(`Error: ${e.message}`);
      setTimeout(() => setSyncMsg(''), 4000);
    } finally {
      setSyncing(false);
    }
  };

  // ── grid ──────────────────────────────────────────────────────────────────
  const yr = view.getFullYear();
  const mo = view.getMonth();
  const firstDow = new Date(yr, mo, 1).getDay();
  const days = new Date(yr, mo + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const byDate: Record<string, CalendarEvent[]> = {};
  for (const ev of events) {
    const k = ev.date?.split('T')[0];
    if (k) { if (!byDate[k]) byDate[k] = []; byDate[k].push(ev); }
  }

  const todayStr = toDateStr(today);
  const monthLabel = view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Upcoming panel: next 14 days of events grouped by date
  const upcomingDates: string[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    upcomingDates.push(toDateStr(d));
  }
  const upcomingGroups = upcomingDates
    .map(ds => ({ ds, evs: byDate[ds] || [] }))
    .filter(g => g.evs.length > 0);

  const fmtUpcomingDate = (ds: string) => {
    const d = new Date(ds + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar size={24} className="text-[#05006C]" />
          <h1 className="text-[#05006C] text-2xl font-bold tracking-widest">CALENDAR</h1>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={syncGcal}
              disabled={syncing}
              title="Sync Google Calendar"
              className="border border-[#05006C]/20 text-[#05006C]/70 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#05006C]/5 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Sync Calendar</span>
            </button>
          )}
          {canEdit && (
            <button onClick={() => { setNewForm({ ...blank }); setShowNew(true); }}
              className="bg-[#05006C] text-[#EEEADE] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#0A0080] transition-colors">
              <Plus size={16} /> ADD EVENT
            </button>
          )}
        </div>
      </div>

      {syncMsg && (
        <div className="bg-green-50 text-green-700 rounded-xl px-4 py-2.5 border border-green-200 mb-4 text-sm font-medium">{syncMsg}</div>
      )}
      {error && <div className="bg-red-50 text-red-600 rounded-xl p-4 border border-red-200 mb-4">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Month grid — spans 3 cols */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-[#05006C]/10 overflow-hidden">
          {/* Nav */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#05006C]/10">
            <button onClick={() => setView(new Date(yr, mo - 1, 1))} className="p-1.5 rounded-lg hover:bg-[#05006C]/5 text-[#05006C]/50 hover:text-[#05006C] transition-colors">
              <ChevronLeft size={20} />
            </button>
            <span className="text-[#05006C] font-bold tracking-widest text-sm">{monthLabel.toUpperCase()}</span>
            <button onClick={() => setView(new Date(yr, mo + 1, 1))} className="p-1.5 rounded-lg hover:bg-[#05006C]/5 text-[#05006C]/50 hover:text-[#05006C] transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>

          {/* DOW headers */}
          <div className="grid grid-cols-7 border-b border-[#05006C]/10">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-[#05006C]/40 text-xs font-bold tracking-wider py-2.5">{d}</div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day) return <div key={i} className="min-h-[100px] border-b border-r border-[#05006C]/5 bg-[#F5F3EE]/40" />;
              const ds = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const evs = byDate[ds] || [];
              const isToday = ds === todayStr;
              const isSel = ds === selected;
              return (
                <button key={i} onClick={() => setSelected(ds)}
                  className={`min-h-[100px] border-b border-r border-[#05006C]/5 p-1.5 text-left align-top transition-colors ${isSel ? 'bg-[#05006C]/8' : 'hover:bg-[#05006C]/4'}`}>
                  <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full
                    ${isToday ? 'bg-[#05006C] text-[#EEEADE]' : isSel ? 'text-[#05006C]' : 'text-[#05006C]/60'}`}>
                    {day}
                  </span>
                  {evs.length > 0 && (
                    <div className="mt-1 space-y-0.5 px-0.5">
                      {/* Desktop: title pills */}
                      <div className="hidden sm:block space-y-0.5">
                        {evs.slice(0, 3).map(ev => (
                          <span key={ev.id} className={`text-[9px] truncate block px-1 py-0.5 rounded ${typeDot[ev.type]} text-white leading-tight`}>
                            {ev.title}
                          </span>
                        ))}
                        {evs.length > 3 && <span className="text-[8px] text-[#05006C]/30 leading-none">+{evs.length - 3}</span>}
                      </div>
                      {/* Mobile: dots */}
                      <div className="sm:hidden flex flex-wrap gap-0.5 mt-0.5">
                        {evs.slice(0, 3).map(ev => (
                          <span key={ev.id} className={`w-1.5 h-1.5 rounded-full ${typeDot[ev.type]}`} />
                        ))}
                        {evs.length > 3 && <span className="text-[8px] text-[#05006C]/30 leading-none">+{evs.length - 3}</span>}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 px-5 py-3 border-t border-[#05006C]/10">
            {(Object.entries(typeDot) as [CalendarEvent['type'], string][]).map(([t, c]) => (
              <div key={t} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${c}`} />
                <span className="text-[10px] text-[#05006C]/50 capitalize">{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming panel */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-[#05006C]/10 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[#05006C]/10 flex items-center gap-2">
            <Calendar size={15} className="text-[#05006C]/50" />
            <p className="text-[#05006C] font-bold text-sm tracking-wider">UPCOMING</p>
          </div>
          <div className="p-3 flex-1 overflow-y-auto max-h-[600px]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 border-2 border-[#05006C]/20 border-t-[#05006C] rounded-full animate-spin" />
              </div>
            ) : upcomingGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Calendar size={28} className="text-[#05006C]/15 mb-2" />
                <p className="text-[#05006C]/30 text-sm">No upcoming events</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingGroups.map(({ ds, evs }) => (
                  <div key={ds}>
                    <p className="text-[8px] font-bold tracking-widest text-[#05006C]/40 mb-1.5 px-1">{fmtUpcomingDate(ds)}</p>
                    <div className="space-y-1.5">
                      {evs.map(ev => (
                        <div key={ev.id} className="rounded-xl border border-[#05006C]/10 overflow-hidden">
                          <div className={`h-0.5 ${typeColors[ev.type]}`} />
                          <div className="p-2.5">
                            <div className="flex items-start gap-1.5 justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 flex-wrap">
                                  <p className="font-bold text-[#05006C] text-xs truncate">{ev.title}</p>
                                  {ev.source === 'gcal' && (
                                    <span title="From Google Calendar">
                                      <Calendar size={10} className="text-[#05006C]/30 shrink-0" />
                                    </span>
                                  )}
                                </div>
                                <span className={`inline-block mt-0.5 px-1 py-0 rounded text-[9px] font-bold uppercase tracking-wider ${typeBadge[ev.type]}`}>{ev.type}</span>
                              </div>
                              {canEdit && (
                                <div className="flex gap-0.5 shrink-0">
                                  {ev.source !== 'gcal' && (
                                    <button onClick={() => { setEditingId(ev.id); setEditForm({ title: ev.title, description: ev.description || '', date: ev.date?.split('T')[0] || '', time: ev.time || '', location: ev.location || '', type: ev.type }); }}
                                      className="text-[#05006C]/40 hover:text-[#05006C] p-1 transition-colors"><Pencil size={11} /></button>
                                  )}
                                  <button onClick={() => remove(ev.id)} className="text-red-400 hover:text-red-600 p-1 transition-colors"><Trash2 size={11} /></button>
                                </div>
                              )}
                            </div>
                            <div className="mt-1 space-y-0.5">
                              {ev.time && <div className="flex items-center gap-1 text-[10px] text-[#05006C]/50"><Clock size={9} />{ev.time}</div>}
                              {ev.location && <div className="flex items-center gap-1 text-[10px] text-[#05006C]/50 truncate"><MapPin size={9} /><span className="truncate">{ev.location}</span></div>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showNew && <FormModal key="new" heading="ADD EVENT" form={newForm} setForm={setNewForm} onSave={create} onClose={() => setShowNew(false)} busy={busy} />}
        {editingId && <FormModal key="edit" heading="EDIT EVENT" form={editForm} setForm={setEditForm} onSave={() => save(editingId)} onClose={() => setEditingId(null)} busy={busy} />}
      </AnimatePresence>
    </div>
  );
}
