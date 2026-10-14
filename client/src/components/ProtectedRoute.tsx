import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'wouter';
import DashboardSkeleton, { PlainSkeleton } from './DashboardSkeleton';

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { isAuthenticated, isLoading, needsOnboarding } = useAuth();

  // Match the destination so the placeholder doesn't change shape when it loads.
  if (isLoading)
    return typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard')
      ? <DashboardSkeleton />
      : <PlainSkeleton />;

  if (!isAuthenticated) return <Redirect to="/login" />;

  // If on /onboarding, let it through regardless
  if (typeof window !== 'undefined' && window.location.pathname === '/onboarding') {
    return <>{children}</>;
  }

  // Redirect to onboarding if profile not set up (unless already going there)
  if (needsOnboarding) return <Redirect to="/onboarding" />;

  return <>{children}</>;
}
