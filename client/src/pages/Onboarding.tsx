import { useState } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, User, BookOpen, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import sepLogo from '@/images/sep-logo.png';

const STEPS = [
  { id: 'welcome', label: 'Welcome', icon: User },
  { id: 'basics', label: 'Your Info', icon: User },
  { id: 'background', label: 'Background', icon: MapPin },
  { id: 'bio', label: 'About You', icon: BookOpen },
];

async function apiFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options?.headers },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function Onboarding() {
  const { user, token, markOnboardingComplete } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    major: '',
    gradYear: '',
    pledgeClass: '',
    hometown: '',
    birthday: '',
    bio: '',
    linkedin: '',
    instagram: '',
    phone: '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const inputCls = 'w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-[#EEEADE] placeholder:text-[#EEEADE]/30 focus:outline-none focus:border-[#EEEADE]/50 text-sm transition-colors';

  const handleFinish = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSubmitting(true);
    setError('');
    try {
      await apiFetch('/api/profiles/me', token!, {
        method: 'PUT',
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
        }),
      });
      markOnboardingComplete();
      navigate('/dashboard');
    } catch (e: any) {
      setError(e.message);
      setSubmitting(false);
    }
  };

  const canNext = () => {
    if (step === 1 && !form.name.trim()) return false;
    return true;
  };

  const currentYear = new Date().getFullYear();
  const gradYears = Array.from({ length: 8 }, (_, i) => String(currentYear + i - 1));

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 40 : -40, opacity: 0 }),
  };
  const [direction, setDirection] = useState(1);

  const goNext = () => { if (!canNext()) return; setDirection(1); setStep(s => s + 1); };
  const goPrev = () => { setDirection(-1); setStep(s => s - 1); };

  return (
    <div className="min-h-screen bg-[#05006C] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
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
                <div className={`h-px w-8 transition-all ${i < step ? 'bg-[#EEEADE]' : 'bg-white/20'}`} />
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
              {step === 0 && (
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6">
                    <img src={sepLogo} alt="SEP" className="w-full h-full object-contain" style={{ filter: 'brightness(10) contrast(10)', mixBlendMode: 'screen' }} />
                  </div>
                  <h1 className="text-[#EEEADE] font-bold text-2xl tracking-wide mb-3">
                    Welcome to SEP Epsilon
                  </h1>
                  <p className="text-[#EEEADE]/60 text-sm leading-relaxed mb-2">
                    Hey {user?.email?.split('@')[0]}, let's set up your profile so your brothers can get to know you.
                  </p>
                  <p className="text-[#EEEADE]/40 text-xs">This only takes a minute — you can always update it later.</p>
                </div>
              )}

              {step === 1 && (
                <div>
                  <h2 className="text-[#EEEADE] font-bold text-lg tracking-wide mb-6">Your Info</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[#EEEADE]/60 text-xs uppercase tracking-wider mb-1.5">Full Name *</label>
                      <input value={form.name} onChange={set('name')} placeholder="Your full name" className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[#EEEADE]/60 text-xs uppercase tracking-wider mb-1.5">Major</label>
                        <input value={form.major} onChange={set('major')} placeholder="e.g. CS" className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-[#EEEADE]/60 text-xs uppercase tracking-wider mb-1.5">Grad Year</label>
                        <select value={form.gradYear} onChange={set('gradYear')} className={inputCls}>
                          <option value="">Select...</option>
                          {gradYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
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

              {step === 2 && (
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
                      <label className="block text-[#EEEADE]/60 text-xs uppercase tracking-wider mb-1.5">Pledge Class</label>
                      <input value={form.pledgeClass} onChange={set('pledgeClass')} placeholder="e.g. Alpha Class" className={inputCls} />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="text-[#EEEADE] font-bold text-lg tracking-wide mb-6">About You</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[#EEEADE]/60 text-xs uppercase tracking-wider mb-1.5">Bio</label>
                      <textarea
                        value={form.bio}
                        onChange={set('bio')}
                        placeholder="Tell your brothers a bit about yourself..."
                        rows={3}
                        className={`${inputCls} resize-none`}
                      />
                    </div>
                    <div>
                      <label className="block text-[#EEEADE]/60 text-xs uppercase tracking-wider mb-1.5">LinkedIn</label>
                      <input value={form.linkedin} onChange={set('linkedin')} placeholder="linkedin.com/in/..." className={inputCls} />
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
            {step > 0 ? (
              <button onClick={goPrev} className="flex items-center gap-1.5 text-[#EEEADE]/50 hover:text-[#EEEADE] text-sm transition-colors">
                <ChevronLeft size={16} /> Back
              </button>
            ) : <div />}

            {step < STEPS.length - 1 ? (
              <button
                onClick={goNext}
                disabled={!canNext()}
                className="flex items-center gap-1.5 bg-[#EEEADE] text-[#05006C] font-bold px-6 py-2.5 rounded-xl text-sm disabled:opacity-40 hover:bg-white transition-colors"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={submitting}
                className="flex items-center gap-1.5 bg-[#EEEADE] text-[#05006C] font-bold px-6 py-2.5 rounded-xl text-sm disabled:opacity-50 hover:bg-white transition-colors"
              >
                {submitting ? 'Saving...' : <><Check size={16} /> Finish Setup</>}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-[#EEEADE]/30 text-xs mt-4">
          You can update your profile anytime from the Members section.
        </p>
      </div>
    </div>
  );
}
