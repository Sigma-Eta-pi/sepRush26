import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Loader2, Check, AlertCircle } from "lucide-react";
import sepLogo from "@/images/sep-logo.png";

function getToken() {
  return new URLSearchParams(window.location.search).get("token") || "";
}

export default function ResetPassword() {
  const token = getToken();

  const [validating, setValidating] = useState(true);
  const [email, setEmail] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError("No reset token provided.");
      setValidating(false);
      return;
    }
    fetch(`/api/auth/reset-password/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setEmail(data.email);
        } else {
          setTokenError(data.error || "Invalid or expired link.");
        }
      })
      .catch(() => setTokenError("Failed to validate link."))
      .finally(() => setValidating(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setFormError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to reset password");
        setSubmitting(false);
        return;
      }

      // Auto-login with returned token, force page reload to pick up auth state
      localStorage.setItem("sep_auth_token", data.token);
      localStorage.setItem("sep_auth_user", JSON.stringify(data.user));
      localStorage.setItem("sep_needs_onboarding", "true");
      setDone(true);
      setTimeout(() => {
        window.location.href = "/onboarding";
      }, 1500);
    } catch {
      setFormError("Something went wrong. Try again.");
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full bg-[#05006C]/60 text-[#EEEADE] border border-[#EEEADE]/30 rounded-lg px-4 py-3 text-sm placeholder:text-[#EEEADE]/30 focus:outline-none focus:border-[#EEEADE]/60 transition-colors";

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
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-[#05006C]/80 backdrop-blur border border-[#EEEADE]/20 rounded-2xl p-8"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-[72px] h-[72px] mb-4">
            <img
              src={sepLogo}
              alt="Sigma Eta Pi"
              className="w-full h-full object-contain"
              style={{
                filter: "brightness(10) contrast(10)",
                mixBlendMode: "screen",
              }}
            />
          </div>
          <h1 className="text-[#EEEADE] font-bold text-xl tracking-widest uppercase">
            {done ? "Password Set!" : "Set Your Password"}
          </h1>
          <p className="text-[#EEEADE]/50 text-xs tracking-widest mt-1 uppercase">
            Sigma Eta Pi — Epsilon Chapter
          </p>
        </div>

        {validating && (
          <div className="flex items-center justify-center py-8 text-[#EEEADE]/50">
            <Loader2 className="animate-spin mr-2" size={20} /> Validating
            link...
          </div>
        )}

        {!validating && tokenError && (
          <div className="text-center">
            <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
            <p className="text-red-400 font-medium mb-2">{tokenError}</p>
            <p className="text-[#EEEADE]/40 text-sm mb-6">
              This link may have expired or already been used. Contact your
              admin for a new one.
            </p>
            <Link
              href="/active-login"
              className="text-[#EEEADE]/60 hover:text-[#EEEADE] text-sm underline"
            >
              Back to login
            </Link>
          </div>
        )}

        {!validating && !tokenError && done && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-400" />
            </div>
            <p className="text-[#EEEADE] font-medium">
              Password set successfully!
            </p>
            <p className="text-[#EEEADE]/40 text-sm mt-1">
              Redirecting to profile setup...
            </p>
          </div>
        )}

        {!validating && !tokenError && !done && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {email && (
              <p className="text-[#EEEADE]/60 text-sm text-center -mt-4 mb-2">
                Setting password for{" "}
                <span className="text-[#EEEADE]">{email}</span>
              </p>
            )}
            <div>
              <label className="block text-[#EEEADE]/70 text-xs uppercase tracking-wider mb-1.5 font-medium">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className="block text-[#EEEADE]/70 text-xs uppercase tracking-wider mb-1.5 font-medium">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                className={inputCls}
                required
              />
            </div>
            {formError && (
              <p className="text-red-400 text-sm text-center">{formError}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#EEEADE] text-[#05006C] font-bold rounded-full py-3 text-sm tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Setting...
                </>
              ) : (
                "Set Password"
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
