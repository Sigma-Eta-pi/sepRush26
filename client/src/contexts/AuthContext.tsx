import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
export type UserRole =
  | "active"
  | "exec"
  | "admin"
  | "pnm"
  | "pledge"
  | "pledge_master";
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  is_editor: boolean;
}
export function canEditSite(user: AuthUser | null) {
  return !!user && (["admin", "exec"].includes(user.role) || user.is_editor);
}
interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  googleLogin: (
    credential: string
  ) => Promise<{ needsOnboarding: boolean; role: UserRole }>;
  previewLogin: (role: string) => Promise<void>;
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
  if (!ctx) throw new Error("Auth provider missing");
  return ctx;
}
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null),
    [token, setToken] = useState<string | null>(null),
    [isLoading, setLoading] = useState(true),
    [needsOnboarding, setNeeds] = useState(false);
  const accept = (data: any) => {
    setUser(data.user);
    setToken(data.token);
    setNeeds(!!data.needsOnboarding);
    return {
      needsOnboarding: !!data.needsOnboarding,
      role: data.user.role as UserRole,
    };
  };
  useEffect(() => {
    [
      "sep_auth_token",
      "sep_auth_user",
      "sep_needs_onboarding",
      "sep_first_login",
    ].forEach(k => localStorage.removeItem(k));
    fetch("/api/auth/me")
      .then(async r => {
        if (r.ok) accept(await r.json());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  const send = async (path: string, body: unknown) => {
    const r = await fetch("/api/auth/" + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Unable to sign in.");
    return accept(data);
  };
  const logout = () => {
    fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
      .then(r => {
        if (r.ok) {
          setUser(null);
          setToken(null);
          setNeeds(false);
          window.location.assign("/login");
        } else window.alert("Unable to sign out. Please try again.");
      })
      .catch(() => window.alert("Unable to sign out. Please try again."));
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        needsOnboarding,
        isAuthenticated: !!user && !!token,
        firstLogin: false,
        markOnboardingComplete: () => setNeeds(false),
        markPasswordChanged: () => {},
        googleLogin: credential => send("google", { credential }),
        previewLogin: async role => {
          await send("demo", { role });
        },
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
