import { type FormEvent, useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Wheat } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Reset Password — Clare Pastries" },
      {
        name: "description",
        content: "Reset your Clare Pastries account password securely.",
      },
    ],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"request" | "update">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const syncRecoveryMode = () => {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      if (params.get("type") === "recovery" && mounted) {
        setMode("update");
        setError(null);
        setMessage(null);
      }
    };

    syncRecoveryMode();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY") {
        setMode("update");
        setError(null);
        setMessage(null);
      }
    });

    window.addEventListener("hashchange", syncRecoveryMode);

    return () => {
      mounted = false;
      window.removeEventListener("hashchange", syncRecoveryMode);
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleRequestReset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setLoading(false);
      setError("Enter your email address.");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setMessage("Check your email for the password reset link.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(humanize(msg));
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (password.length < 6) {
      setLoading(false);
      setError("Use at least 6 characters for your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setLoading(false);
      setError("Passwords do not match.");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage("Password updated. Redirecting you to sign in...");
      window.setTimeout(() => {
        navigate({ to: "/login", search: { mode: "login", redirect: "/account" } });
      }, 1200);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(humanize(msg));
    } finally {
      setLoading(false);
    }
  }

  const isUpdateMode = mode === "update";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--cp-bg)] pt-28 pb-20">
        <div className="container-cp max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <Link to="/" className="mb-6 inline-flex items-center gap-2">
              <Wheat className="h-9 w-9 text-[var(--cp-accent)]" />
            </Link>
            <h1 className="font-display text-4xl mb-2">
              {isUpdateMode ? "Choose a new password" : "Reset password"}
            </h1>
            <p className="text-[var(--cp-text-muted)] text-sm">
              {isUpdateMode
                ? "Set a new password for your account."
                : "We’ll email you a secure link to reset your password."}
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={isUpdateMode ? handleUpdatePassword : handleRequestReset}
            className="space-y-5 rounded-2xl border border-[var(--cp-border)] bg-[var(--cp-surface)] p-6 md:p-8"
          >
            {!isUpdateMode ? (
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
            ) : (
              <>
                <Field label="New password">
                  <PasswordField
                    value={password}
                    onChange={setPassword}
                    show={showPassword}
                    onToggle={() => setShowPassword((v) => !v)}
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                  />
                </Field>

                <Field label="Confirm password">
                  <PasswordField
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    show={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword((v) => !v)}
                    autoComplete="new-password"
                    placeholder="Repeat your new password"
                  />
                </Field>
              </>
            )}

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-bg)] px-3 py-2 text-sm text-[var(--cp-text)]">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-cta w-full justify-center disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isUpdateMode ? (
                "Save new password →"
              ) : (
                "Send reset link →"
              )}
            </button>

            <Link
              to="/login"
              search={{ mode: "login", redirect: "/account" }}
              className="block w-full text-center text-sm text-[var(--cp-text-muted)] hover:text-[var(--cp-accent)]"
            >
              Back to sign in
            </Link>
          </motion.form>
        </div>
      </main>
      <Footer />
    </>
  );
}

function PasswordField({
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete: string;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        required
        minLength={6}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cp-input pr-12"
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--cp-text-muted)] hover:text-[var(--cp-text)]"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-[var(--cp-text-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function humanize(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "Wrong email or password.";
  if (msg.includes("For security purposes")) return "Please wait a moment before trying again.";
  if (msg.toLowerCase().includes("password") && msg.toLowerCase().includes("weak")) {
    return "Choose a stronger password with at least 6 characters.";
  }
  return msg;
}
