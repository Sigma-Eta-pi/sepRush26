import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/images/sep-logo.png";
import chapterPhoto from "@/images/hero.JPG";
import "./login.css";
type Config = { clientId: string | null; nonce: string; preview: boolean };
type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: any) => void;
      renderButton: (element: HTMLElement, options: any) => void;
    };
  };
};
const googleIdentity = () => {
  const candidate = (window as unknown as { google?: GoogleIdentity }).google;
  return candidate?.accounts?.id ? candidate : undefined;
};
export default function Login() {
  const reduceMotion = useReducedMotion();
  const resumeMcp = () => {
    const next = new URLSearchParams(window.location.search).get("next");
    if (next && /^\/api\/mcp\/consent\?request=[a-f0-9]{64}$/.test(next)) {
      window.location.assign(next);
      return true;
    }
    return false;
  };
  const auth = useAuth(),
    [, navigate] = useLocation(),
    button = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<Config | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [buttonReady, setButtonReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/config")
      .then(r => {
        if (!r.ok) throw new Error("Sign-in is temporarily unavailable.");
        return r.json();
      })
      .then(c => {
        if (!cancelled) setConfig(c);
      })
      .catch(e => setError(e.message));
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!config?.clientId) return;
    let cancelled = false;
    let resizeObserver: ResizeObserver | undefined;
    const scriptError = () => {
      if (!cancelled)
        setError("Google could not load. Check your connection and refresh.");
    };
    const init = () => {
      if (cancelled || !button.current || !googleIdentity()) return;
      googleIdentity()!.accounts.id.initialize({
        client_id: config.clientId,
        nonce: config.nonce,
        auto_select: false,
        callback: async (response: { credential: string }) => {
          setBusy(true);
          setError("");
          try {
            const result = await auth.googleLogin(response.credential);
            if (resumeMcp()) return;
            navigate(
              result.needsOnboarding
                ? "/onboarding"
                : result.role === "pnm"
                  ? "/recruitment"
                  : "/dashboard"
            );
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        },
      });
      let lastWidth = 0;
      const render = () => {
        if (cancelled || !button.current) return;
        const width = Math.min(400, Math.floor(button.current.clientWidth));
        if (!width || width === lastWidth) return;
        lastWidth = width;
        googleIdentity()!.accounts.id.renderButton(button.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width,
        });
        setButtonReady(true);
      };
      render();
      resizeObserver = new ResizeObserver(render);
      resizeObserver.observe(button.current);
    };
    let script = document.querySelector<HTMLScriptElement>(
      "script[data-sep-google]"
    );
    if (googleIdentity()) init();
    else {
      if (!script) {
        script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.dataset.sepGoogle = "true";
        document.head.append(script);
      }
      script.addEventListener("load", init);
      script.addEventListener("error", scriptError);
    }
    return () => {
      cancelled = true;
      script?.removeEventListener("load", init);
      script?.removeEventListener("error", scriptError);
      resizeObserver?.disconnect();
    };
  }, [config]);
  return (
    <main className="sep-login">
      <aside className="sep-login-story" aria-label="Sigma Eta Pi at UCSB">
        <img
          className="sep-login-photo"
          src={chapterPhoto}
          alt="UCSB Sigma Eta Pi members together with the chapter letters"
        />
        <div className="sep-login-photo-shade" />
        <Link href="/" className="sep-login-brand">
          <span className="sep-login-crest">
            <img src={logo} alt="" />
          </span>
          <span>
            Sigma Eta Pi
            <span className="sep-login-brand-subtitle">
              UCSB · Epsilon chapter
            </span>
          </span>
        </Link>
        <div className="sep-login-caption">
          <p>Our people. Our chapter.</p>
          <span>University of California, Santa Barbara</span>
        </div>
      </aside>
      <section className="sep-login-panel" aria-labelledby="login-title">
        <header className="sep-login-header">
          <Link href="/" className="sep-login-back">
            <span aria-hidden="true">←</span> Chapter website
          </Link>
          <span className="sep-login-mobile-brand">ΣΗΠ / UCSB</span>
        </header>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="sep-login-form"
        >
          <p className="sep-login-eyebrow">Member portal</p>
          <h1 id="login-title">Welcome back.</h1>
          <p className="sep-login-intro">Sign in to your chapter.</p>
          <div className="sep-login-action" aria-busy={busy}>
            <div
              ref={button}
              className="sep-login-google"
              aria-label="Google sign-in"
              hidden={busy}
            />
            {busy && (
              <p className="sep-login-loading" role="status">
                Signing you in…
              </p>
            )}
            {!busy &&
              !buttonReady &&
              !error &&
              (!config || config.clientId) && (
                <p
                  className="sep-login-loading sep-login-skeleton"
                  role="status"
                  aria-label="Loading Google sign-in"
                />
              )}
            {config && !config.clientId && !config.preview && (
              <p className="sep-login-notice">
                Sign-in is temporarily unavailable. Please try again later or
                contact the chapter.
              </p>
            )}
            {error && (
              <p role="alert" className="sep-login-error">
                {error}
              </p>
            )}
          </div>
          <p className="sep-login-account-note">
            Use your UCSB Google account.
            <br />
            Chapter executive accounts are also supported.
          </p>
          <div className="sep-login-help">
            Need access?{" "}
            <a href="mailto:exec@ucsbsep.org">
              Contact the chapter <span aria-hidden="true">↗</span>
            </a>
          </div>
          {config?.preview && (
            <div className="sep-login-preview">
              <p>Local demo · Sample activity</p>
              <div>
                {[
                  ["master", "Pledge master"],
                  ["pledge", "Pledge"],
                  ["active", "Active"],
                ].map(([role, label]) => (
                  <button
                    key={role}
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      setError("");
                      try {
                        await auth.previewLogin(role);
                        if (!resumeMcp()) navigate("/dashboard");
                      } catch (e) {
                        setError((e as Error).message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {label} view
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
        <footer className="sep-login-footer">
          <span>Sigma Eta Pi · UCSB</span>
          <Link href="/privacy">Privacy</Link>
        </footer>
      </section>
    </main>
  );
}
