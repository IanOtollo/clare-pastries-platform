import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function fmtKES(n: number) {
  return "KSh " + n.toLocaleString("en-KE");
}

async function sendCallMeBot(message: string) {
  const phone = process.env.CALLMEBOT_PHONE;
  const apiKey = process.env.CALLMEBOT_API_KEY;
  if (!phone || !apiKey) {
    console.warn("[notify-order] CallMeBot env vars missing — skipping");
    return;
  }
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(
    phone
  )}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apiKey)}`;
  // Fire-and-forget: 8s timeout, never throw
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { method: "GET", signal: ctrl.signal });
    if (!res.ok) console.warn("[notify-order] CallMeBot non-200:", res.status);
  } catch (e) {
    console.warn("[notify-order] CallMeBot error:", e instanceof Error ? e.message : e);
  } finally {
    clearTimeout(t);
  }
}

export const Route = createFileRoute("/api/public/notify-order")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { orderId?: string };
          const orderId = body?.orderId;
          if (!orderId || typeof orderId !== "string") {
            return new Response(JSON.stringify({ ok: false, error: "orderId required" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...CORS },
            });
          }

          const { data: order, error: oerr } = await supabaseAdmin
            .from("orders")
            .select(
              "id, customer_name, customer_phone, fulfillment, address_street, address_town, subtotal_kes, delivery_fee_kes, total_kes, payment_method, payment_status, status, order_notes, created_at"
            )
            .eq("id", orderId)
            .maybeSingle();

          if (oerr || !order) {
            return new Response(JSON.stringify({ ok: false, error: "order not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json", ...CORS },
            });
          }

          const { data: items } = await supabaseAdmin
            .from("order_items")
            .select("product_name, quantity, unit_price_kes")
            .eq("order_id", orderId);

          const lines: string[] = [];
          lines.push("🥐 *NEW ORDER — Clare Pastries*");
          lines.push("");
          lines.push(`Order: #${order.id.slice(0, 8).toUpperCase()}`);
          lines.push(`Customer: ${order.customer_name}`);
          lines.push(`Phone: ${order.customer_phone}`);
          lines.push(
            `Fulfillment: ${order.fulfillment === "delivery" ? "🛵 Delivery" : "🏪 Pickup"}`
          );
          if (order.fulfillment === "delivery") {
            lines.push(`Address: ${order.address_street ?? "—"}, ${order.address_town ?? "—"}`);
          }
          lines.push("");
          lines.push("*Items:*");
          for (const it of items ?? []) {
            lines.push(`• ${it.quantity}× ${it.product_name} — ${fmtKES(it.unit_price_kes * it.quantity)}`);
          }
          lines.push("");
          lines.push(`Subtotal: ${fmtKES(order.subtotal_kes)}`);
          if (order.delivery_fee_kes > 0) lines.push(`Delivery: ${fmtKES(order.delivery_fee_kes)}`);
          lines.push(`*Total: ${fmtKES(order.total_kes)}*`);
          lines.push("");
          lines.push(`Payment: ${(order.payment_method ?? "—").toUpperCase()} — ${order.payment_status.toUpperCase()}`);
          lines.push(`Status: ${order.status.toUpperCase()}`);
          if (order.order_notes) {
            lines.push("");
            lines.push(`Notes: ${order.order_notes}`);
          }

          // Fire-and-forget — don't await failures blocking response
          await sendCallMeBot(lines.join("\n"));

          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        } catch (e) {
          console.error("[notify-order] error:", e);
          // Always return 200 so client never sees a failure on this side-effect
          return new Response(JSON.stringify({ ok: false }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        }
      },
    },
  },
});
