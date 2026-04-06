import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, Link } from 'wouter';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import sepLogo from '@/images/sep-logo.png';

interface LoginForm {
  email: string;
  password: string;
}

export default function Login() {
  const auth = useAuth();
  const [, navigate] = useLocation();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      setError('');
      const result = await auth.login(data.email, data.password);
      if (result.needsOnboarding) {
        navigate('/onboarding');
      } else if (result.role === 'editor') {
        navigate('/editor');
      } else {
        navigate('/dashboard');
      }
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
          <div className="w-[72px] h-[72px] mb-4">
            <img src={sepLogo} alt="Sigma Eta Pi" className="w-full h-full object-contain" style={{ filter: 'brightness(10) contrast(10)', mixBlendMode: 'screen' }} />
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
