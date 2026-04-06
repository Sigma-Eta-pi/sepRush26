import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type UserRole = 'active' | 'exec' | 'admin' | 'editor';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ needsOnboarding: boolean; role: UserRole }>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  firstLogin: boolean;
  markOnboardingComplete: () => void;
  markPasswordChanged: () => void;
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
  const [firstLogin, setFirstLogin] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('sep_auth_token');
    const savedUser = localStorage.getItem('sep_auth_user');
    const savedOnboarding = localStorage.getItem('sep_needs_onboarding');
    const savedFirstLogin = localStorage.getItem('sep_first_login');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setNeedsOnboarding(savedOnboarding === 'true');
        setFirstLogin(savedFirstLogin === 'true');
      } catch {
        localStorage.removeItem('sep_auth_token');
        localStorage.removeItem('sep_auth_user');
        localStorage.removeItem('sep_needs_onboarding');
        localStorage.removeItem('sep_first_login');
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
    localStorage.setItem('sep_first_login', String(!!data.firstLogin));
    setToken(data.token);
    setUser(data.user);
    setNeedsOnboarding(!!data.needsOnboarding);
    setFirstLogin(!!data.firstLogin);
    return { needsOnboarding: !!data.needsOnboarding, role: data.user.role as UserRole };
  };

  const logout = () => {
    localStorage.removeItem('sep_auth_token');
    localStorage.removeItem('sep_auth_user');
    localStorage.removeItem('sep_needs_onboarding');
    localStorage.removeItem('sep_first_login');
    setToken(null);
    setUser(null);
    setNeedsOnboarding(false);
    setFirstLogin(false);
  };

  const markOnboardingComplete = () => {
    setNeedsOnboarding(false);
    setFirstLogin(false);
    localStorage.setItem('sep_needs_onboarding', 'false');
    localStorage.setItem('sep_first_login', 'false');
  };

  const markPasswordChanged = () => {
    setFirstLogin(false);
    localStorage.setItem('sep_first_login', 'false');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, isAuthenticated: user !== null && token !== null, needsOnboarding, firstLogin, markOnboardingComplete, markPasswordChanged }}>
      {children}
    </AuthContext.Provider>
  );
}
