import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type UserRole = 'active' | 'exec' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ needsOnboarding: boolean }>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  markOnboardingComplete: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('sep_auth_token');
    const savedUser = localStorage.getItem('sep_auth_user');
    const savedOnboarding = localStorage.getItem('sep_needs_onboarding');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setNeedsOnboarding(savedOnboarding === 'true');
      } catch {
        localStorage.removeItem('sep_auth_token');
        localStorage.removeItem('sep_auth_user');
        localStorage.removeItem('sep_needs_onboarding');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(data.error || 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem('sep_auth_token', data.token);
    localStorage.setItem('sep_auth_user', JSON.stringify(data.user));
    localStorage.setItem('sep_needs_onboarding', String(!!data.needsOnboarding));
    setToken(data.token);
    setUser(data.user);
    setNeedsOnboarding(!!data.needsOnboarding);
    return { needsOnboarding: !!data.needsOnboarding };
  };

  const logout = () => {
    localStorage.removeItem('sep_auth_token');
    localStorage.removeItem('sep_auth_user');
    localStorage.removeItem('sep_needs_onboarding');
    setToken(null);
    setUser(null);
    setNeedsOnboarding(false);
  };

  const markOnboardingComplete = () => {
    setNeedsOnboarding(false);
    localStorage.setItem('sep_needs_onboarding', 'false');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, isAuthenticated: user !== null && token !== null, needsOnboarding, markOnboardingComplete }}>
      {children}
    </AuthContext.Provider>
  );
}
