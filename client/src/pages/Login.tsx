import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, Link } from 'wouter';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface LoginForm {
  email: string;
  password: string;
}

function SepLogo() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <g>
        <path
          d="M50 8 L85 22 L85 55 Q85 78 50 92 Q15 78 15 55 L15 22 Z"
          fill="none"
          stroke="#EEEADE"
          strokeWidth="2"
        />
        <path d="M50 45 L20 25 L15 35 L35 50 Z" fill="#EEEADE" opacity="0.95" />
        <path d="M50 45 L80 25 L85 35 L65 50 Z" fill="#EEEADE" opacity="0.95" />
        <ellipse cx="50" cy="58" rx="12" ry="18" fill="#EEEADE" opacity="0.95" />
        <circle cx="50" cy="38" r="8" fill="#EEEADE" />
        <path d="M50 41 L55 44 L50 46 Z" fill="#05006C" />
        <circle cx="53" cy="37" r="1.5" fill="#05006C" />
        <path d="M44 74 L50 82 L56 74" fill="#EEEADE" opacity="0.9" />
        <text
          x="50"
          y="68"
          textAnchor="middle"
          fill="#05006C"
          fontSize="8"
          fontFamily="serif"
          fontWeight="bold"
          opacity="0.9"
        >
          ΣΗΠ
        </text>
      </g>
    </svg>
  );
}

export default function Login() {
  const auth = useAuth();
  const [, navigate] = useLocation();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      setError('');
      await auth.login(data.email, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#05006C] flex items-center justify-center px-4 relative">
      <Link
        href="/"
        className="absolute top-6 left-6 text-[#EEEADE]/60 hover:text-[#EEEADE] text-sm tracking-wider transition-colors"
      >
        &larr; Back to site
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-[#05006C]/80 backdrop-blur border border-[#EEEADE]/20 rounded-2xl p-8"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-[50px] h-[50px] mb-4">
            <SepLogo />
          </div>
          <h1
            className="text-[#EEEADE] font-bold text-xl tracking-widest uppercase"
            style={{ fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
          >
            ACTIVE LOGIN
          </h1>
          <p
            className="text-[#EEEADE]/50 text-xs tracking-widest mt-1 uppercase"
            style={{ fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
          >
            SIGMA ETA PI — EPSILON CHAPTER
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-[#EEEADE]/70 text-xs uppercase tracking-wider mb-1.5 font-medium">
              Email
            </label>
            <input
              type="email"
              {...register('email', { required: true })}
              className="w-full bg-[#05006C]/60 text-[#EEEADE] border border-[#EEEADE]/30 rounded-lg px-4 py-3 text-sm placeholder:text-[#EEEADE]/30 focus:outline-none focus:border-[#EEEADE]/60 transition-colors"
              placeholder="you@ucsb.edu"
            />
          </div>

          <div>
            <label className="block text-[#EEEADE]/70 text-xs uppercase tracking-wider mb-1.5 font-medium">
              Password
            </label>
            <input
              type="password"
              {...register('password', { required: true })}
              className="w-full bg-[#05006C]/60 text-[#EEEADE] border border-[#EEEADE]/30 rounded-lg px-4 py-3 text-sm placeholder:text-[#EEEADE]/30 focus:outline-none focus:border-[#EEEADE]/60 transition-colors"
              placeholder="Enter password"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#EEEADE] text-[#05006C] font-bold rounded-full py-3 text-sm tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
