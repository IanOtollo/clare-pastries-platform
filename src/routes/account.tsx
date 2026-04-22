import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { UserCircle2, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAuth, signOut } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/account")({
  component: AccountPage,
  head: () => ({ meta: [{ title: "Your Account — Clare Pastries" }] }),
});

function AccountPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ display_name: string | null; phone: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, phone")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-28 grid place-items-center">
          <Loader2 className="h-7 w-7 animate-spin text-[var(--cp-accent)]" />
        </main>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="pt-28 pb-24 container-cp max-w-xl text-center">
          <UserCircle2 className="mx-auto text-[var(--cp-text-muted)]" size={64} />
          <h1 className="mt-5 font-display text-4xl">Your Account</h1>
          <p className="mt-3 text-[var(--cp-text-muted)]">
            Sign in to track orders and reorder favourites — or just keep shopping as a guest.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => navigate({ to: "/login", search: { redirect: "/account", mode: "login" } })}
              className="btn-cta"
            >
              Sign in →
            </button>
            <Link to="/menu" className="px-6 py-3 rounded-lg border border-[var(--cp-border)] hover:bg-[var(--cp-surface-2)]">
              Browse Menu
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-24 container-cp max-w-xl">
        <div className="text-center mb-8">
          <UserCircle2 className="mx-auto text-[var(--cp-accent)]" size={56} />
          <h1 className="mt-4 font-display text-4xl">
            Hi {profile?.display_name ?? user.email?.split("@")[0]}
          </h1>
          <p className="text-[var(--cp-text-muted)] text-sm mt-1">{user.email}</p>
        </div>

        {isAdmin && (
          <Link
            to="/admin"
            className="block bg-[var(--cp-accent)] text-[#1A1410] rounded-2xl p-5 mb-4 hover:scale-[1.01] transition-transform"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck size={24} />
              <div>
                <p className="font-display text-xl">Admin Dashboard</p>
                <p className="text-sm opacity-80">Manage orders, products and more</p>
              </div>
            </div>
          </Link>
        )}

        <div className="bg-[var(--cp-surface)] border border-[var(--cp-border)] rounded-2xl p-6 space-y-3">
          <Link to="/menu" className="block py-2 hover:text-[var(--cp-accent)]">
            Browse menu →
          </Link>
          <Link to="/cart" className="block py-2 hover:text-[var(--cp-accent)]">
            View cart →
          </Link>
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 mt-4 py-3 rounded-lg border border-[var(--cp-border)] hover:bg-[var(--cp-surface-2)]"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}
