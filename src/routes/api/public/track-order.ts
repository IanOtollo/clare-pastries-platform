import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Public order tracking — anyone with the order ID can view status.
 * We deliberately omit sensitive fields (email, full address, phone) from the response.
 */
export const Route = createFileRoute("/api/public/track-order")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        try {
          const id = new URL(request.url).searchParams.get("id");
          if (!id || !UUID_RX.test(id)) {
            return new Response(JSON.stringify({ error: "invalid id" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...CORS },
            });
          }

          const { data: order, error } = await supabaseAdmin
            .from("orders")
            .select(
              "id, customer_name, fulfillment, total_kes, subtotal_kes, delivery_fee_kes, status, payment_status, payment_method, created_at"
            )
            .eq("id", id)
            .maybeSingle();

          if (error || !order) {
            return new Response(JSON.stringify({ error: "not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json", ...CORS },
            });
          }

          const { data: items } = await supabaseAdmin
            .from("order_items")
            .select("product_name, quantity, unit_price_kes")
            .eq("order_id", id);

          return new Response(JSON.stringify({ order, items: items ?? [] }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        } catch (e) {
          console.error("[track-order] error:", e);
          return new Response(JSON.stringify({ error: "server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        }
      },
    },
  },
});
