import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, GraduationCap, Calendar, Linkedin, Instagram, Phone, Camera, Upload, X, Search, ChevronDown, Check } from 'lucide-react';

interface MemberProfile {
  id: string;
  userId: string;
  name: string;
  photoUrl?: string;
  major?: string;
  gradYear?: number;
  hometown?: string;
  birthday?: string;
  bio?: string;
  linkedin?: string;
  instagram?: string;
  phone?: string;
  pledgeClass?: string;
  createdAt: string;
  updatedAt: string;
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function InitialsAvatar({ name, size = 64 }: { name: string; size?: number }) {
  const fontSize = size < 80 ? 'text-lg' : 'text-3xl';
  return (
    <div
      className={`rounded-full bg-[#05006C] text-[#EEEADE] flex items-center justify-center font-bold ${fontSize} shrink-0`}
      style={{ width: size, height: size }}
    >
      {getInitials(name)}
    </div>
  );
}

// ─── Member Card ───────────────────────────────────────────────────────────────

function MemberCard({ profile, onClick }: { profile: MemberProfile; onClick: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-[#05006C]/10 p-5 cursor-pointer transition-shadow hover:shadow-md"
    >
      <div className="flex items-center gap-4">
        {profile.photoUrl ? (
          <img
            src={profile.photoUrl}
            alt={profile.name}
            className="w-16 h-16 rounded-full object-cover shrink-0"
          />
        ) : (
          <InitialsAvatar name={profile.name} size={64} />
        )}
        <div className="min-w-0">
          <div className="font-bold text-[#05006C] truncate">{profile.name}</div>
          {(profile.major || profile.gradYear) && (
            <div className="text-sm text-[#05006C]/60 flex items-center gap-1.5 mt-0.5">
              <GraduationCap size={14} className="shrink-0" />
              <span className="truncate">
                {profile.major}{profile.major && profile.gradYear ? ' · ' : ''}{profile.gradYear ? `'${String(profile.gradYear).slice(-2)}` : ''}
              </span>
            </div>
          )}
          {profile.hometown && (
            <div className="text-sm text-[#05006C]/50 flex items-center gap-1.5 mt-0.5">
              <MapPin size={14} className="shrink-0" />
              <span className="truncate">{profile.hometown}</span>
            </div>
          )}
        </div>
      </div>
      {profile.pledgeClass && (
        <div className="mt-3">
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#05006C]/8 text-[#05006C]/70 text-xs font-medium tracking-wide">
            {profile.pledgeClass}
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ─── Profile Modal ─────────────────────────────────────────────────────────────

function ProfileModal({ profile, onClose }: { profile: MemberProfile; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.35 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#05006C]/40 hover:text-[#05006C] transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          {profile.photoUrl ? (
            <img src={profile.photoUrl} alt={profile.name} className="w-32 h-32 rounded-full object-cover mb-4" />
          ) : (
            <div className="mb-4">
              <InitialsAvatar name={profile.name} size={128} />
            </div>
          )}
          <h2 className="text-2xl font-bold text-[#05006C]">{profile.name}</h2>
          {profile.pledgeClass && (
            <span className="mt-1 inline-block px-3 py-0.5 rounded-full bg-[#05006C]/8 text-[#05006C]/70 text-xs font-medium tracking-wide">
              {profile.pledgeClass}
            </span>
          )}
        </div>

        <div className="space-y-3 text-sm">
          {profile.major && (
            <div className="flex items-center gap-3 text-[#05006C]/70">
              <GraduationCap size={16} className="text-[#05006C]/40 shrink-0" />
              <span>{profile.major}{profile.gradYear ? ` · Class of ${profile.gradYear}` : ''}</span>
            </div>
          )}
          {!profile.major && profile.gradYear && (
            <div className="flex items-center gap-3 text-[#05006C]/70">
              <GraduationCap size={16} className="text-[#05006C]/40 shrink-0" />
              <span>Class of {profile.gradYear}</span>
            </div>
          )}
          {profile.hometown && (
            <div className="flex items-center gap-3 text-[#05006C]/70">
              <MapPin size={16} className="text-[#05006C]/40 shrink-0" />
              <span>{profile.hometown}</span>
            </div>
          )}
          {profile.birthday && (
            <div className="flex items-center gap-3 text-[#05006C]/70">
              <Calendar size={16} className="text-[#05006C]/40 shrink-0" />
              <span>{profile.birthday}</span>
            </div>
          )}
          {profile.phone && (
            <div className="flex items-center gap-3 text-[#05006C]/70">
              <Phone size={16} className="text-[#05006C]/40 shrink-0" />
              <span>{profile.phone}</span>
            </div>
          )}
          {profile.linkedin && (
            <div className="flex items-center gap-3 text-[#05006C]/70">
              <Linkedin size={16} className="text-[#05006C]/40 shrink-0" />
              <a
                href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#05006C] underline underline-offset-2"
                onClick={e => e.stopPropagation()}
              >
                LinkedIn
              </a>
            </div>
          )}
          {profile.instagram && (
            <div className="flex items-center gap-3 text-[#05006C]/70">
              <Instagram size={16} className="text-[#05006C]/40 shrink-0" />
              <a
                href={`https://instagram.com/${profile.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#05006C] underline underline-offset-2"
                onClick={e => e.stopPropagation()}
              >
                @{profile.instagram.replace('@', '')}
              </a>
            </div>
          )}
        </div>

        {profile.bio && (
          <div className="mt-5 pt-5 border-t border-[#05006C]/10">
            <p className="text-[#05006C]/70 text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Skeleton Cards ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#05006C]/10 p-5 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#05006C]/10 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-[#05006C]/10 rounded w-2/3" />
          <div className="h-3 bg-[#05006C]/8 rounded w-1/2" />
          <div className="h-3 bg-[#05006C]/6 rounded w-1/3" />
        </div>
      </div>
    </div>
  );
}

// ─── Class Dropdown ────────────────────────────────────────────────────────────

function ClassDropdown({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full bg-[#F5F3EE] border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-[#05006C] focus:outline-none focus:border-[#05006C]/40 focus:bg-white transition flex items-center justify-between cursor-pointer"
      >
        <span className={value ? '' : 'text-[#05006C]/40'}>{value || 'Select class...'}</span>
        <ChevronDown size={16} className={`text-[#05006C]/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#05006C]/15 rounded-lg shadow-lg z-20 overflow-hidden">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className="w-full px-4 py-2.5 text-left text-sm text-[#05006C] hover:bg-[#05006C]/5 transition-colors flex items-center justify-between cursor-pointer"
            >
              {opt}
              {value === opt && <Check size={14} className="text-[#05006C]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Profile Editor ────────────────────────────────────────────────────────────


function ProfileEditor({ token, userId }: { token: string; userId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [major, setMajor] = useState('');
  const [gradYear, setGradYear] = useState('');
  const [hometown, setHometown] = useState('');
  const [birthday, setBirthday] = useState('');
  const [bio, setBio] = useState('');
  const [pledgeClass, setPledgeClass] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [instagram, setInstagram] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedinPhoto, setLinkedinPhoto] = useState('');

  useEffect(() => {
    fetch('/api/classes')
      .then(r => r.json())
      .then((data: { id: string; name: string }[]) => setClassOptions(data.map(d => d.name)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/profiles/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const p: MemberProfile = await res.json();
          setName(p.name || '');
          setPhotoUrl(p.photoUrl || '');
          setMajor(p.major || '');
          setGradYear(p.gradYear ? String(p.gradYear) : '');
          setHometown(p.hometown || '');
          setBirthday(p.birthday || '');
          setBio(p.bio || '');
          setPledgeClass(p.pledgeClass || '');
          setLinkedin(p.linkedin || '');
          setInstagram(p.instagram || '');
          setPhone(p.phone || '');
          if (p.linkedin && !p.photoUrl) {
            const match = p.linkedin.match(/linkedin\.com\/in\/([^\/\?#]+)/i);
            if (match) {
              const slug = match[1].replace(/\/$/, '');
              fetch(`/api/proxy/linkedin-photo/${slug}`)
                .then(r => r.json())
                .then(d => { if (d.url) setLinkedinPhoto(d.url); })
                .catch(() => {});
            }
          }
        }
      } catch {
        // no existing profile
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, token]);


  async function handlePhotoUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await fetch('/api/upload/photo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setPhotoUrl(data.url);
    } catch {
      setError('Photo upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    if (!linkedin.trim()) { setError('LinkedIn URL is required'); return; }
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      // If no manually uploaded photo, use LinkedIn photo
      const finalPhotoUrl = photoUrl || linkedinPhoto || undefined;
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: name.trim(),
          photoUrl: finalPhotoUrl,
          major: major.trim() || undefined,
          gradYear: gradYear ? Number(gradYear) : undefined,
          hometown: hometown.trim() || undefined,
          birthday: birthday.trim() || undefined,
          bio: bio.trim() || undefined,
          pledgeClass: pledgeClass || undefined,
          linkedin: linkedin.trim(),
          instagram: instagram.trim() || undefined,
          phone: phone.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 animate-pulse space-y-4">
        <div className="flex justify-center"><div className="w-24 h-24 rounded-full bg-[#05006C]/10" /></div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 bg-[#05006C]/8 rounded w-20" />
            <div className="h-10 bg-[#05006C]/6 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const inputClass = 'w-full bg-[#F5F3EE] border border-[#05006C]/15 rounded-lg px-4 py-2.5 text-[#05006C] focus:outline-none focus:border-[#05006C]/40 focus:bg-white transition';
  const labelClass = 'block text-[#05006C]/70 text-xs tracking-wider uppercase font-medium mb-1';
  const displayPhoto = photoUrl || linkedinPhoto;

  return (
    <form onSubmit={handleSave} className="bg-white rounded-xl p-6 space-y-4">
      {/* Photo */}
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative group cursor-pointer"
        >
          {displayPhoto ? (
            <img src={displayPhoto} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[#05006C]/10 flex items-center justify-center">
              {name ? (
                <span className="text-[#05006C] font-bold text-2xl">{getInitials(name)}</span>
              ) : (
                <Camera size={28} className="text-[#05006C]/30" />
              )}
            </div>
          )}
          <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Upload size={20} className="text-white" />
          </div>
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handlePhotoUpload(file);
          }}
        />
        <span className="text-xs text-[#05006C]/40">
          {linkedinPhoto && !photoUrl ? 'Using LinkedIn photo · Click to upload a different one' : 'Click to upload photo'}
        </span>
      </div>

      {/* Name */}
      <div>
        <label className={labelClass}>Name *</label>
        <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="Full name" required />
      </div>

      {/* LinkedIn — mandatory, top position */}
      <div>
        <label className={labelClass}>LinkedIn URL *</label>
        <div className="relative">
          <Linkedin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#05006C]/40" />
          <input
            className={`${inputClass} pl-10`}
            value={linkedin}
            onChange={e => setLinkedin(e.target.value)}
            placeholder="https://linkedin.com/in/yourname"
            required
          />
        </div>
      </div>

      {/* Class */}
      <div>
        <label className={labelClass}>Class *</label>
        <ClassDropdown value={pledgeClass} onChange={setPledgeClass} options={classOptions} />
      </div>

      {/* Major + Grad Year row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Major</label>
          <input className={inputClass} value={major} onChange={e => setMajor(e.target.value)} placeholder="e.g. Computer Science" />
        </div>
        <div>
          <label className={labelClass}>Grad Year</label>
          <input className={inputClass} type="number" value={gradYear} onChange={e => setGradYear(e.target.value)} placeholder="e.g. 2026" />
        </div>
      </div>

      {/* Hometown + Birthday row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Hometown</label>
          <input className={inputClass} value={hometown} onChange={e => setHometown(e.target.value)} placeholder="e.g. Los Angeles, CA" />
        </div>
        <div>
          <label className={labelClass}>Birthday</label>
          <input className={inputClass} value={birthday} onChange={e => setBirthday(e.target.value)} placeholder="e.g. March 15" />
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className={labelClass}>Bio</label>
        <textarea className={`${inputClass} min-h-[100px] resize-y`} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell everyone about yourself..." />
      </div>

      {/* Instagram + Phone row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Instagram</label>
          <div className="relative">
            <Instagram size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#05006C]/40" />
            <input className={`${inputClass} pl-10`} value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@handle" />
          </div>
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <div className="relative">
            <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#05006C]/40" />
            <input className={`${inputClass} pl-10`} value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" />
          </div>
        </div>
      </div>

      {/* Error / Success */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg px-4 py-2">
          Profile saved successfully!
        </div>
      )}

      {/* Save */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-[#05006C] text-[#EEEADE] px-6 py-2.5 rounded-full font-bold tracking-wider text-sm hover:bg-[#0A0080] transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function MemberProfiles() {
  const { user, token } = useAuth();
  const [tab, setTab] = useState<'members' | 'profile'>('members');
  const [profiles, setProfiles] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [classes, setClasses] = useState<string[]>([]);
  const [selected, setSelected] = useState<MemberProfile | null>(null);

  useEffect(() => {
    fetch('/api/classes')
      .then(r => r.json())
      .then((data: { id: string; name: string }[]) => setClasses(data.map(d => d.name)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch('/api/profiles', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setProfiles(await res.json());
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // Deduplicate — prefer profiles with more data, then dedup by userId then by name
  const score = (p: MemberProfile) => (p.photoUrl ? 2 : 0) + (p.linkedin ? 1 : 0);
  const sorted = profiles.slice().sort((a, b) => score(b) - score(a) || b.updatedAt.localeCompare(a.updatedAt));
  const byUserId = new Map<string, MemberProfile>();
  for (const p of sorted) if (!byUserId.has(p.userId)) byUserId.set(p.userId, p);
  const byName = new Map<string, MemberProfile>();
  for (const p of byUserId.values()) {
    const key = p.name.toLowerCase().trim().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    if (!byName.has(key)) byName.set(key, p);
  }
  const uniqueProfiles = Array.from(byName.values());

  const filtered = uniqueProfiles.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchClass = classFilter === 'All' || p.pledgeClass === classFilter;
    return matchSearch && matchClass;
  });

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-6 border-b border-[#05006C]/10 mb-6">
        <button
          onClick={() => setTab('members')}
          className={`pb-3 text-sm tracking-wider font-medium transition-colors cursor-pointer ${
            tab === 'members'
              ? 'border-b-2 border-[#05006C] text-[#05006C] font-bold'
              : 'text-[#05006C]/50 hover:text-[#05006C]/80'
          }`}
        >
          ALL MEMBERS
        </button>
        <button
          onClick={() => setTab('profile')}
          className={`pb-3 text-sm tracking-wider font-medium transition-colors cursor-pointer ${
            tab === 'profile'
              ? 'border-b-2 border-[#05006C] text-[#05006C] font-bold'
              : 'text-[#05006C]/50 hover:text-[#05006C]/80'
          }`}
        >
          MY PROFILE
        </button>
      </div>

      {/* ALL MEMBERS */}
      {tab === 'members' && (
        <div>
          {/* Search + Class Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#05006C]/30" />
              <input
                type="text"
                placeholder="Search members..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full sm:w-64 bg-white border border-[#05006C]/15 rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#05006C] placeholder:text-[#05006C]/30 focus:outline-none focus:border-[#05006C]/40 transition"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['All', ...classes].map(cls => (
                <button
                  key={cls}
                  onClick={() => setClassFilter(cls)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wide transition-colors cursor-pointer ${
                    classFilter === cls
                      ? 'bg-[#05006C] text-[#EEEADE]'
                      : 'bg-[#05006C]/8 text-[#05006C]/60 hover:bg-[#05006C]/15'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <User size={48} className="mx-auto text-[#05006C]/15 mb-3" />
              <p className="text-[#05006C]/40 text-sm">
                {search ? 'No members match your search' : 'No member profiles yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filtered.map(p => (
                  <MemberCard key={p.id} profile={p} onClick={() => setSelected(p)} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* MY PROFILE */}
      {tab === 'profile' && user && token && (
        <div className="max-w-2xl mx-auto">
          <ProfileEditor token={token} userId={user.id} />
        </div>
      )}

      {/* Profile Modal */}
      <AnimatePresence>
        {selected && (
          <ProfileModal profile={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
