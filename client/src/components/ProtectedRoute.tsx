import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'wouter';

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return (
    <div className="min-h-screen bg-[#05006C] flex items-center justify-center">
      <div className="text-[#EEEADE]">Loading...</div>
    </div>
  );

  if (!isAuthenticated) return <Redirect to="/active-login" />;

  return <>{children}</>;
}
