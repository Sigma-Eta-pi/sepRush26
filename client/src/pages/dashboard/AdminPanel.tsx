import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Settings, Trash2, Pencil, Plus, Users, Megaphone, Calendar, X } from 'lucide-react';

async function apiFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options?.headers },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

interface MemberUser {
  id: string;
  email: string;
  role: 'active' | 'exec' | 'admin';
  createdAt: string;
}

interface Update {
  id: string;
  title: string;
  content: string;
  authorName?: string;
  createdAt: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  location?: string;
  type: 'general' | 'social' | 'professional' | 'exec' | 'mandatory';
  createdAt: string;
}

type Tab = 'members' | 'announcements' | 'events';

export default function AdminPanel() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isExecOrAdmin = user?.role === 'exec' || user?.role === 'admin';
  const [activeTab, setActiveTab] = useState<Tab>(isAdmin ? 'members' : 'announcements');

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    ...(isAdmin ? [{ key: 'members' as Tab, label: 'MEMBERS', icon: Users }] : []),
    { key: 'announcements', label: 'ANNOUNCEMENTS', icon: Megaphone },
    { key: 'events', label: 'EVENTS', icon: Calendar },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Settings size={24} className="text-[#05006C]" />
        <h1 className="text-[#05006C] text-2xl font-bold tracking-widest">ADMIN PANEL</h1>
      </div>
      <p className="text-[#05006C]/50 text-sm mb-6">
        {isAdmin ? 'Full admin access' : 'Exec access'}
      </p>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex gap-4 border-b border-[#05006C]/10 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 px-1 text-sm font-bold tracking-wider transition-colors flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'border-b-2 border-[#05006C] text-[#05006C]'
                  : 'text-[#05006C]/50 hover:text-[#05006C]/70'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'members' && !isAdmin && (
          <p className="text-[#05006C]/50 text-center py-12">Admin only</p>
        )}
        {activeTab === 'members' && isAdmin && token && <MembersTab token={token} />}
        {activeTab === 'announcements' && isExecOrAdmin && token && <AnnouncementsTab token={token} />}
        {activeTab === 'events' && isExecOrAdmin && token && <EventsTab token={token} />}
      </div>
    </div>
  );
}

/* ─── MEMBERS TAB ─── */

function MembersTab({ token }: { token: string }) {
  const [members, setMembers] = useState<MemberUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ email: '', password: '', role: 'active' as MemberUser['role'] });
  const [submitting, setSubmitting] = useState(false);

  const fetchMembers = () => {
    setLoading(true);
    apiFetch('/api/admin/users', token)
      .then(setMembers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMembers(); }, [token]);

  const handleRoleChange = async (id: string, role: string) => {
    try {
      await apiFetch(`/api/admin/users/${id}`, token, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      });
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role: role as MemberUser['role'] } : m)));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!window.confirm(`Delete ${email}?`)) return;
    try {
      await apiFetch(`/api/admin/users/${id}`, token, { method: 'DELETE' });
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleAdd = async () => {
    if (!addForm.email || !addForm.password) return;
    setSubmitting(true);
    try {
      await apiFetch('/api/auth/register', token, {
        method: 'POST',
        body: JSON.stringify(addForm),
      });
      setShowAdd(false);
      setAddForm({ email: '', password: '', role: 'active' });
      fetchMembers();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-[#05006C]/50 text-center py-12 animate-pulse">Loading members...</div>;
  if (error) return <div className="bg-red-50 text-red-600 rounded-xl p-4 border border-red-200">{error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[#05006C]/60 text-sm font-bold">{members.length} members</span>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-[#05006C] text-[#EEEADE] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
        >
          <Plus size={16} /> Add Member
        </button>
      </div>

      {showAdd && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-[#F5F3EE] rounded-xl p-4 mb-4 border border-[#05006C]/10"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#05006C] font-bold text-sm">NEW MEMBER</span>
            <button onClick={() => setShowAdd(false)} className="text-[#05006C]/40 hover:text-[#05006C]"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="email"
              placeholder="Email"
              value={addForm.email}
              onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
              className="bg-white border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C]"
            />
            <input
              type="password"
              placeholder="Password"
              value={addForm.password}
              onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
              className="bg-white border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C]"
            />
            <select
              value={addForm.role}
              onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value as MemberUser['role'] }))}
              className="bg-white border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C]"
            >
              <option value="active">Active</option>
              <option value="exec">Exec</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={submitting}
            className="bg-[#05006C] text-[#EEEADE] px-4 py-2 rounded-lg text-sm font-bold mt-3 disabled:opacity-50"
          >
            {submitting ? 'Adding...' : 'Add'}
          </button>
        </motion.div>
      )}

      <div className="divide-y divide-[#05006C]/10">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between py-3 gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[#05006C] text-sm font-medium truncate">{m.email}</p>
              <p className="text-[#05006C]/40 text-xs">{new Date(m.createdAt).toLocaleDateString()}</p>
            </div>
            <select
              value={m.role}
              onChange={(e) => handleRoleChange(m.id, e.target.value)}
              className="bg-[#F5F3EE] border border-[#05006C]/15 rounded-lg px-3 py-1.5 text-xs text-[#05006C] font-bold"
            >
              <option value="active">active</option>
              <option value="exec">exec</option>
              <option value="admin">admin</option>
            </select>
            <button
              onClick={() => handleDelete(m.id, m.email)}
              className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── ANNOUNCEMENTS TAB ─── */

function AnnouncementsTab({ token }: { token: string }) {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ title: '', content: '' });
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchUpdates = () => {
    setLoading(true);
    apiFetch('/api/updates', token)
      .then(setUpdates)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUpdates(); }, [token]);

  const handleCreate = async () => {
    if (!newForm.title || !newForm.content) return;
    setSubmitting(true);
    try {
      await apiFetch('/api/updates', token, {
        method: 'POST',
        body: JSON.stringify(newForm),
      });
      setShowNew(false);
      setNewForm({ title: '', content: '' });
      fetchUpdates();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (id: string) => {
    setSubmitting(true);
    try {
      await apiFetch(`/api/updates/${id}`, token, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      setEditing(null);
      fetchUpdates();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await apiFetch(`/api/updates/${id}`, token, { method: 'DELETE' });
      setUpdates((prev) => prev.filter((u) => u.id !== id));
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) return <div className="text-[#05006C]/50 text-center py-12 animate-pulse">Loading announcements...</div>;
  if (error) return <div className="bg-red-50 text-red-600 rounded-xl p-4 border border-red-200">{error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[#05006C]/60 text-sm font-bold">{updates.length} announcements</span>
        <button
          onClick={() => setShowNew(!showNew)}
          className="bg-[#05006C] text-[#EEEADE] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
        >
          <Plus size={16} /> New Announcement
        </button>
      </div>

      {showNew && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-[#F5F3EE] rounded-xl p-4 mb-4 border border-[#05006C]/10"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#05006C] font-bold text-sm">NEW ANNOUNCEMENT</span>
            <button onClick={() => setShowNew(false)} className="text-[#05006C]/40 hover:text-[#05006C]"><X size={18} /></button>
          </div>
          <input
            placeholder="Title"
            value={newForm.title}
            onChange={(e) => setNewForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full bg-white border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C] mb-3"
          />
          <textarea
            placeholder="Content"
            value={newForm.content}
            onChange={(e) => setNewForm((f) => ({ ...f, content: e.target.value }))}
            className="w-full bg-white border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C] min-h-32 mb-3"
          />
          <button
            onClick={handleCreate}
            disabled={submitting}
            className="bg-[#05006C] text-[#EEEADE] px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
          >
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </motion.div>
      )}

      <div className="space-y-3">
        {updates.map((u) => (
          <div key={u.id} className="bg-[#F5F3EE] rounded-xl p-4 border border-[#05006C]/10">
            {editing === u.id ? (
              <div>
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full bg-white border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C] mb-2"
                />
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
                  className="w-full bg-white border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C] min-h-32 mb-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(u.id)}
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
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[#05006C] font-bold text-sm">{u.title}</h3>
                  <p className="text-[#05006C]/40 text-xs mt-0.5">{new Date(u.createdAt).toLocaleDateString()}</p>
                  <p className="text-[#05006C]/70 text-sm mt-1 line-clamp-2">{u.content}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => { setEditing(u.id); setEditForm({ title: u.title, content: u.content }); }}
                    className="border border-[#05006C]/20 text-[#05006C]/70 px-3 py-1.5 rounded-lg text-xs"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── EVENTS TAB ─── */

function EventsTab({ token }: { token: string }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ title: '', description: '', date: '', time: '', location: '', type: 'general' as CalendarEvent['type'] });
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', date: '', time: '', location: '', type: 'general' as CalendarEvent['type'] });
  const [submitting, setSubmitting] = useState(false);

  const fetchEvents = () => {
    setLoading(true);
    apiFetch('/api/events', token)
      .then(setEvents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEvents(); }, [token]);

  const handleCreate = async () => {
    if (!newForm.title || !newForm.date) return;
    setSubmitting(true);
    try {
      await apiFetch('/api/events', token, {
        method: 'POST',
        body: JSON.stringify(newForm),
      });
      setShowNew(false);
      setNewForm({ title: '', description: '', date: '', time: '', location: '', type: 'general' });
      fetchEvents();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (id: string) => {
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
    if (!window.confirm('Delete this event?')) return;
    try {
      await apiFetch(`/api/events/${id}`, token, { method: 'DELETE' });
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const typeBadgeColors: Record<CalendarEvent['type'], string> = {
    mandatory: 'bg-red-100 text-red-700',
    exec: 'bg-purple-100 text-purple-700',
    social: 'bg-blue-100 text-blue-700',
    professional: 'bg-green-100 text-green-700',
    general: 'bg-[#05006C]/10 text-[#05006C]',
  };

  if (loading) return <div className="text-[#05006C]/50 text-center py-12 animate-pulse">Loading events...</div>;
  if (error) return <div className="bg-red-50 text-red-600 rounded-xl p-4 border border-red-200">{error}</div>;

  const eventFormFields = (form: typeof newForm, setForm: (fn: (f: typeof newForm) => typeof newForm) => void) => (
    <div className="space-y-3">
      <input
        placeholder="Title *"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        className="w-full bg-white border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C]"
      />
      <textarea
        placeholder="Description (optional)"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        className="w-full bg-white border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C] min-h-20"
      />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          className="bg-white border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C]"
        />
        <input
          type="time"
          value={form.time}
          onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
          className="bg-white border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C]"
        />
        <input
          placeholder="Location"
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          className="bg-white border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C]"
        />
        <select
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CalendarEvent['type'] }))}
          className="bg-white border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C]"
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[#05006C]/60 text-sm font-bold">{events.length} events</span>
        <button
          onClick={() => setShowNew(!showNew)}
          className="bg-[#05006C] text-[#EEEADE] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
        >
          <Plus size={16} /> Add Event
        </button>
      </div>

      {showNew && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-[#F5F3EE] rounded-xl p-4 mb-4 border border-[#05006C]/10"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#05006C] font-bold text-sm">ADD EVENT</span>
            <button onClick={() => setShowNew(false)} className="text-[#05006C]/40 hover:text-[#05006C]"><X size={18} /></button>
          </div>
          {eventFormFields(newForm, setNewForm)}
          <button
            onClick={handleCreate}
            disabled={submitting}
            className="bg-[#05006C] text-[#EEEADE] px-4 py-2 rounded-lg text-sm font-bold mt-3 disabled:opacity-50"
          >
            {submitting ? 'Adding...' : 'Add Event'}
          </button>
        </motion.div>
      )}

      <div className="space-y-3">
        {events.map((ev) => (
          <div key={ev.id} className="bg-[#F5F3EE] rounded-xl p-4 border border-[#05006C]/10">
            {editing === ev.id ? (
              <div>
                {eventFormFields(editForm, setEditForm)}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleEdit(ev.id)}
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
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[#05006C] font-bold text-sm">{ev.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${typeBadgeColors[ev.type]}`}>
                      {ev.type}
                    </span>
                  </div>
                  <p className="text-[#05006C]/40 text-xs mt-0.5">
                    {new Date(ev.date).toLocaleDateString()}
                    {ev.time && ` at ${ev.time}`}
                    {ev.location && ` — ${ev.location}`}
                  </p>
                  {ev.description && <p className="text-[#05006C]/70 text-sm mt-1 line-clamp-2">{ev.description}</p>}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => {
                      setEditing(ev.id);
                      setEditForm({
                        title: ev.title,
                        description: ev.description || '',
                        date: ev.date?.split('T')[0] || '',
                        time: ev.time || '',
                        location: ev.location || '',
                        type: ev.type,
                      });
                    }}
                    className="border border-[#05006C]/20 text-[#05006C]/70 px-3 py-1.5 rounded-lg text-xs"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(ev.id)}
                    className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
