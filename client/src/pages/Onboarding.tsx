import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, User, BookOpen, MapPin, Lock, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import sepLogo from '@/images/sep-logo.png';

function CustomSelect({ value, onChange, options, placeholder, className }: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handle(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);
  const selected = options.find(o => o.value === value);
  return (
    <div ref={ref} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-[#EEEADE] focus:outline-none focus:border-[#EEEADE]/50 text-sm transition-colors flex items-center justify-between"
      >
        <span className={selected ? '' : 'text-[#EEEADE]/30'}>{selected ? selected.label : (placeholder ?? 'Select...')}</span>
        <ChevronDown size={16} className={`text-[#EEEADE]/50 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#05006C] border border-white/20 rounded-xl shadow-xl z-50 overflow-hidden max-h-52 overflow-y-auto">
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between ${
                value === o.value ? 'bg-white/20 text-[#EEEADE]' : 'text-[#EEEADE]/70 hover:bg-white/10 hover:text-[#EEEADE]'
              }`}
            >
              {o.label}
              {value === o.value && <Check size={13} className="text-[#EEEADE]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

async function apiFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options?.headers },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function Onboarding() {
  const { user, token, firstLogin, markOnboardingComplete, markPasswordChanged } = useAuth();
  const [, navigate] = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [direction, setDirection] = useState(1);

  // Steps depend on whether this is a first login (needs password change)
  const STEPS = [
    ...(firstLogin ? [{ id: 'password', label: 'Set Password', icon: Lock }] : []),
    { id: 'welcome', label: 'Welcome', icon: User },
    { id: 'basics', label: 'Your Info', icon: User },
    { id: 'background', label: 'Background', icon: MapPin },
    { id: 'bio', label: 'About You', icon: BookOpen },
  ];

  const [step, setStep] = useState(0);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [linkedinPhoto, setLinkedinPhoto] = useState('');
  const [classOptions, setClassOptions] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/classes')
      .then(r => r.json())
      .then((data: { id: string; name: string }[]) => setClassOptions(data.map(d => d.name)))
      .catch(() => {});
  }, []);
  const [form, setForm] = useState({
    name: '', major: '', gradYear: '', pledgeClass: '',
    hometown: '', birthday: '', bio: '', linkedin: '', instagram: '', phone: '',
  });

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm(f => ({ ...f, [k]: e.target.value }));
      if (k === 'linkedin') {
        const val = e.target.value;
        const match = val.match(/linkedin\.com\/in\/([^\/\?#]+)/i);
        if (match) {
          const slug = match[1].replace(/\/$/, '');
          fetch(`/api/proxy/linkedin-photo/${slug}`)
            .then(r => r.json())
            .then(d => { if (d.url) setLinkedinPhoto(d.url); })
            .catch(() => {});
        } else {
          setLinkedinPhoto('');
        }
      }
    };

  const inputCls = 'w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-[#EEEADE] placeholder:text-[#EEEADE]/30 focus:outline-none focus:border-[#EEEADE]/50 text-sm transition-colors';

  const currentStepId = STEPS[step]?.id;
  const isLast = step === STEPS.length - 1;

  const canNext = () => {
    if (currentStepId === 'password') return newPassword.length >= 8 && newPassword === confirmPassword;
    if (currentStepId === 'basics') return !!form.name.trim();
    return true;
  };

  const handlePasswordStep = async () => {
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setSubmitting(true);
    setError('');
    try {
      await apiFetch('/api/auth/change-password', token!, {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      });
      markPasswordChanged();
      setDirection(1);
      setStep(s => s + 1);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSubmitting(true);
    setError('');
    try {
      await apiFetch('/api/profiles', token!, {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          major: form.major || undefined,
          gradYear: form.gradYear || undefined,
          pledgeClass: form.pledgeClass || undefined,
          hometown: form.hometown || undefined,
          birthday: form.birthday || undefined,
          bio: form.bio || undefined,
          linkedin: form.linkedin || undefined,
          instagram: form.instagram || undefined,
          phone: form.phone || undefined,
          photoUrl: linkedinPhoto || undefined,
        }),
      });
      markOnboardingComplete();
      navigate('/dashboard');
    } catch (e: any) {
      setError(e.message);
      setSubmitting(false);
    }
  };

  const goNext = async () => {
    if (!canNext()) return;
    setError('');
    if (currentStepId === 'password') { await handlePasswordStep(); return; }
    setDirection(1);
    setStep(s => s + 1);
  };

  const goPrev = () => { setError(''); setDirection(-1); setStep(s => s - 1); };

  const gradYears = Array.from({ length: 8 }, (_, i) => String(new Date().getFullYear() + i - 1));

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d < 0 ? 40 : -40, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-[#05006C] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                i < step ? 'bg-[#EEEADE] text-[#05006C]' :
                i === step ? 'bg-white/20 border-2 border-[#EEEADE] text-[#EEEADE]' :
                'bg-white/10 text-[#EEEADE]/30'
              }`}>
                {i < step ? <Check size={14} /> : <s.icon size={14} />}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-6 transition-all ${i < step ? 'bg-[#EEEADE]' : 'bg-white/20'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="p-8"
            >
              {/* PASSWORD STEP */}
              {currentStepId === 'password' && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <Lock size={20} className="text-[#EEEADE]" />
                    <h2 className="text-[#EEEADE] font-bold text-lg tracking-wide">Set Your Password</h2>
                  </div>
                  <p className="text-[#EEEADE]/50 text-sm mb-6">
                    You're using a temporary password. Choose a personal one to secure your account.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[#EEEADE]/60 text-xs uppercase tracking-wider mb-1.5">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className={inputCls}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-[#EEEADE]/60 text-xs uppercase tracking-wider mb-1.5">Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Repeat your password"
                        className={inputCls}
                        onKeyDown={e => e.key === 'Enter' && canNext() && goNext()}
                      />
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-red-400 text-xs">Passwords don't match</p>
                    )}
                    {confirmPassword && newPassword === confirmPassword && newPassword.length >= 8 && (
                      <p className="text-green-400 text-xs">Looks good!</p>
                    )}
                  </div>
                  {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
                </div>
              )}

              {/* WELCOME STEP */}
              {currentStepId === 'welcome' && (
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6">
                    <img src={sepLogo} alt="SEP" className="w-full h-full object-contain" style={{ filter: 'brightness(10) contrast(10)', mixBlendMode: 'screen' }} />
                  </div>
                  <h1 className="text-[#EEEADE] font-bold text-2xl tracking-wide mb-3">Welcome to SEP Epsilon</h1>
                  <p className="text-[#EEEADE]/60 text-sm leading-relaxed mb-2">
                    Hey {user?.email?.split('@')[0]}, let's set up your profile so your brothers can get to know you.
                  </p>
                  <p className="text-[#EEEADE]/40 text-xs">This only takes a minute — you can always update it later.</p>
                </div>
              )}

              {/* BASICS STEP */}
              {currentStepId === 'basics' && (
                <div>
                  <h2 className="text-[#EEEADE] font-bold text-lg tracking-wide mb-6">Your Info</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[#EEEADE]/60 text-xs uppercase tracking-wider mb-1.5">Full Name *</label>
                      <input value={form.name} onChange={set('name')} placeholder="Your full name" className={inputCls} autoFocus />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[#EEEADE]/60 text-xs uppercase tracking-wider mb-1.5">Major</label>
                        <input value={form.major} onChange={set('major')} placeholder="e.g. CS" className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-[#EEEADE]/60 text-xs uppercase tracking-wider mb-1.5">Grad Year</label>
                        <CustomSelect
                          value={form.gradYear}
                          onChange={v => setForm(f => ({ ...f, gradYear: v }))}
                          options={gradYears.map(y => ({ label: y, value: y }))}
                          placeholder="Select..."
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[#EEEADE]/60 text-xs uppercase tracking-wider mb-1.5">Phone</label>
                      <input value={form.phone} onChange={set('phone')} placeholder="(805) 555-0100" className={inputCls} />
                    </div>
                  </div>
                  {!form.name.trim() && <p className="text-red-400 text-xs mt-3">Name is required to continue</p>}
                </div>
              )}

              {/* BACKGROUND STEP */}
              {currentStepId === 'background' && (
                <div>
                  <h2 className="text-[#EEEADE] font-bold text-lg tracking-wide mb-6">Background</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[#EEEADE]/60 text-xs uppercase tracking-wider mb-1.5">Hometown</label>
                      <input value={form.hometown} onChange={set('hometown')} placeholder="City, State" className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-[#EEEADE]/60 text-xs uppercase tracking-wider mb-1.5">Birthday</label>
                      <input type="date" value={form.birthday} onChange={set('birthday')} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-[#EEEADE]/60 text-xs uppercase tracking-wider mb-1.5">Class</label>
                      <CustomSelect
                        value={form.pledgeClass}
                        onChange={v => setForm(f => ({ ...f, pledgeClass: v }))}
                        options={classOptions.map(c => ({ label: c, value: c }))}
                        placeholder="Select class..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* BIO STEP */}
              {currentStepId === 'bio' && (
                <div>
                  <h2 className="text-[#EEEADE] font-bold text-lg tracking-wide mb-6">About You</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[#EEEADE]/60 text-xs uppercase tracking-wider mb-1.5">Bio</label>
                      <textarea value={form.bio} onChange={set('bio')} placeholder="Tell your brothers a bit about yourself..." rows={3} className={`${inputCls} resize-none`} />
                    </div>
                    <div>
                      <label className="block text-[#EEEADE]/60 text-xs uppercase tracking-wider mb-1.5">LinkedIn</label>
                      <div className="flex items-center gap-3">
                        <input value={form.linkedin} onChange={set('linkedin')} placeholder="linkedin.com/in/yourname" className={`${inputCls} flex-1`} />
                        {linkedinPhoto && (
                          <img src={linkedinPhoto} alt="LinkedIn photo" className="w-10 h-10 rounded-full object-cover border-2 border-green-400 shrink-0" />
                        )}
                      </div>
                      {linkedinPhoto && <p className="text-green-400 text-xs mt-1">Profile photo found — will be used on your member card.</p>}
                    </div>
                    <div>
                      <label className="block text-[#EEEADE]/60 text-xs uppercase tracking-wider mb-1.5">Instagram</label>
                      <input value={form.instagram} onChange={set('instagram')} placeholder="@handle" className={inputCls} />
                    </div>
                  </div>
                  {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="px-8 pb-8 flex items-center justify-between">
            {step > 0 && currentStepId !== 'password' ? (
              <button onClick={goPrev} className="flex items-center gap-1.5 text-[#EEEADE]/50 hover:text-[#EEEADE] text-sm transition-colors">
                <ChevronLeft size={16} /> Back
              </button>
            ) : <div />}

            {!isLast ? (
              <button
                onClick={goNext}
                disabled={!canNext() || submitting}
                className="flex items-center gap-1.5 bg-[#EEEADE] text-[#05006C] font-bold px-6 py-2.5 rounded-xl text-sm disabled:opacity-40 hover:bg-white transition-colors"
              >
                {submitting ? 'Saving...' : <>{currentStepId === 'password' ? 'Set Password' : 'Next'} <ChevronRight size={16} /></>}
              </button>
            ) : (
              <button onClick={handleFinish} disabled={submitting}
                className="flex items-center gap-1.5 bg-[#EEEADE] text-[#05006C] font-bold px-6 py-2.5 rounded-xl text-sm disabled:opacity-50 hover:bg-white transition-colors">
                {submitting ? 'Saving...' : <><Check size={16} /> Finish Setup</>}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-[#EEEADE]/30 text-xs mt-4">You can update your profile anytime from the Members section.</p>
      </div>
    </div>
  );
}
