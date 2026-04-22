import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "admin" | "customer";

export interface AuthState {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  isAdmin: boolean;
  loading: boolean;
}

/**
 * Single source of truth for auth + roles.
 * Subscribes to onAuthStateChange BEFORE calling getSession (per Supabase best practice).
 */
export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1. Subscribe FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      if (newSession?.user) {
        // Defer role fetch to avoid deadlocks inside the auth callback
        setTimeout(() => fetchRoles(newSession.user.id), 0);
      } else {
        setRoles([]);
      }
    });

    // 2. THEN check existing session
    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      if (!mounted) return;
      setSession(existing);
      if (existing?.user) {
        fetchRoles(existing.user.id).finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    async function fetchRoles(userId: string) {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (!mounted) return;
      if (error) {
        console.warn("[useAuth] role fetch failed:", error.message);
        setRoles([]);
      } else {
        setRoles((data ?? []).map((r) => r.role as AppRole));
      }
      setLoading(false);
    }

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const isAdmin = roles.includes("super_admin") || roles.includes("admin");

  return { session, user: session?.user ?? null, roles, isAdmin, loading };
}

export async function signOut() {
  await supabase.auth.signOut();
}
