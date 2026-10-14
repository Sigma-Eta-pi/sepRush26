import { AnimatePresence, motion } from "framer-motion";
import { PortalMotion, SurfaceTransition } from "./components/motion";
import { useLocation } from "wouter";
import { canOpenPage, dashboardPage, dashboardPath } from "./routing";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import ChapterTools from "./ChapterTools";
import { useAuth } from "@/contexts/AuthContext";
import "@fontsource/geist/latin-400.css";
import "@fontsource/geist/latin-500.css";
import "@fontsource/geist/latin-600.css";
import "./styles.css";
import "./motion.css";
import "./navigation.css";
import Navigation from "./components/Navigation";
import ProfileWelcome from "./components/ProfileWelcome";
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircleIcon, CaretDownIcon, XIcon } from "@phosphor-icons/react";
import { AppContext } from "./context";
import { Button, FormDialog } from "./components/ui";
import { api, roleName } from "./lib";
import type { FormSpec, Intent, Page, State } from "./types";
import Today from "./pages/Today";
import Calendar from "./pages/Calendar";
import Coffee from "./pages/Coffee";
import Deliverables from "./pages/Deliverables";
import Accountability from "./pages/Accountability";
import Questions from "./pages/Questions";
import Members from "./pages/Members";
import Settings from "./pages/Settings";
export default function App() {
  const auth = useAuth();
  const [pathname, setLocation] = useLocation();
  const page = dashboardPage(pathname, window.location.hash);
  const [state, setState] = useState<State | null>(null);
  const [form, setForm] = useState<FormSpec | null>(null);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [switching, setSwitching] = useState(false);
  const refreshSequence = useRef(0);
  const intent = useRef<(Intent & { page: Page }) | null>(null);
  const [visit, setVisit] = useState(0);
  const [profileLater, setProfileLater] = useState("");
  const refresh = useCallback(async () => {
    const sequence = ++refreshSequence.current;
    const snapshot = await api<State>("state");
    // A slow poll must never overwrite a newer mutation or role switch.
    if (sequence === refreshSequence.current) setState(snapshot);
  }, []);
  useEffect(() => {
    void refresh().catch(e => setError(e.message));
  }, [refresh]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (pathname === "/dashboard/process" || window.location.hash) {
      setLocation(dashboardPath(page), { replace: true });
    }
  }, [pathname, page, setLocation]);
  useEffect(() => {
    if (!state) return;
    const onFocus = () => {
      if (document.visibilityState === "visible")
        void refresh().catch(() => {});
    };
    window.addEventListener("focus", onFocus);
    const interval = setInterval(onFocus, 30000);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
  }, [!!state, refresh]);
  useEffect(() => {
    if (state && !canOpenPage(state.user.role, page))
      setLocation(dashboardPath("today"), { replace: true });
  }, [state?.user.role, page, setLocation]);
  function navigate(p: Page, target?: Intent) {
    intent.current = target ? { ...target, page: p } : null;
    // A targeted visit remounts the page so it opens on the requested view.
    if (target) setVisit(n => n + 1);
    setLocation(dashboardPath(p));
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  async function act(
    type: string,
    data: Record<string, unknown> = {},
    message = "Saved"
  ) {
    const r = await api<Record<string, unknown>>("actions", { ...data, type });
    try {
      await refresh();
      setToast(message);
    } catch {
      setToast("Your change was saved. Reconnect to refresh the latest view.");
    }
    return r;
  }
  if (error)
    return (
      <div className="sep-portal error-screen">
        <h1>We couldn’t load your chapter.</h1>
        <p>{error}</p>
        <Button
          onClick={() => {
            setError("");
            void refresh().catch(e => setError(e.message));
          }}
        >
          Try again
        </Button>
      </div>
    );
  if (!state) return <DashboardSkeleton />;
  const s = state;
  // Pledges set up their profile first; "later" lasts for this browser tab.
  const laterKey = `sep_profile_later:${s.user.id}`;
  const needsProfile =
    s.user.role === "pledge" &&
    !s.user.profileEdited &&
    profileLater !== s.user.id &&
    sessionStorage.getItem(laterKey) !== "1";
  const pages: Partial<Record<Page, React.ReactNode>> = {
    today: <Today />,
    calendar: <Calendar />,
    coffee: <Coffee />,
    deliverables: <Deliverables />,
    accountability: <Accountability />,
    questions: <Questions />,
    members: <Members />,
    settings: <Settings />,
  };
  return (
    <PortalMotion>
      <div className="sep-portal">
        <AppContext.Provider
          value={{
            state: s,
            page,
            navigate,
            intent: intent.current?.page === page ? intent.current : null,
            act,
            openForm: setForm,
            refresh,
            notify: setToast,
          }}
        >
          <a
            href="#main-content"
            className="skip-link"
            onClick={e => {
              e.preventDefault();
              document.getElementById("main-content")?.focus();
            }}
          >
            Skip to main content
          </a>
          <Navigation
            key={s.user.id}
            onSignOut={() =>
              setForm({
                title: "Sign out of your chapter?",
                description: "Your work is saved. You can return anytime.",
                fields: [],
                submit: "Sign out",
                onSubmit: async () => {
                  auth.logout();
                },
              })
            }
          >
            {s.demo && (
              <div className="demo-bar">
                <div>
                  <span className="demo-dot" />
                  <strong>
                    {s.demoRoster === "chapter"
                      ? "Chapter demo"
                      : "Sample workspace"}
                  </strong>
                  <span className="demo-explanation">
                    Process records are fictional. The chapter directory uses
                    imported member profiles.
                  </span>
                </div>
                <label>
                  <span>Viewing as</span>
                  <select
                    aria-label="Switch demo member"
                    disabled={switching}
                    value={s.user.id}
                    onChange={async e => {
                      refreshSequence.current++;
                      setSwitching(true);
                      try {
                        await auth.previewLogin(e.target.value);
                        setForm(null);
                        navigate("today");
                        await refresh();
                      } catch (err) {
                        setToast((err as Error).message);
                      } finally {
                        setSwitching(false);
                      }
                    }}
                  >
                    {["master", "pledge", "active"].map(role => (
                      <optgroup key={role} label={roleName(role)}>
                        {s.users
                          .filter(u => u.role === role)
                          .map(u => (
                            <option key={u.id} value={u.id}>
                              {u.name} · {roleName(u.role)}
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                  <CaretDownIcon size={12} />
                </label>
              </div>
            )}
            <main
              tabIndex={-1}
              id="main-content"
              key={s.user.id}
              className="main-content"
            >
              <SurfaceTransition
                identity={
                  needsProfile
                    ? `${s.user.id}:welcome`
                    : `${s.user.id}:${page}:${visit}`
                }
              >
                {needsProfile ? (
                  <ProfileWelcome
                    onLater={() => {
                      sessionStorage.setItem(laterKey, "1");
                      setProfileLater(s.user.id);
                    }}
                  />
                ) : !canOpenPage(s.user.role, page) ? (
                  <Today />
                ) : (
                  pages[page] || <ChapterTools />
                )}
              </SurfaceTransition>
            </main>
          </Navigation>
          <AnimatePresence>
            {form && (
              <FormDialog
                key={form.title}
                spec={form}
                onClose={() => setForm(null)}
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {toast && (
              <motion.div
                key={toast}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6 }}
                className="toast"
                role="status"
              >
                <CheckCircleIcon size={21} />
                <span>{toast}</span>
                <button
                  aria-label="Dismiss notification"
                  onClick={() => setToast("")}
                >
                  <XIcon size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </AppContext.Provider>
      </div>
    </PortalMotion>
  );
}
