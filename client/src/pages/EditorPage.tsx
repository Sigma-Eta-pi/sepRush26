import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  Save,
  ExternalLink,
  Send,
  Plus,
  Trash2,
  Bot,
  User,
  Loader2,
  ChevronRight,
  Sparkles,
  Check,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type PageKey = 'home' | 'about' | 'careers' | 'recruitment';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  pendingContent?: Record<string, unknown> | null;
  applied?: boolean;
}

// ─── Default Content ──────────────────────────────────────────────────────────

const DEFAULT_CONTENT: Record<PageKey, Record<string, unknown>> = {
  home: {
    hero: {
      title: 'Sigma Eta Pi',
      subtitle: 'The Premier Entrepreneurship Fraternity at UCSB',
      badge: 'Epsilon Chapter · UCSB',
      cta_primary: 'JOIN OUR ALPHA CLASS',
      cta_primary_href: '/recruitment',
      cta_secondary: 'LEARN MORE',
      cta_secondary_href: '/about',
      bg_image: '',
    },
    stats: [
      { value: 21, suffix: '+', label: 'Ventures Launched', description: 'Across all chapters, members have launched over 21 ventures, including Y Combinator-backed projects and initiatives acquired for $90 million.' },
      { value: 90, suffix: 'M+', label: 'Acquisition Value', description: 'Member-founded ventures have been acquired for over $90 million, demonstrating the real-world impact of our entrepreneurship community.' },
      { value: 350, suffix: '+', label: 'Chapters Nationwide', description: 'Sigma Eta Pi spans hundreds of chapters across the country, offering a powerful network of entrepreneurs, founders, and innovators.' },
    ],
    values: [
      { label: 'Innovation', title: 'Innovation', description: "Believe that embracing innovation is key to shaping the future and driving meaningful change. We challenge the status quo and build what doesn't yet exist.", bg_image: '' },
      { label: 'Brotherhood', title: 'Brotherhood', description: 'Support one another through challenges and triumphs, creating a welcoming and inclusive environment where everyone feels valued. Our bond extends beyond campus.', bg_image: '' },
      { label: 'Leadership', title: 'Leadership', description: 'Fosters personal growth while equipping members to make meaningful impact. We develop the next generation of entrepreneurs, founders, and industry leaders.', bg_image: '' },
    ],
    about_teaser: {
      label: 'About Sigma Eta Pi',
      title: "UCSB's Premier Co-Ed Entrepreneurship Fraternity",
      p1: 'Sigma Eta Pi is a co-ed professional business entrepreneurship fraternity dedicated to cultivating innovative, action-oriented leaders. Our members, representing a diverse range of academic disciplines, engage in a community that emphasizes collaboration, mentorship, and the practical application of entrepreneurial skills.',
      p2: 'Founded in 2010 at UCLA as the first entrepreneurship fraternity on the West Coast, Sigma Eta Pi maintains strong connections to prominent startup ecosystems, including Silicon Valley and Silicon Beach.',
      founded_year: '2026',
      bg_image: '',
    },
    recruitment_cta: {
      label: 'Recruitment',
      title: 'Join Our Founder Class',
      description: "As we relaunch at UCSB, we can't wait to meet our founder class — the leaders, builders, and innovators who will define SEP's future on campus. Step forward, write your next chapter, and be part of something from the very beginning.",
      cta: 'WINTER 2026 APPLICATION',
      bg_image: '',
    },
  },
  about: {
    hero: { title: 'All About Our Chapter', label: 'About Us', bg_image: '' },
    story: {
      label: 'Our Story',
      title: 'Empowering the Next Generation of Entrepreneurs',
      p1: 'Sigma Eta Pi at UCSB is a student-led business entrepreneurship co-ed fraternity that empowers members to take initiative, think big, and turn dreams to realities. Bringing together students from a wide range of majors, our UCSB chapter fosters a supportive community where collaboration, mentorship, and professional growth are central.',
      p2: 'Founded in 2026, Sigma Eta Pi at UCSB provides opportunities to engage with startup ecosystems, connect with experienced entrepreneurs, and gain hands-on experience in business and innovation.',
      p3: 'At UCSB, our events reflect the balance between professionalism and brotherhood. From date parties and retreats to senior send-offs, entrepreneurship panels, and professional workshops, Sigma Eta Pi offers a vibrant and enriching experience for its members, preparing them to succeed academically, professionally, and personally.',
      founded_year: '2010',
      founded_label: 'Founded at UCLA',
      ventures_count: '21+',
      ventures_label: 'Ventures Launched',
      brotherhood_image: '',
    },
    national: {
      label: 'National Organization',
      title: 'A Legacy of Entrepreneurial Excellence',
      p1: 'Sigma Eta Pi is a co-ed professional business entrepreneurship fraternity dedicated to cultivating innovative, action-oriented leaders. Our members, representing a diverse range of academic disciplines, engage in a community that emphasizes collaboration, mentorship, and the practical application of entrepreneurial skills.',
      p2: 'Founded in 2010 at UCLA as the first entrepreneurship fraternity on the West Coast, Sigma Eta Pi maintains strong connections to prominent startup ecosystems, including Silicon Valley and Silicon Beach.',
      p3: "Across its chapters, members have launched over 21 ventures, including projects backed by Y Combinator, ventures acquired for $90 million, and initiatives that hosted the nation's largest hackathon.",
      innovation_image: '',
    },
    values: {
      label: 'Our Values',
      title: 'What We Stand For',
      items: [
        { title: 'Innovation', description: "Believe that embracing innovation is key to shaping the future and driving meaningful change. We challenge the status quo and build what doesn't yet exist." },
        { title: 'Brotherhood', description: 'Support one another through challenges and triumphs, creating a welcoming and inclusive environment where everyone feels valued and empowered.' },
        { title: 'Leadership', description: 'Fosters personal growth while equipping members to make meaningful impact. We develop the next generation of entrepreneurs, founders, and industry leaders.' },
      ],
    },
    cta: {
      title: 'Ready to Be Part of Something?',
      description: 'Join our founder class and help shape the future of entrepreneurship at UCSB.',
      cta_primary: 'APPLY NOW',
      cta_secondary: 'MEET THE TEAM',
    },
  },
  careers: {
    hero: { title: 'Our Careers', bg_image: '' },
    intro: {
      label: 'Where We Go',
      title: 'Sigma Eta Pi Alumni Are Everywhere',
      description: 'Sigma Eta Pi stays actively connected with its alumni, creating lasting professional support in different industries. Our members go on to work at the world\'s most innovative companies, launch their own startups, and make meaningful impact across every sector.',
    },
    resources: [
      { title: 'Alumni Network', description: 'Connect with SEP alumni at top companies across Silicon Valley, Silicon Beach, and beyond.' },
      { title: 'Professional Workshops', description: 'Regular workshops on resume building, interview prep, case studies, and startup pitching.' },
      { title: 'Industry Panels', description: 'Hear directly from founders, VCs, and executives about their career journeys and insights.' },
      { title: 'Recruiting Support', description: 'Access to exclusive job postings, referrals, and recruiting prep from members at top firms.' },
    ],
    cta: {
      title: 'Launch Your Career with SEP',
      description: 'Join a network of entrepreneurs and professionals who support each other throughout their careers.',
    },
  },
  recruitment: {
    hero: { title: 'Rush Sigma Eta Pi', bg_image: '' },
    main: {
      label: 'Spring 2026 Recruitment',
      title: 'Applications Are Open',
      description: "We're looking for driven, curious, and collaborative students who want to build something meaningful. Whether you're a founder, a future consultant, or just someone who wants to grow — SEP is for you.",
      cta: 'APPLY NOW',
    },
    events: [
      { date: 'April 6, 2026', title: 'Brotherhood Night', description: 'Get to know the brothers of Sigma Eta Pi in a relaxed, social setting.' },
      { date: 'April 7, 2026', title: 'Info Night', description: 'Learn everything about Sigma Eta Pi — our mission, events, and what membership looks like.' },
      { date: 'April 8, 2026', title: 'Alumni Panel + Application Workshop', description: 'Hear from SEP alumni at Google, Amazon, Deloitte, and more. Get help with your application.' },
      { date: 'April 9, 2026', title: 'Shark Tank Night', description: 'Pitch your ideas and show us your entrepreneurial spirit.' },
      { date: 'April 9, 2026', title: 'Applications Due', description: 'Submit your application by end of day. Info on @ucsbsep on Instagram.' },
    ],
  },
};

// ─── Section configs ──────────────────────────────────────────────────────────

const PAGE_SECTIONS: Record<PageKey, { key: string; label: string }[]> = {
  home: [
    { key: 'hero', label: 'Hero' },
    { key: 'stats', label: 'Stats' },
    { key: 'values', label: 'Values' },
    { key: 'about_teaser', label: 'About Teaser' },
    { key: 'recruitment_cta', label: 'Recruitment CTA' },
  ],
  about: [
    { key: 'hero', label: 'Hero' },
    { key: 'story', label: 'Our Story' },
    { key: 'national', label: 'National' },
    { key: 'values', label: 'Values' },
    { key: 'cta', label: 'CTA' },
  ],
  careers: [
    { key: 'hero', label: 'Hero' },
    { key: 'intro', label: 'Intro' },
    { key: 'resources', label: 'Resources' },
    { key: 'cta', label: 'CTA' },
  ],
  recruitment: [
    { key: 'hero', label: 'Hero' },
    { key: 'main', label: 'Main' },
    { key: 'events', label: 'Events' },
  ],
};

const PAGE_TABS: { key: PageKey; label: string; path: string }[] = [
  { key: 'home', label: 'Home', path: '/' },
  { key: 'about', label: 'About', path: '/about' },
  { key: 'careers', label: 'Careers', path: '/careers' },
  { key: 'recruitment', label: 'Recruitment', path: '/recruitment' },
];

const STARTER_SUGGESTIONS = [
  'Change the hero title',
  'Update the description',
  'Add a new section item',
  'Make the CTA more compelling',
];

// ─── Field renderer helpers ───────────────────────────────────────────────────

function isArrayOfObjects(val: unknown): val is Record<string, unknown>[] {
  return Array.isArray(val) && val.every((v) => typeof v === 'object' && v !== null);
}

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

// ─── Individual field components ──────────────────────────────────────────────

function TextField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const displayLabel = label.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {displayLabel}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-300 focus:border-[#05006C] focus:outline-none focus:ring-2 focus:ring-[#05006C]/10 resize-none transition-all"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-300 focus:border-[#05006C] focus:outline-none focus:ring-2 focus:ring-[#05006C]/10 transition-all"
        />
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const displayLabel = label.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {displayLabel}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#05006C] focus:outline-none focus:ring-2 focus:ring-[#05006C]/10 transition-all"
      />
    </div>
  );
}

// ─── Image field helpers ──────────────────────────────────────────────────────

const IMAGE_FIELD_KEYS = ['bg_image', 'image_url', 'image'];
function isImageKey(key: string) {
  return IMAGE_FIELD_KEYS.includes(key) || key.endsWith('_image') || key.endsWith('_bg') || key.endsWith('_photo');
}

function ImageField({
  label,
  value,
  token,
  onChange,
}: {
  label: string;
  value: string;
  token: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const displayLabel = label.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/upload/site-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.url) onChange(data.url);
      else toast.error('Upload failed');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{displayLabel}</label>
      <div className="flex items-center gap-2">
        {value ? (
          <div className="relative w-20 h-14 rounded overflow-hidden border border-slate-200 flex-shrink-0">
            <img src={value} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => onChange('')}
              className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-black"
            >×</button>
          </div>
        ) : (
          <div className="w-20 h-14 rounded border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs flex-shrink-0">
            No img
          </div>
        )}
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-3 py-1.5 text-xs font-medium bg-[#05006C] text-white rounded hover:bg-[#03004a] disabled:opacity-50 transition-colors"
        >
          {uploading ? 'Uploading...' : value ? 'Replace' : 'Upload'}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      {value && (
        <p className="text-[10px] text-slate-400 truncate">{value}</p>
      )}
    </div>
  );
}

// ─── Renders an object's fields recursively ───────────────────────────────────

function ObjectFields({
  data,
  token,
  onChange,
}: {
  data: Record<string, unknown>;
  token: string;
  onChange: (updated: Record<string, unknown>) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {Object.entries(data).map(([key, val]) => {
        if (isImageKey(key) && typeof val === 'string') {
          return (
            <div key={key} className="sm:col-span-2">
              <ImageField
                label={key}
                value={val}
                token={token}
                onChange={(url) => onChange({ ...data, [key]: url })}
              />
            </div>
          );
        }
        if (typeof val === 'string') {
          const isLong = val.length > 80 || key.startsWith('p') || key.includes('description') || key.includes('subtitle') || key.includes('paragraph');
          return (
            <div key={key} className={isLong ? 'sm:col-span-2' : ''}>
              <TextField
                label={key}
                value={val}
                onChange={(v) => onChange({ ...data, [key]: v })}
                multiline={isLong}
              />
            </div>
          );
        }
        if (typeof val === 'number') {
          return (
            <NumberField
              key={key}
              label={key}
              value={val}
              onChange={(v) => onChange({ ...data, [key]: v })}
            />
          );
        }
        return null;
      })}
    </div>
  );
}

// ─── Array item card ──────────────────────────────────────────────────────────

function ArrayItemCard({
  index,
  item,
  token,
  onChange,
  onRemove,
}: {
  index: number;
  item: Record<string, unknown>;
  token: string;
  onChange: (updated: Record<string, unknown>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 relative group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Item {index + 1}
        </span>
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
          title="Remove item"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <ObjectFields data={item} token={token} onChange={onChange} />
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  sectionKey,
  label,
  data,
  token,
  onChange,
}: {
  sectionKey: string;
  label: string;
  data: unknown;
  token: string;
  onChange: (updated: unknown) => void;
}) {
  if (isArrayOfObjects(data)) {
    return (
      <div id={`section-${sectionKey}`} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-slate-800">{label}</h3>
          <button
            onClick={() => {
              const template = data[0] ? Object.fromEntries(Object.entries(data[0]).map(([k, v]) => [k, typeof v === 'number' ? 0 : ''])) : {};
              onChange([...data, template]);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-[#05006C]/8 px-3 py-1.5 text-xs font-semibold text-[#05006C] hover:bg-[#05006C]/15 transition-colors"
          >
            <Plus size={13} /> Add Item
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {data.map((item, i) => (
            <ArrayItemCard
              key={i}
              index={i}
              item={item}
              token={token}
              onChange={(updated) => {
                const arr = [...data];
                arr[i] = updated;
                onChange(arr);
              }}
              onRemove={() => onChange(data.filter((_, idx) => idx !== i))}
            />
          ))}
          {data.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">No items yet. Add one above.</p>
          )}
        </div>
      </div>
    );
  }

  if (isObject(data)) {
    return (
      <div id={`section-${sectionKey}`} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800 mb-5">{label}</h3>
        <ObjectFields
          data={data}
          token={token}
          onChange={(updated) => onChange(updated)}
        />
      </div>
    );
  }

  return null;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
          <div className="h-5 w-32 bg-slate-200 rounded mb-5" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="flex flex-col gap-2">
                <div className="h-3 w-20 bg-slate-200 rounded" />
                <div className="h-9 w-full bg-slate-100 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Chat bubble ─────────────────────────────────────────────────────────────

function ChatBubble({
  msg,
  onApply,
}: {
  msg: ChatMessage;
  onApply: (content: Record<string, unknown>) => void;
}) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${isUser ? 'bg-[#05006C]' : 'bg-white border border-slate-200'}`}>
        {isUser ? <User size={13} className="text-[#EEEADE]" /> : <Bot size={13} className="text-[#05006C]" />}
      </div>
      <div className={`max-w-[78%] flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-[#05006C] text-[#EEEADE] rounded-tr-sm'
              : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
          }`}
        >
          {msg.text}
        </div>
        {msg.pendingContent && !msg.applied && (
          <button
            onClick={() => onApply(msg.pendingContent!)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <Check size={12} /> Apply changes
          </button>
        )}
        {msg.applied && (
          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <Check size={11} /> Applied
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main EditorPage ──────────────────────────────────────────────────────────

export default function EditorPage() {
  const { user, token } = useAuth();
  const [, navigate] = useLocation();

  // Auth guard
  useEffect(() => {
    if (user && user.role !== 'editor' && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const [activePage, setActivePage] = useState<PageKey>('home');
  const [content, setContent] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Fetch content on page change
  const fetchContent = useCallback(async (page: PageKey) => {
    setIsLoading(true);
    setHasChanges(false);
    try {
      const res = await fetch(`/api/content/${page}`);
      if (res.ok) {
        const data = await res.json();
        setContent({ ...DEFAULT_CONTENT[page], ...data });
      } else {
        setContent(DEFAULT_CONTENT[page]);
      }
    } catch {
      setContent(DEFAULT_CONTENT[page]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent(activePage);
    setMessages([]);
  }, [activePage, fetchContent]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiThinking]);

  const handleSectionChange = (sectionKey: string, value: unknown) => {
    setContent((prev) => ({ ...prev, [sectionKey]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/content/${activePage}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(content),
      });
      if (res.ok) {
        toast.success('Page saved successfully');
        setHasChanges(false);
        // Bust sessionStorage cache in all open tabs so the live site updates immediately
        localStorage.setItem('sep_content_bust', JSON.stringify({ page: activePage, ts: Date.now() }));
      } else {
        toast.error('Failed to save page');
      }
    } catch {
      toast.error('Network error — changes not saved');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiSend = async (text?: string) => {
    const message = text ?? chatInput.trim();
    if (!message || isAiThinking) return;
    setChatInput('');

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: message };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsAiThinking(true);

    const history = updatedMessages.slice(-10).map((m) => ({ role: m.role, text: m.text }));

    try {
      const res = await fetch('/api/content/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          page: activePage,
          currentContent: content,
          message,
          history: history.slice(0, -1),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          text: data.explanation ?? 'Here are the suggested changes.',
          pendingContent: data.content ?? null,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: 'ai', text: 'Something went wrong. Please try again.' },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'ai', text: 'Network error. Please try again.' },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleApplyAiChanges = (msgId: string, aiContent: Record<string, unknown>) => {
    setContent((prev) => ({ ...prev, ...aiContent }));
    setHasChanges(true);
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, applied: true } : m))
    );
    toast.success('AI changes applied');
  };

  const scrollToSection = (sectionKey: string) => {
    const el = document.getElementById(`section-${sectionKey}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const sections = PAGE_SECTIONS[activePage];

  if (!user) return null;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F5F3EE]">
      {/* ── Top Bar ── */}
      <header className="h-14 bg-[#05006C] flex items-center justify-between px-5 shrink-0 z-10 shadow-lg">
        <div className="flex items-center gap-4">
          {/* Logo mark */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#EEEADE] flex items-center justify-center">
              <span className="text-[#05006C] font-black text-xs">Σ</span>
            </div>
            <span className="text-[#EEEADE] font-semibold text-sm hidden sm:block">Website Editor</span>
          </div>
          {/* Divider */}
          <div className="w-px h-5 bg-white/20" />
          {/* Page tabs */}
          <nav className="flex items-center gap-1">
            {PAGE_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActivePage(tab.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activePage === tab.key
                    ? 'bg-white/15 text-[#EEEADE]'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/8'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            Dashboard
          </button>
          <button
            onClick={() => {
              const path = PAGE_TABS.find((t) => t.key === activePage)?.path ?? '/';
              window.open(path, `sep_preview_${activePage}`);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            <ExternalLink size={13} /> Preview
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              hasChanges
                ? 'bg-[#EEEADE] text-[#05006C] hover:bg-white shadow-sm'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Panel: Section Nav ── */}
        <aside className="w-[220px] bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
          <div className="px-4 pt-5 pb-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sections</p>
          </div>
          <nav className="flex flex-col px-2 pb-4 gap-0.5">
            {sections.map((sec) => (
              <button
                key={sec.key}
                onClick={() => scrollToSection(sec.key)}
                className="flex items-center justify-between w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-[#05006C]/6 hover:text-[#05006C] transition-colors group"
              >
                <span className="font-medium">{sec.label}</span>
                <ChevronRight size={13} className="text-slate-300 group-hover:text-[#05006C]/50 transition-colors" />
              </button>
            ))}
          </nav>

          {/* Unsaved indicator */}
          {hasChanges && (
            <div className="mx-3 mt-auto mb-4 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
              <p className="text-xs font-semibold text-amber-700">Unsaved changes</p>
              <p className="text-[11px] text-amber-600 mt-0.5">Click Save to publish</p>
            </div>
          )}
        </aside>

        {/* ── Center: Content Fields ── */}
        <main className="flex-1 overflow-y-auto bg-[#F5F3EE]">
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="max-w-3xl mx-auto p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-bold text-slate-800 capitalize">{activePage} Page</h2>
                <span className="rounded-full bg-[#05006C]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#05006C]">
                  {sections.length} sections
                </span>
              </div>
              {sections.map((sec) => (
                <SectionCard
                  key={sec.key}
                  sectionKey={sec.key}
                  label={sec.label}
                  data={content[sec.key]}
                  token={token || ''}
                  onChange={(val) => handleSectionChange(sec.key, val)}
                />
              ))}
              <div className="h-8" />
            </div>
          )}
        </main>

        {/* ── Right Panel: AI Chat ── */}
        <aside className="w-[340px] bg-[#F9F8F5] border-l border-slate-200 flex flex-col shrink-0">
          {/* Chat header */}
          <div className="px-5 pt-5 pb-4 border-b border-slate-200 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#05006C] flex items-center justify-center shadow-sm">
                <Sparkles size={15} className="text-[#EEEADE]" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">AI Assistant</p>
                <p className="text-[11px] text-slate-400">Edit content with natural language</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="flex flex-col gap-3 pt-2">
                <p className="text-xs text-slate-400 text-center">Try asking the AI to edit your content</p>
                <div className="flex flex-col gap-2">
                  {STARTER_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleAiSend(s)}
                      className="text-left rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-600 hover:border-[#05006C]/30 hover:bg-[#05006C]/5 hover:text-[#05006C] transition-all shadow-sm"
                    >
                      "{s}"
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                msg={msg}
                onApply={(aiContent) => handleApplyAiChanges(msg.id, aiContent)}
              />
            ))}

            {isAiThinking && (
              <div className="flex gap-2.5">
                <div className="shrink-0 w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                  <Bot size={13} className="text-[#05006C]" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="px-4 pb-4 pt-2 border-t border-slate-200 shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAiSend();
                  }
                }}
                placeholder="Ask AI to edit content…"
                rows={2}
                disabled={isAiThinking}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-[#05006C] focus:outline-none focus:ring-2 focus:ring-[#05006C]/10 resize-none transition-all disabled:opacity-50"
              />
              <button
                onClick={() => handleAiSend()}
                disabled={!chatInput.trim() || isAiThinking}
                className="shrink-0 w-9 h-9 rounded-xl bg-[#05006C] flex items-center justify-center text-[#EEEADE] hover:bg-[#05006C]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {isAiThinking ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">Enter to send · Shift+Enter for newline</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
