import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * One-time admin bootstrap. Idempotent: safe to call multiple times.
 * Creates clare@admin.co with password clare2026 and assigns super_admin role.
 * Protected by a fixed bootstrap token to prevent abuse.
 */

const BOOTSTRAP_TOKEN = "clare-pastries-bootstrap-2026";
const ADMIN_EMAIL = "clare@admin.co";
const ADMIN_PASSWORD = "clare2026";

export const Route = createFileRoute("/api/public/bootstrap-admin")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get("token") !== BOOTSTRAP_TOKEN) {
          return new Response("Forbidden", { status: 403 });
        }

        try {
          // 1. Check if user already exists
          const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
          let userId = existing?.users.find((u) => u.email === ADMIN_EMAIL)?.id;

          // 2. Create if missing
          if (!userId) {
            const { data: created, error: cerr } = await supabaseAdmin.auth.admin.createUser({
              email: ADMIN_EMAIL,
              password: ADMIN_PASSWORD,
              email_confirm: true,
              user_metadata: { display_name: "Clare" },
            });
            if (cerr) throw cerr;
            userId = created.user.id;
          }

          // 3. Ensure profile exists
          await supabaseAdmin
            .from("profiles")
            .upsert({ user_id: userId, display_name: "Clare" }, { onConflict: "user_id" });

          // 4. Ensure super_admin role
          await supabaseAdmin
            .from("user_roles")
            .upsert({ user_id: userId, role: "super_admin" }, { onConflict: "user_id,role" });

          return Response.json({
            ok: true,
            email: ADMIN_EMAIL,
            userId,
            message: "Admin ready. Login at /login.",
          });
        } catch (e) {
          console.error("[bootstrap-admin] error:", e);
          return Response.json(
            { ok: false, error: e instanceof Error ? e.message : "unknown" },
            { status: 500 }
          );
        }
      },
    },
  },
});
