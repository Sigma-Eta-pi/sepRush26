import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Clock, User, Megaphone, Plus, Pencil, Trash2, X } from "lucide-react";

interface Update {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
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

export default function Updates() {
  const { user, token } = useAuth();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ title: "", content: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", content: "" });
  const [submitting, setSubmitting] = useState(false);

  const isExecOrAdmin = user?.role === "exec" || user?.role === "admin";

  const fetchUpdates = () => {
    if (!token) return;
    setLoading(true);
    apiFetch("/api/updates", token)
      .then(setUpdates)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUpdates();
  }, [token]);

  const handleCreate = async () => {
    if (!token || !newForm.title || !newForm.content) return;
    setSubmitting(true);
    try {
      const created = await apiFetch("/api/updates", token, {
        method: "POST",
        body: JSON.stringify(newForm),
      });
      setShowNew(false);
      setNewForm({ title: "", content: "" });
      setUpdates(prev => [created, ...prev]);
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
      await apiFetch(`/api/updates/${id}`, token, {
        method: "PUT",
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
    if (!token || !window.confirm("Delete this update?")) return;
    try {
      await apiFetch(`/api/updates/${id}`, token, { method: "DELETE" });
      setUpdates(prev => prev.filter(u => u.id !== id));
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Megaphone size={24} className="text-[#05006C]" />
          <h1 className="text-[#05006C] text-2xl font-bold tracking-widest">
            UPDATES
          </h1>
        </div>
        {isExecOrAdmin && (
          <button
            onClick={() => setShowNew(!showNew)}
            className="bg-[#05006C] text-[#EEEADE] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
          >
            <Plus size={16} /> NEW UPDATE
          </button>
        )}
      </div>

      {showNew && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-[#05006C]/10 mb-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#05006C] font-bold text-sm tracking-wider">
              NEW UPDATE
            </span>
            <button
              onClick={() => setShowNew(false)}
              className="text-[#05006C]/40 hover:text-[#05006C]"
            >
              <X size={18} />
            </button>
          </div>
          <input
            placeholder="Title"
            value={newForm.title}
            onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))}
            className="w-full bg-[#F5F3EE] border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C] mb-3"
          />
          <textarea
            placeholder="Content"
            value={newForm.content}
            onChange={e => setNewForm(f => ({ ...f, content: e.target.value }))}
            className="w-full bg-[#F5F3EE] border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C] min-h-32 mb-3"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="bg-[#05006C] text-[#EEEADE] px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
            >
              {submitting ? "Posting..." : "POST"}
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
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm p-6 border border-[#05006C]/10 animate-pulse"
            >
              <div className="h-5 bg-[#05006C]/10 rounded w-1/3 mb-3" />
              <div className="h-3 bg-[#05006C]/5 rounded w-1/4 mb-4" />
              <div className="space-y-2">
                <div className="h-3 bg-[#05006C]/5 rounded w-full" />
                <div className="h-3 bg-[#05006C]/5 rounded w-2/3" />
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

      {!loading && !error && updates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-[#05006C]/10 rounded-full flex items-center justify-center mb-4">
            <Megaphone size={28} className="text-[#05006C]/40" />
          </div>
          <p className="text-[#05006C]/50 mt-2">No updates yet</p>
        </div>
      )}

      {!loading && !error && updates.length > 0 && (
        <div className="space-y-4">
          {updates.map((update, i) => (
            <motion.div
              key={update.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-[#05006C]/10 relative"
            >
              {editing === update.id ? (
                <div>
                  <input
                    value={editForm.title}
                    onChange={e =>
                      setEditForm(f => ({ ...f, title: e.target.value }))
                    }
                    className="w-full bg-[#F5F3EE] border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C] mb-2"
                  />
                  <textarea
                    value={editForm.content}
                    onChange={e =>
                      setEditForm(f => ({ ...f, content: e.target.value }))
                    }
                    className="w-full bg-[#F5F3EE] border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C] min-h-32 mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(update.id)}
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
                <>
                  {isExecOrAdmin && (
                    <div className="absolute top-4 right-4 flex gap-1.5">
                      <button
                        onClick={() => {
                          setEditing(update.id);
                          setEditForm({
                            title: update.title,
                            content: update.content,
                          });
                        }}
                        className="border border-[#05006C]/20 text-[#05006C]/70 px-2 py-1.5 rounded-lg hover:bg-[#05006C]/5"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(update.id)}
                        className="bg-red-500 text-white px-2 py-1.5 rounded-lg hover:bg-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                  <h2 className="text-[#05006C] text-xl font-bold pr-20">
                    {update.title}
                  </h2>
                  <div className="flex gap-4 mt-1 text-[#05006C]/50 text-sm">
                    <span className="flex items-center gap-1">
                      <User size={14} /> {update.authorName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />{" "}
                      {new Date(update.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[#05006C]/80 mt-4 leading-relaxed whitespace-pre-wrap">
                    {update.content}
                  </p>
                </>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
