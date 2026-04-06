import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'wouter';

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { isAuthenticated, isLoading, needsOnboarding } = useAuth();

  if (isLoading) return (
    <div className="min-h-screen bg-[#05006C] flex items-center justify-center">
      <div className="text-[#EEEADE]">Loading...</div>
    </div>
  );

  if (!isAuthenticated) return <Redirect to="/active-login" />;

  // If on /onboarding, let it through regardless
  if (typeof window !== 'undefined' && window.location.pathname === '/onboarding') {
    return <>{children}</>;
  }

  // Redirect to onboarding if profile not set up (unless already going there)
  if (needsOnboarding) return <Redirect to="/onboarding" />;

  return <>{children}</>;
}
