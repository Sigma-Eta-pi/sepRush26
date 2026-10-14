import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
export default function Onboarding() {
  const { user, markOnboardingComplete, logout } = useAuth(),
    [, navigate] = useLocation();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <main className="min-h-dvh bg-[#203354] text-[#EEEADE] flex items-center justify-center p-5">
      <form
        className="w-full max-w-lg py-12"
        onSubmit={async e => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const body = Object.fromEntries(new FormData(e.currentTarget));
          try {
            const r = await fetch("/api/profiles", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            if (!r.ok)
              throw new Error(
                "Your profile could not be saved. Please try again."
              );
            markOnboardingComplete();
            navigate(
              user?.role === "pnm" ? "/recruitment" : "/dashboard"
            );
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="text-xs tracking-widest uppercase text-[#D0E4EF] mb-3">
          Sigma Eta Pi · UCSB
        </p>
        <h1 className="text-3xl font-semibold mb-3">
          Let the chapter know you.
        </h1>
        <p className="text-[#EEEADE]/75 mb-7">
          Add your name and contact details. You can update your profile
          anytime.
        </p>
        <p className="text-sm text-[#D0E4EF] mb-6">
          Signed in as {user?.email}
        </p>
        <div className="grid gap-5">
          {[
            {
              name: "name",
              label: "Your name",
              required: true,
              type: "text",
              autoComplete: "name",
            },
            {
              name: "phone",
              label: "Phone for coffee-chat texts (optional)",
              type: "tel",
              autoComplete: "tel",
            },
            { name: "major", label: "Major (optional)", type: "text" },
            {
              name: "gradYear",
              label: "Graduation year (optional)",
              type: "text",
            },
          ].map(f => (
            <label key={f.name} className="grid gap-2 text-sm">
              <span>{f.label}</span>
              <input
                name={f.name}
                type={f.type}
                autoComplete={f.autoComplete}
                required={f.required}
                maxLength={f.name === "phone" ? 20 : 100}
                className="w-full rounded-xl px-4 py-3 bg-white text-[#203354] border border-white/30 focus:outline-2 focus:outline-[#D0E4EF]"
              />
            </label>
          ))}
        </div>
        <p className="text-xs text-[#EEEADE]/65 my-5">
          Your phone number is shared only with logged-in chapter members.
        </p>
        {error && (
          <p role="alert" className="text-[#ffc6bb] mb-4">
            {error}
          </p>
        )}
        <button
          disabled={busy}
          className="w-full rounded-xl bg-[#EEEADE] text-[#203354] px-5 py-3 font-semibold disabled:opacity-50"
        >
          {busy ? "Saving…" : "Continue to SEP"}
        </button>
        <button
          type="button"
          className="w-full py-4 text-sm text-[#EEEADE]/70"
          onClick={logout}
        >
          Use a different Google account
        </button>
      </form>
    </main>
  );
}
