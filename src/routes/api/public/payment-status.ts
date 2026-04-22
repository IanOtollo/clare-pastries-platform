import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * GET /api/public/payment-status?orderId=...
 * Lightweight poll endpoint for checkout to show "waiting / paid / failed".
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/public/payment-status")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const orderId = url.searchParams.get("orderId");
        if (!orderId) {
          return Response.json(
            { ok: false, error: "Missing orderId" },
            { status: 400, headers: CORS }
          );
        }

        const { data, error } = await supabaseAdmin
          .from("orders")
          .select("payment_status, status")
          .eq("id", orderId)
          .single();

        if (error || !data) {
          return Response.json(
            { ok: false, error: "Order not found" },
            { status: 404, headers: CORS }
          );
        }

        return Response.json({ ok: true, ...data }, { headers: CORS });
      },
    },
  },
});
