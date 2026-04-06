import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock, AlertCircle, ListTodo } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  assignedToName?: string;
  assignedBy: string;
  assignedByName: string;
  dueDate?: string;
  status: 'pending' | 'in_progress' | 'done';
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

const STATUS_CONFIG = {
  pending: { label: 'To Do', icon: Circle, color: 'text-[#05006C]/40', badge: 'bg-[#05006C]/8 text-[#05006C]/60' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'text-blue-500', badge: 'bg-blue-50 text-blue-700' },
  done: { label: 'Done', icon: CheckCircle2, color: 'text-green-500', badge: 'bg-green-50 text-green-700' },
};

function isOverdue(dueDate?: string, status?: string) {
  if (!dueDate || status === 'done') return false;
  return new Date(dueDate) < new Date();
}

export default function TasksView() {
  const { token, user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchTasks = () => {
    setLoading(true);
    apiFetch('/api/tasks', token!)
      .then(setTasks)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, [token]);

  const updateStatus = async (id: string, status: Task['status']) => {
    setUpdating(id);
    try {
      const updated = await apiFetch(`/api/tasks/${id}`, token!, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: updated.status } : t));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUpdating(null);
    }
  };

  const isPrivileged = user?.role === 'exec' || user?.role === 'admin';

  if (loading) return <div className="text-[#05006C]/50 text-center py-20 animate-pulse">Loading tasks...</div>;
  if (error) return <div className="bg-red-50 text-red-600 rounded-xl p-4 border border-red-200">{error}</div>;

  const pending = tasks.filter(t => t.status === 'pending');
  const inProgress = tasks.filter(t => t.status === 'in_progress');
  const done = tasks.filter(t => t.status === 'done');

  if (tasks.length === 0) {
    return (
      <div className="text-center py-20">
        <ListTodo size={40} className="text-[#05006C]/20 mx-auto mb-4" />
        <p className="text-[#05006C]/40 font-medium">No tasks assigned yet</p>
        {isPrivileged && <p className="text-[#05006C]/30 text-sm mt-1">Create tasks from the Admin Panel</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <ListTodo size={24} className="text-[#05006C]" />
        <div>
          <h1 className="text-[#05006C] text-2xl font-bold tracking-widest">
            {isPrivileged ? 'ALL TASKS' : 'MY TASKS'}
          </h1>
          <p className="text-[#05006C]/40 text-xs mt-0.5">{tasks.length} total · {pending.length} pending · {inProgress.length} in progress</p>
        </div>
      </div>

      <div className="space-y-6">
        {[
          { label: 'To Do', items: pending, status: 'pending' as const },
          { label: 'In Progress', items: inProgress, status: 'in_progress' as const },
          { label: 'Done', items: done, status: 'done' as const },
        ].map(group => group.items.length > 0 && (
          <div key={group.status}>
            <h2 className="text-[#05006C]/50 text-xs font-bold tracking-widest uppercase mb-3 flex items-center gap-2">
              {(() => { const S = STATUS_CONFIG[group.status]; return <S.icon size={13} className={S.color} />; })()}
              {group.label} ({group.items.length})
            </h2>
            <div className="space-y-2">
              {group.items.map(task => {
                const overdue = isOverdue(task.dueDate, task.status);
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white rounded-xl p-4 border transition-all ${
                      overdue ? 'border-red-200' : 'border-[#05006C]/8'
                    } ${task.status === 'done' ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-bold text-sm text-[#05006C] ${task.status === 'done' ? 'line-through' : ''}`}>
                            {task.title}
                          </span>
                          {overdue && (
                            <span className="flex items-center gap-1 text-red-600 text-xs font-bold">
                              <AlertCircle size={11} /> Overdue
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-[#05006C]/50 text-xs mt-1 leading-relaxed">{task.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {isPrivileged && task.assignedToName && (
                            <span className="text-[#05006C]/40 text-xs">→ {task.assignedToName}</span>
                          )}
                          <span className="text-[#05006C]/30 text-xs">From {task.assignedByName}</span>
                          {task.dueDate && (
                            <span className={`text-xs ${overdue ? 'text-red-500 font-medium' : 'text-[#05006C]/30'}`}>
                              Due {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status selector — active users can update their own tasks */}
                      {(user?.role === 'active' ? task.assignedTo === user.id : true) && task.status !== 'done' && (
                        <div className="flex gap-1.5 flex-shrink-0">
                          {task.status === 'pending' && (
                            <button
                              onClick={() => updateStatus(task.id, 'in_progress')}
                              disabled={updating === task.id}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
                            >
                              Start
                            </button>
                          )}
                          <button
                            onClick={() => updateStatus(task.id, 'done')}
                            disabled={updating === task.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
                          >
                            Done
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
