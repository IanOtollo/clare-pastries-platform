import { useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Wheat, Eye, EyeOff, Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/",
    mode: search.mode === "signup" ? ("signup" as const) : ("login" as const),
  }),
  head: () => ({
    meta: [
      { title: "Sign In — Clare Pastries" },
      { name: "description", content: "Sign in to your Clare Pastries account or create one to track orders." },
    ],
  }),
});

function LoginPage() {
  const { redirect, mode: initialMode } = useSearch({ from: "/login" });
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
      navigate({ to: redirect });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(humanize(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-20 bg-[var(--cp-bg)]">
        <div className="container-cp max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <Wheat className="h-9 w-9 text-[var(--cp-accent)]" />
            </Link>
            <h1 className="font-display text-4xl mb-2">
              {mode === "signup" ? "Create account" : "Welcome back"}
            </h1>
            <p className="text-[var(--cp-text-muted)] text-sm">
              {mode === "signup"
                ? "Track your orders and reorder favourites."
                : "Sign in to your account or admin panel."}
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="bg-[var(--cp-surface)] border border-[var(--cp-border)] rounded-2xl p-6 md:p-8 space-y-5"
          >
            <Field label="Email">
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="cp-input"
                placeholder="you@example.com"
              />
            </Field>

            <Field label="Password">
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="cp-input pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--cp-text-muted)] hover:text-[var(--cp-text)]"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-cta w-full justify-center disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "signup" ? (
                "Create account →"
              ) : (
                "Sign in →"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError(null);
              }}
              className="block w-full text-center text-sm text-[var(--cp-text-muted)] hover:text-[var(--cp-accent)]"
            >
              {mode === "login"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </motion.form>

          <p className="text-center text-xs text-[var(--cp-text-muted)] mt-6">
            You can checkout as a guest without an account.{" "}
            <Link to="/menu" className="underline hover:text-[var(--cp-accent)]">
              Browse menu →
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider font-mono text-[var(--cp-text-muted)] mb-1.5 block">
        {label}
      </span>
      {children}
    </label>
  );
}

function humanize(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "Wrong email or password.";
  if (msg.includes("already registered")) return "That email is already registered. Try signing in.";
  if (msg.toLowerCase().includes("password") && msg.toLowerCase().includes("weak"))
    return "Password is too weak or has been found in a data breach. Choose a stronger one.";
  if (msg.toLowerCase().includes("rate")) return "Too many attempts. Please try again in a moment.";
  return msg;
}
