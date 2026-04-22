import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

/**
 * One-time admin password reset endpoint.
 * Requires a setup token (env: ADMIN_RESET_TOKEN) passed as ?token=...
 * Sets clare@admin.co password to the value passed as ?password=... (min 8 chars).
 *
 * Usage (one time):
 *   GET /api/public/reset-admin-password?token=YOUR_TOKEN&password=NewStrongPass123
 *
 * After use, rotate ADMIN_RESET_TOKEN or delete this file.
 */
export const Route = createFileRoute("/api/public/reset-admin-password")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token");
        const newPassword = url.searchParams.get("password");

        const expectedToken = process.env.ADMIN_RESET_TOKEN;
        if (!expectedToken) {
          return new Response(
            JSON.stringify({ error: "ADMIN_RESET_TOKEN not configured" }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
        if (!token || token !== expectedToken) {
          return new Response(JSON.stringify({ error: "Invalid token" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }
        if (!newPassword || newPassword.length < 5) {
          return new Response(
            JSON.stringify({ error: "password param required (min 5 chars)" }),
            { status: 400, headers: { "content-type": "application/json" } },
          );
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !serviceKey) {
          return new Response(
            JSON.stringify({ error: "Server not configured" }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }

        const admin = createClient(supabaseUrl, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        const ADMIN_EMAIL = "clare@admin.co";

        // Find user by email
        const { data: list, error: listErr } = await admin.auth.admin.listUsers({
          page: 1,
          perPage: 200,
        });
        if (listErr) {
          return new Response(JSON.stringify({ error: listErr.message }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
        const existing = list.users.find((u) => u.email === ADMIN_EMAIL);

        let userId: string;
        if (!existing) {
          // Create the admin user
          const { data: created, error: createErr } =
            await admin.auth.admin.createUser({
              email: ADMIN_EMAIL,
              password: newPassword,
              email_confirm: true,
            });
          if (createErr || !created.user) {
            return new Response(
              JSON.stringify({
                error: createErr?.message ?? "Failed to create user",
              }),
              { status: 500, headers: { "content-type": "application/json" } },
            );
          }
          userId = created.user.id;
        } else {
          // Update password + ensure email confirmed
          const { error: updErr } = await admin.auth.admin.updateUserById(
            existing.id,
            { password: newPassword, email_confirm: true },
          );
          if (updErr) {
            return new Response(JSON.stringify({ error: updErr.message }), {
              status: 500,
              headers: { "content-type": "application/json" },
            });
          }
          userId = existing.id;
        }

        // Ensure super_admin role
        const { error: roleErr } = await admin
          .from("user_roles")
          .upsert(
            { user_id: userId, role: "super_admin" },
            { onConflict: "user_id,role" },
          );
        if (roleErr) {
          return new Response(
            JSON.stringify({
              ok: true,
              warning: `Password set, but role upsert failed: ${roleErr.message}`,
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }

        return new Response(
          JSON.stringify({
            ok: true,
            email: ADMIN_EMAIL,
            message:
              "Admin password set. Sign in, then rotate ADMIN_RESET_TOKEN.",
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      },
    },
  },
});
