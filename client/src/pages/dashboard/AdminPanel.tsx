import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Trash2, Pencil, Plus, Users, Megaphone, Calendar,
  X, Check, Mail, RotateCcw, Send, ListTodo, Shield,
} from 'lucide-react';

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
  is_editor: boolean;
  createdAt: string;
  name?: string | null;
  pledgeClass?: string | null;
}

interface ClassItem { id: string; name: string; }

interface Update {
  id: string; title: string; content: string;
  authorName?: string; createdAt: string;
}

interface CalendarEvent {
  id: string; title: string; description?: string;
  date: string; time?: string; location?: string;
  type: 'general' | 'social' | 'professional' | 'exec' | 'mandatory';
  createdAt: string;
}

interface Task {
  id: string; title: string; description?: string;
  assignedTo: string; assignedToName?: string;
  assignedBy: string; assignedByName: string;
  dueDate?: string; status: 'pending' | 'in_progress' | 'done';
  createdAt: string;
}

type Tab = 'members' | 'tasks' | 'announcements' | 'events' | 'email';

export default function AdminPanel() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isExecOrAdmin = user?.role === 'exec' || user?.role === 'admin';
  const [activeTab, setActiveTab] = useState<Tab>(isAdmin ? 'members' : 'tasks');

  const tabs: { key: Tab; label: string; icon: typeof Users; adminOnly?: boolean }[] = [
    ...(isAdmin ? [{ key: 'members' as Tab, label: 'MEMBERS', icon: Shield, adminOnly: true }] : []),
    { key: 'tasks', label: 'TASKS', icon: ListTodo },
    { key: 'announcements', label: 'POSTS', icon: Megaphone },
    { key: 'events', label: 'EVENTS', icon: Calendar },
    { key: 'email', label: 'EMAIL', icon: Mail },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Settings size={24} className="text-[#05006C]" />
        <h1 className="text-[#05006C] text-2xl font-bold tracking-widest">
          {isAdmin ? 'ADMIN PANEL' : 'EXEC PANEL'}
        </h1>
      </div>
      <p className="text-[#05006C]/50 text-sm mb-6">
        {isAdmin
          ? 'Full access — user management, tasks, announcements, events, email blast'
          : 'Exec access — tasks, announcements, events, email blast to actives'}
      </p>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex gap-4 border-b border-[#05006C]/10 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 px-1 text-sm font-bold tracking-wider transition-colors flex items-center gap-2 whitespace-nowrap ${
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

        {activeTab === 'members' && isAdmin && token && <MembersTab token={token} />}
        {activeTab === 'tasks' && isExecOrAdmin && token && <TasksTab token={token} />}
        {activeTab === 'announcements' && isExecOrAdmin && token && <AnnouncementsTab token={token} />}
        {activeTab === 'events' && isExecOrAdmin && token && <EventsTab token={token} />}
        {activeTab === 'email' && isExecOrAdmin && token && <EmailBlastTab token={token} />}
      </div>
    </div>
  );
}

/* ─── MEMBERS TAB (admin only) ─── */

function MembersTab({ token }: { token: string }) {
  const [members, setMembers] = useState<MemberUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ email: '', role: 'active' as MemberUser['role'] });
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ email: '', role: 'active' as MemberUser['role'], pledgeClass: '' });
  const [editError, setEditError] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [showClasses, setShowClasses] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [classError, setClassError] = useState('');
  const [resetStatus, setResetStatus] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');

  const fetchMembers = () => {
    setLoading(true);
    apiFetch('/api/admin/users', token)
      .then(setMembers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const fetchClasses = () => {
    apiFetch('/api/classes', token).then(setClasses).catch(() => {});
  };

  useEffect(() => { fetchMembers(); fetchClasses(); }, [token]);

  const openEdit = (m: MemberUser) => {
    setEditing(m.id);
    setEditForm({ email: m.email, role: m.role, pledgeClass: m.pledgeClass || '' });
    setEditError('');
  };

  const handleEdit = async (id: string) => {
    if (!editForm.email.trim()) { setEditError('Email is required'); return; }
    setSubmitting(true);
    setEditError('');
    try {
      const updated = await apiFetch(`/api/admin/users/${id}`, token, {
        method: 'PUT',
        body: JSON.stringify({ email: editForm.email.trim(), role: editForm.role, pledgeClass: editForm.pledgeClass }),
      });
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, email: updated.email, role: updated.role, pledgeClass: updated.pledgeClass ?? m.pledgeClass } : m)));
      setEditing(null);
    } catch (e: any) {
      setEditError(e.message);
    } finally {
      setSubmitting(false);
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
    if (!addForm.email) return;
    setSubmitting(true);
    try {
      await apiFetch('/api/auth/register', token, {
        method: 'POST',
        body: JSON.stringify(addForm),
      });
      setShowAdd(false);
      setAddForm({ email: '', role: 'active' });
      fetchMembers();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (id: string, email: string) => {
    if (!window.confirm(`Send password reset email to ${email}?`)) return;
    setResetStatus(s => ({ ...s, [id]: 'sending' }));
    try {
      const data = await apiFetch(`/api/admin/users/${id}/reset-password`, token, { method: 'POST' });
      setResetStatus(s => ({ ...s, [id]: data.message || 'Sent!' }));
      setTimeout(() => setResetStatus(s => { const n = { ...s }; delete n[id]; return n; }), 4000);
    } catch (e: any) {
      setResetStatus(s => ({ ...s, [id]: `Error: ${e.message}` }));
      setTimeout(() => setResetStatus(s => { const n = { ...s }; delete n[id]; return n; }), 4000);
    }
  };

  const handleAddClass = async () => {
    const name = newClassName.trim();
    if (!name) return;
    setClassError('');
    try {
      const created = await apiFetch('/api/classes', token, { method: 'POST', body: JSON.stringify({ name }) });
      setClasses(prev => [...prev, created]);
      setNewClassName('');
    } catch (e: any) { setClassError(e.message); }
  };

  const handleDeleteClass = async (id: string) => {
    if (!window.confirm('Delete this class?')) return;
    try {
      await apiFetch(`/api/classes/${id}`, token, { method: 'DELETE' });
      setClasses(prev => prev.filter(c => c.id !== id));
      if (classFilter === classes.find(c => c.id === id)?.name) setClassFilter('All');
    } catch (e: any) { alert(e.message); }
  };

  const inputCls = 'bg-white border border-[#05006C]/15 rounded-lg px-3 py-2 text-sm text-[#05006C] focus:outline-none focus:border-[#05006C]/40 w-full';

  if (loading) return <div className="text-[#05006C]/50 text-center py-12 animate-pulse">Loading members...</div>;
  if (error) return <div className="bg-red-50 text-red-600 rounded-xl p-4 border border-red-200">{error}</div>;

  const filteredMembers = members.filter(m => {
    const matchClass = classFilter === 'All' || m.pledgeClass === classFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || (m.name || '').toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    return matchClass && matchSearch;
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <span className="text-[#05006C]/60 text-sm font-bold">{filteredMembers.length} / {members.length} members</span>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowClasses(s => !s); setShowAdd(false); }}
            className="border border-[#05006C]/20 text-[#05006C]/70 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#05006C]/5"
          >
            <Settings size={15} /> Classes
          </button>
          <button
            onClick={() => { setShowAdd(s => !s); setShowClasses(false); }}
            className="bg-[#05006C] text-[#EEEADE] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
          >
            <Plus size={16} /> Add Member
          </button>
        </div>
      </div>

      <div className="mb-3">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-72 bg-white border border-[#05006C]/15 rounded-lg px-4 py-2 text-sm text-[#05006C] placeholder:text-[#05006C]/30 focus:outline-none focus:border-[#05006C]/40 transition"
        />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {['All', ...classes.map(c => c.name)].map(cls => (
          <button
            key={cls}
            onClick={() => setClassFilter(cls)}
            className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide transition-colors cursor-pointer ${
              classFilter === cls ? 'bg-[#05006C] text-[#EEEADE]' : 'bg-[#05006C]/8 text-[#05006C]/60 hover:bg-[#05006C]/15'
            }`}
          >
            {cls}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {showClasses && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#F5F3EE] rounded-xl p-4 mb-4 border border-[#05006C]/10 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#05006C] font-bold text-sm">MANAGE CLASSES</span>
              <button onClick={() => setShowClasses(false)} className="text-[#05006C]/40 hover:text-[#05006C]"><X size={16} /></button>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {classes.map(c => (
                <span key={c.id} className="flex items-center gap-1.5 bg-white border border-[#05006C]/15 rounded-full px-3 py-1 text-xs text-[#05006C] font-medium">
                  {c.name}
                  <button onClick={() => handleDeleteClass(c.id)} className="text-[#05006C]/30 hover:text-red-500 transition-colors"><X size={11} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddClass()}
                placeholder="New class name..."
                className="bg-white border border-[#05006C]/15 rounded-lg px-3 py-2 text-sm text-[#05006C] focus:outline-none focus:border-[#05006C]/40 flex-1"
              />
              <button onClick={handleAddClass} className="bg-[#05006C] text-[#EEEADE] px-4 py-2 rounded-lg text-sm font-bold">Add</button>
            </div>
            {classError && <p className="text-red-600 text-xs mt-2">{classError}</p>}
          </motion.div>
        )}
      </AnimatePresence>

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
          <p className="text-[#05006C]/50 text-xs mb-3">A welcome email with a set-password link will be sent automatically.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="email" placeholder="Email *" value={addForm.email}
              onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
              className="bg-white border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C]" />
            <select value={addForm.role} onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value as MemberUser['role'] }))}
              className="bg-white border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C]">
              <option value="active">Active</option>
              <option value="exec">Exec</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button onClick={handleAdd} disabled={submitting}
            className="bg-[#05006C] text-[#EEEADE] px-4 py-2 rounded-lg text-sm font-bold mt-3 disabled:opacity-50 flex items-center gap-2">
            <Mail size={14} />
            {submitting ? 'Sending invite...' : 'Send Invite'}
          </button>
        </motion.div>
      )}

      <div className="divide-y divide-[#05006C]/10">
        {filteredMembers.map((m) => (
          <div key={m.id}>
            {editing !== m.id && (
              <div className="flex items-center justify-between py-3 gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  {m.name && <p className="text-[#05006C] text-sm font-bold truncate">{m.name}</p>}
                  <p className={`text-[#05006C]/60 truncate ${m.name ? 'text-xs' : 'text-sm font-medium'}`}>{m.email}</p>
                  {m.pledgeClass && <p className="text-[#05006C]/40 text-xs">{m.pledgeClass}</p>}
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  m.role === 'admin' ? 'bg-red-100 text-red-700' :
                  m.role === 'exec' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-[#05006C]/8 text-[#05006C]/60'
                }`}>{m.role}</span>
                {m.is_editor && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wider">editor</span>
                )}

                {resetStatus[m.id] ? (
                  <span className={`text-xs px-2 py-1 rounded-lg ${
                    resetStatus[m.id] === 'sending' ? 'text-[#05006C]/50' :
                    resetStatus[m.id].startsWith('Error') ? 'text-red-600 bg-red-50' :
                    'text-green-600 bg-green-50'
                  }`}>
                    {resetStatus[m.id] === 'sending' ? 'Sending...' : resetStatus[m.id]}
                  </span>
                ) : (
                  <button
                    onClick={() => handleResetPassword(m.id, m.email)}
                    title="Send password reset email"
                    className="border border-[#05006C]/20 text-[#05006C]/60 hover:text-[#05006C] px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1"
                  >
                    <RotateCcw size={12} /> Reset PW
                  </button>
                )}

                <button onClick={() => openEdit(m)}
                  className="border border-[#05006C]/20 text-[#05006C]/60 hover:text-[#05006C] px-2.5 py-1.5 rounded-lg text-xs transition-colors">
                  <Pencil size={13} />
                </button>
                <button onClick={() => handleDelete(m.id, m.email)}
                  className="bg-red-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold">
                  <Trash2 size={13} />
                </button>
              </div>
            )}

            <AnimatePresence>
              {editing === m.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="py-3 overflow-hidden"
                >
                  <div className="bg-[#F5F3EE] rounded-xl p-4 border border-[#05006C]/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[#05006C] font-bold text-xs tracking-wider uppercase">Edit — {m.email}</span>
                      <button onClick={() => setEditing(null)} className="text-[#05006C]/40 hover:text-[#05006C]"><X size={16} /></button>
                    </div>
                    <p className="text-[#05006C]/40 text-xs">To change their password, use the "Reset PW" button — it sends a secure email link.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[#05006C]/50 text-xs mb-1">Email</label>
                        <input type="email" value={editForm.email}
                          onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                          className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-[#05006C]/50 text-xs mb-1">Role</label>
                        <select value={editForm.role}
                          onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value as MemberUser['role'] }))}
                          className={inputCls}>
                          <option value="active">active</option>
                          <option value="exec">exec</option>
                          <option value="admin">admin</option>
                        </select>
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            id={`editor-${m.id}`}
                            checked={!!m.is_editor}
                            onChange={async (e) => {
                              await apiFetch(`/api/admin/users/${m.id}`, token, {
                                method: 'PUT',
                                body: JSON.stringify({ is_editor: e.target.checked }),
                              });
                              fetchMembers();
                            }}
                            className="w-4 h-4 accent-purple-600"
                          />
                          <label htmlFor={`editor-${m.id}`} className="text-xs text-slate-600 font-medium">
                            Website Editor Access
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[#05006C]/50 text-xs mb-1">Class</label>
                        <select value={editForm.pledgeClass}
                          onChange={(e) => setEditForm((f) => ({ ...f, pledgeClass: e.target.value }))}
                          className={inputCls}>
                          <option value="">— none —</option>
                          {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                    {editError && (
                      <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{editError}</p>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(m.id)} disabled={submitting}
                        className="bg-[#05006C] text-[#EEEADE] px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50">
                        <Check size={13} /> {submitting ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={() => setEditing(null)}
                        className="border border-[#05006C]/20 text-[#05006C]/60 px-3 py-2 rounded-lg text-xs">Cancel</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── TASKS TAB ─── */

function TasksTab({ token }: { token: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ title: '', description: '', assignedTo: '', dueDate: '' });
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | Task['status']>('all');

  const fetchTasks = () => {
    setLoading(true);
    Promise.all([
      apiFetch('/api/tasks', token),
      apiFetch('/api/admin/users', token).catch(() => []),
    ])
      .then(([t, m]) => {
        setTasks(t);
        setMembers(m.map((u: any) => ({ id: u.id, name: u.name || u.email, email: u.email })));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, [token]);

  const handleCreate = async () => {
    if (!newForm.title || !newForm.assignedTo) return;
    setSubmitting(true);
    try {
      await apiFetch('/api/tasks', token, { method: 'POST', body: JSON.stringify(newForm) });
      setShowNew(false);
      setNewForm({ title: '', description: '', assignedTo: '', dueDate: '' });
      fetchTasks();
    } catch (e: any) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await apiFetch(`/api/tasks/${id}`, token, { method: 'DELETE' });
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (e: any) { alert(e.message); }
  };

  const handleStatusChange = async (id: string, status: Task['status']) => {
    try {
      await apiFetch(`/api/tasks/${id}`, token, { method: 'PUT', body: JSON.stringify({ status }) });
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    } catch (e: any) { alert(e.message); }
  };

  const statusColors: Record<Task['status'], string> = {
    pending: 'bg-[#05006C]/8 text-[#05006C]/60',
    in_progress: 'bg-blue-50 text-blue-700',
    done: 'bg-green-50 text-green-700',
  };

  if (loading) return <div className="text-[#05006C]/50 text-center py-12 animate-pulse">Loading tasks...</div>;

  const filtered = filterStatus === 'all' ? tasks : tasks.filter(t => t.status === filterStatus);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-1.5">
          {(['all', 'pending', 'in_progress', 'done'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                filterStatus === s ? 'bg-[#05006C] text-[#EEEADE]' : 'bg-[#05006C]/8 text-[#05006C]/60 hover:bg-[#05006C]/15'
              }`}>
              {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={() => setShowNew(s => !s)}
          className="bg-[#05006C] text-[#EEEADE] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
          <Plus size={16} /> Assign Task
        </button>
      </div>

      {showNew && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-[#F5F3EE] rounded-xl p-4 mb-4 border border-[#05006C]/10"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#05006C] font-bold text-sm">ASSIGN TASK</span>
            <button onClick={() => setShowNew(false)} className="text-[#05006C]/40 hover:text-[#05006C]"><X size={18} /></button>
          </div>
          <div className="space-y-3">
            <input placeholder="Task title *" value={newForm.title}
              onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))}
              className="w-full bg-white border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C]" />
            <textarea placeholder="Description (optional)" value={newForm.description}
              onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))}
              className="w-full bg-white border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C] min-h-16 resize-none" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select value={newForm.assignedTo}
                onChange={e => setNewForm(f => ({ ...f, assignedTo: e.target.value }))}
                className="bg-white border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C]">
                <option value="">Assign to... *</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <input type="date" value={newForm.dueDate}
                onChange={e => setNewForm(f => ({ ...f, dueDate: e.target.value }))}
                className="bg-white border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C]" />
            </div>
          </div>
          <button onClick={handleCreate} disabled={submitting || !newForm.title || !newForm.assignedTo}
            className="bg-[#05006C] text-[#EEEADE] px-4 py-2 rounded-lg text-sm font-bold mt-3 disabled:opacity-50">
            {submitting ? 'Assigning...' : 'Assign Task'}
          </button>
        </motion.div>
      )}

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-[#05006C]/40 text-center py-8 text-sm">No tasks{filterStatus !== 'all' ? ` with status "${filterStatus}"` : ''}</p>
        )}
        {filtered.map(task => (
          <div key={task.id} className={`bg-[#F5F3EE] rounded-xl p-4 border border-[#05006C]/10 ${task.status === 'done' ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-bold text-sm text-[#05006C] ${task.status === 'done' ? 'line-through' : ''}`}>
                    {task.title}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColors[task.status]}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
                {task.description && <p className="text-[#05006C]/50 text-xs mt-1">{task.description}</p>}
                <div className="flex gap-3 mt-1.5 flex-wrap">
                  <span className="text-[#05006C]/40 text-xs">→ {task.assignedToName}</span>
                  {task.dueDate && (
                    <span className={`text-xs ${new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'text-red-500 font-medium' : 'text-[#05006C]/30'}`}>
                      Due {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <select
                  value={task.status}
                  onChange={e => handleStatusChange(task.id, e.target.value as Task['status'])}
                  className="bg-white border border-[#05006C]/15 rounded-lg px-2 py-1 text-xs text-[#05006C]"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
                <button onClick={() => handleDelete(task.id)}
                  className="bg-red-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── EMAIL BLAST TAB ─── */

function EmailBlastTab({ token }: { token: string }) {
  const [form, setForm] = useState({ subject: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSend = async () => {
    if (!form.subject.trim() || !form.content.trim()) return;
    if (!window.confirm(`Send this email to all active members?`)) return;
    setSubmitting(true);
    setResult(null);
    try {
      const data = await apiFetch('/api/admin/email-blast', token, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setResult({ success: true, message: data.message });
      setForm({ subject: '', content: '' });
    } catch (e: any) {
      setResult({ success: false, message: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-[#05006C] font-bold text-sm tracking-wider mb-1">EMAIL ALL ACTIVES</h3>
        <p className="text-[#05006C]/50 text-xs">Sends to all members with the "active" role. Exec and admin are not included.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-[#05006C]/60 text-xs font-bold tracking-wider mb-1.5">SUBJECT</label>
          <input
            value={form.subject}
            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            placeholder="Email subject..."
            className="w-full bg-[#F5F3EE] border border-[#05006C]/15 rounded-xl px-4 py-3 text-sm text-[#05006C] focus:outline-none focus:border-[#05006C]/40"
          />
        </div>
        <div>
          <label className="block text-[#05006C]/60 text-xs font-bold tracking-wider mb-1.5">MESSAGE</label>
          <textarea
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Write your message to the chapter..."
            rows={8}
            className="w-full bg-[#F5F3EE] border border-[#05006C]/15 rounded-xl px-4 py-3 text-sm text-[#05006C] focus:outline-none focus:border-[#05006C]/40 resize-none"
          />
        </div>

        {result && (
          <div className={`rounded-xl p-4 border text-sm font-medium ${
            result.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {result.message}
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={submitting || !form.subject.trim() || !form.content.trim()}
          className="bg-[#05006C] text-[#EEEADE] px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50 hover:bg-[#05006C]/90 transition-colors"
        >
          <Send size={16} />
          {submitting ? 'Sending...' : 'Send to All Actives'}
        </button>
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
      await apiFetch('/api/updates', token, { method: 'POST', body: JSON.stringify(newForm) });
      setShowNew(false);
      setNewForm({ title: '', content: '' });
      fetchUpdates();
    } catch (e: any) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  const handleEdit = async (id: string) => {
    setSubmitting(true);
    try {
      await apiFetch(`/api/updates/${id}`, token, { method: 'PUT', body: JSON.stringify(editForm) });
      setEditing(null);
      fetchUpdates();
    } catch (e: any) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await apiFetch(`/api/updates/${id}`, token, { method: 'DELETE' });
      setUpdates((prev) => prev.filter((u) => u.id !== id));
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <div className="text-[#05006C]/50 text-center py-12 animate-pulse">Loading announcements...</div>;
  if (error) return <div className="bg-red-50 text-red-600 rounded-xl p-4 border border-red-200">{error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[#05006C]/60 text-sm font-bold">{updates.length} announcements</span>
        <button onClick={() => setShowNew(!showNew)}
          className="bg-[#05006C] text-[#EEEADE] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
          <Plus size={16} /> New Announcement
        </button>
      </div>

      {showNew && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="bg-[#F5F3EE] rounded-xl p-4 mb-4 border border-[#05006C]/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#05006C] font-bold text-sm">NEW ANNOUNCEMENT</span>
            <button onClick={() => setShowNew(false)} className="text-[#05006C]/40 hover:text-[#05006C]"><X size={18} /></button>
          </div>
          <input placeholder="Title" value={newForm.title}
            onChange={(e) => setNewForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full bg-white border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C] mb-3" />
          <textarea placeholder="Content" value={newForm.content}
            onChange={(e) => setNewForm((f) => ({ ...f, content: e.target.value }))}
            className="w-full bg-white border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C] min-h-32 mb-3" />
          <button onClick={handleCreate} disabled={submitting}
            className="bg-[#05006C] text-[#EEEADE] px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50">
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </motion.div>
      )}

      <div className="space-y-3">
        {updates.map((u) => (
          <div key={u.id} className="bg-[#F5F3EE] rounded-xl p-4 border border-[#05006C]/10">
            {editing === u.id ? (
              <div>
                <input value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full bg-white border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C] mb-2" />
                <textarea value={editForm.content}
                  onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
                  className="w-full bg-white border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C] min-h-32 mb-2" />
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(u.id)} disabled={submitting}
                    className="bg-[#05006C] text-[#EEEADE] px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50">Save</button>
                  <button onClick={() => setEditing(null)}
                    className="border border-[#05006C]/20 text-[#05006C]/70 px-3 py-1.5 rounded-lg text-xs">Cancel</button>
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
                  <button onClick={() => { setEditing(u.id); setEditForm({ title: u.title, content: u.content }); }}
                    className="border border-[#05006C]/20 text-[#05006C]/70 px-3 py-1.5 rounded-lg text-xs"><Pencil size={13} /></button>
                  <button onClick={() => handleDelete(u.id)}
                    className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold"><Trash2 size={13} /></button>
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
    apiFetch('/api/events', token).then(setEvents).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchEvents(); }, [token]);

  const handleCreate = async () => {
    if (!newForm.title || !newForm.date) return;
    setSubmitting(true);
    try {
      await apiFetch('/api/events', token, { method: 'POST', body: JSON.stringify(newForm) });
      setShowNew(false);
      setNewForm({ title: '', description: '', date: '', time: '', location: '', type: 'general' });
      fetchEvents();
    } catch (e: any) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  const handleEdit = async (id: string) => {
    setSubmitting(true);
    try {
      await apiFetch(`/api/events/${id}`, token, { method: 'PUT', body: JSON.stringify(editForm) });
      setEditing(null);
      fetchEvents();
    } catch (e: any) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await apiFetch(`/api/events/${id}`, token, { method: 'DELETE' });
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (e: any) { alert(e.message); }
  };

  const typeBadgeColors: Record<CalendarEvent['type'], string> = {
    mandatory: 'bg-red-100 text-red-700',
    exec: 'bg-purple-100 text-purple-700',
    social: 'bg-blue-100 text-blue-700',
    professional: 'bg-green-100 text-green-700',
    general: 'bg-[#05006C]/10 text-[#05006C]',
  };

  const eventFormFields = (form: typeof newForm, setForm: (fn: (f: typeof newForm) => typeof newForm) => void) => (
    <div className="space-y-3">
      <input placeholder="Title *" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        className="w-full bg-white border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C]" />
      <textarea placeholder="Description (optional)" value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        className="w-full bg-white border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C] min-h-20" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          className="bg-white border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C]" />
        <input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
          className="bg-white border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C]" />
        <input placeholder="Location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          className="bg-white border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C]" />
        <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CalendarEvent['type'] }))}
          className="bg-white border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C]">
          <option value="general">General</option>
          <option value="social">Social</option>
          <option value="professional">Professional</option>
          <option value="exec">Exec</option>
          <option value="mandatory">Mandatory</option>
        </select>
      </div>
    </div>
  );

  if (loading) return <div className="text-[#05006C]/50 text-center py-12 animate-pulse">Loading events...</div>;
  if (error) return <div className="bg-red-50 text-red-600 rounded-xl p-4 border border-red-200">{error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[#05006C]/60 text-sm font-bold">{events.length} events</span>
        <button onClick={() => setShowNew(!showNew)}
          className="bg-[#05006C] text-[#EEEADE] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
          <Plus size={16} /> Add Event
        </button>
      </div>

      {showNew && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="bg-[#F5F3EE] rounded-xl p-4 mb-4 border border-[#05006C]/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#05006C] font-bold text-sm">ADD EVENT</span>
            <button onClick={() => setShowNew(false)} className="text-[#05006C]/40 hover:text-[#05006C]"><X size={18} /></button>
          </div>
          {eventFormFields(newForm, setNewForm)}
          <button onClick={handleCreate} disabled={submitting}
            className="bg-[#05006C] text-[#EEEADE] px-4 py-2 rounded-lg text-sm font-bold mt-3 disabled:opacity-50">
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
                  <button onClick={() => handleEdit(ev.id)} disabled={submitting}
                    className="bg-[#05006C] text-[#EEEADE] px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50">Save</button>
                  <button onClick={() => setEditing(null)}
                    className="border border-[#05006C]/20 text-[#05006C]/70 px-3 py-1.5 rounded-lg text-xs">Cancel</button>
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
                    {new Date(ev.date).toLocaleDateString()}{ev.time && ` at ${ev.time}`}{ev.location && ` — ${ev.location}`}
                  </p>
                  {ev.description && <p className="text-[#05006C]/70 text-sm mt-1 line-clamp-2">{ev.description}</p>}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => {
                    setEditing(ev.id);
                    setEditForm({ title: ev.title, description: ev.description || '', date: ev.date?.split('T')[0] || '', time: ev.time || '', location: ev.location || '', type: ev.type });
                  }} className="border border-[#05006C]/20 text-[#05006C]/70 px-3 py-1.5 rounded-lg text-xs"><Pencil size={13} /></button>
                  <button onClick={() => handleDelete(ev.id)}
                    className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold"><Trash2 size={13} /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
