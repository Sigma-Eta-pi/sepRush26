import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ExternalLink, Trash2, Plus, X, FileText } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  description?: string;
  category: string;
  url: string;
  doc_type: string;
  uploaded_by: string;
  created_at: string;
}

type Category = {
  key: string;
  label: string;
  execOnly?: boolean;
};

const CATEGORIES: Category[] = [
  { key: 'constitution', label: 'Constitution & Bylaws' },
  { key: 'minutes', label: 'Meeting Minutes' },
  { key: 'resources', label: 'Member Resources' },
  { key: 'events', label: 'Event Guides' },
  { key: 'general', label: 'General' },
  { key: 'financial', label: 'Financial', execOnly: true },
  { key: 'exec', label: 'Exec Only', execOnly: true },
];

type DocForm = {
  title: string;
  description: string;
  category: string;
  url: string;
  doc_type: 'link' | 'pdf';
};

const blankForm: DocForm = {
  title: '',
  description: '',
  category: 'general',
  url: '',
  doc_type: 'link',
};

export default function Documentation() {
  const { user, token } = useAuth();
  const isPrivileged = user?.role === 'exec' || user?.role === 'admin';

  const visibleCategories = isPrivileged
    ? CATEGORIES
    : CATEGORIES.filter(c => !c.execOnly);

  const [activeTab, setActiveTab] = useState(visibleCategories[0].key);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<DocForm>({ ...blankForm });
  const [busy, setBusy] = useState(false);

  async function apiFetch(path: string, opts?: RequestInit) {
    const res = await fetch(path, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...opts?.headers,
      },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  const load = () => {
    if (!token) return;
    setLoading(true);
    apiFetch('/api/documents')
      .then(setDocs)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  const tabDocs = docs.filter(d => d.category === activeTab);

  const handleAdd = async () => {
    if (!form.title || !form.url) return;
    setBusy(true);
    try {
      await apiFetch('/api/documents', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setShowModal(false);
      setForm({ ...blankForm });
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await apiFetch(`/api/documents/${id}`, { method: 'DELETE' });
      setDocs(prev => prev.filter(d => d.id !== id));
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen size={24} className="text-[#05006C]" />
          <h1 className="text-[#05006C] text-2xl font-bold tracking-widest">DOCUMENTATION</h1>
        </div>
        {isPrivileged && (
          <button
            onClick={() => { setForm({ ...blankForm }); setShowModal(true); }}
            className="bg-[#05006C] text-[#EEEADE] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#0A0080] transition-colors"
          >
            <Plus size={16} /> ADD DOCUMENT
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 rounded-xl p-4 border border-red-200 mb-4">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6 scrollbar-none">
        {visibleCategories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveTab(cat.key)}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === cat.key
                ? 'bg-[#05006C] text-[#EEEADE]'
                : 'text-[#05006C]/60 hover:text-[#05006C]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-[#05006C]/20 border-t-[#05006C] rounded-full animate-spin" />
        </div>
      ) : tabDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText size={32} className="text-[#05006C]/20 mb-3" />
          <p className="text-[#05006C]/50 text-sm">No documents yet</p>
        </div>
      ) : (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {tabDocs.map(doc => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl p-5 border border-[#05006C]/10 shadow-sm flex flex-col gap-2"
            >
              <div className="flex-1">
                <p className="font-bold text-[#05006C] leading-snug">{doc.title}</p>
                {doc.description && (
                  <p className="text-sm text-[#05006C]/60 mt-1 leading-relaxed">{doc.description}</p>
                )}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#05006C]/5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#05006C]/40">
                  {doc.doc_type === 'pdf' ? 'PDF' : 'Link'}
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#05006C]/50 hover:text-[#05006C] transition-colors"
                    title="Open"
                  >
                    <ExternalLink size={15} />
                  </a>
                  {isPrivileged && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showModal && (
          <div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#05006C] font-bold tracking-wider text-sm">ADD DOCUMENT</h3>
                <button
                  onClick={() => setShowModal(false)}
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
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-[#F5F3EE] border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C] min-h-[72px] resize-none focus:outline-none focus:border-[#05006C]/40"
                />
                <input
                  placeholder="URL *"
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  className="w-full bg-[#F5F3EE] border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C] focus:outline-none focus:border-[#05006C]/40"
                />
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full bg-[#F5F3EE] border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-sm text-[#05006C] focus:outline-none"
                >
                  {visibleCategories.map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
                {/* doc_type toggle */}
                <div className="flex gap-2">
                  {(['link', 'pdf'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setForm(f => ({ ...f, doc_type: type }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        form.doc_type === type
                          ? 'bg-[#05006C] text-[#EEEADE] border-[#05006C]'
                          : 'border-[#05006C]/20 text-[#05006C]/60 hover:bg-[#05006C]/5'
                      }`}
                    >
                      {type === 'link' ? 'Link' : 'PDF'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={handleAdd}
                  disabled={busy || !form.title || !form.url}
                  className="flex-1 bg-[#05006C] text-[#EEEADE] py-2.5 rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-[#0A0080] transition-colors"
                >
                  {busy ? 'Saving…' : 'Save Document'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-[#05006C]/20 text-[#05006C]/60 rounded-lg text-sm hover:bg-[#05006C]/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
