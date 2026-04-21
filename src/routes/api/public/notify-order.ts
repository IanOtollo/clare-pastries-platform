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

/** Normalize a Kenyan/UG phone to international digits (no +). */
function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  if (digits.startsWith("254") || digits.startsWith("256")) return digits;
  if (digits.startsWith("0") && digits.length === 10) return "254" + digits.slice(1);
  if (digits.length === 9) return "254" + digits;
  return digits;
}

/**
 * Send a WhatsApp message via CallMeBot.
 * - `apiKey` is per-recipient: each WhatsApp number must register with @CallMeBot
 *   first to receive an apikey. Without it, the message will not be delivered.
 * - Fire-and-forget: 8s timeout, never throws.
 */
async function sendCallMeBot(toPhone: string, apiKey: string, message: string, label: string) {
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(
    toPhone
  )}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apiKey)}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { method: "GET", signal: ctrl.signal });
    if (!res.ok) {
      console.warn(`[notify-order:${label}] CallMeBot non-200:`, res.status);
      return false;
    }
    return true;
  } catch (e) {
    console.warn(`[notify-order:${label}] CallMeBot error:`, e instanceof Error ? e.message : e);
    return false;
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

          const shortId = order.id.slice(0, 8).toUpperCase();
          const itemLines = (items ?? []).map(
            (it) => `• ${it.quantity}× ${it.product_name} — ${fmtKES(it.unit_price_kes * it.quantity)}`
          );

          // ---------- Owner (Clare) message ----------
          const ownerLines = [
            "🥐 *NEW ORDER — Clare Pastries*",
            "",
            `Order: #${shortId}`,
            `Customer: ${order.customer_name}`,
            `Phone: ${order.customer_phone}`,
            `Fulfillment: ${order.fulfillment === "delivery" ? "🛵 Delivery" : "🏪 Pickup"}`,
          ];
          if (order.fulfillment === "delivery") {
            ownerLines.push(`Address: ${order.address_street ?? "—"}, ${order.address_town ?? "—"}`);
          }
          ownerLines.push("", "*Items:*", ...itemLines, "");
          ownerLines.push(`Subtotal: ${fmtKES(order.subtotal_kes)}`);
          if (order.delivery_fee_kes > 0) ownerLines.push(`Delivery: ${fmtKES(order.delivery_fee_kes)}`);
          ownerLines.push(`*Total: ${fmtKES(order.total_kes)}*`, "");
          ownerLines.push(
            `Payment: ${(order.payment_method ?? "—").toUpperCase()} — ${order.payment_status.toUpperCase()}`
          );
          ownerLines.push(`Status: ${order.status.toUpperCase()}`);
          if (order.order_notes) ownerLines.push("", `Notes: ${order.order_notes}`);

          // ---------- Customer message ----------
          const customerLines = [
            `Hi ${order.customer_name.split(" ")[0]}, thank you for ordering from *Clare Pastries* 🥐`,
            "",
            `Your order *#${shortId}* has been received.`,
            "",
            "*Items:*",
            ...itemLines,
            "",
            `Subtotal: ${fmtKES(order.subtotal_kes)}`,
          ];
          if (order.delivery_fee_kes > 0) customerLines.push(`Delivery: ${fmtKES(order.delivery_fee_kes)}`);
          customerLines.push(`*Total: ${fmtKES(order.total_kes)}*`, "");
          customerLines.push(
            `Payment: ${(order.payment_method ?? "—").toUpperCase()} — ${order.payment_status.toUpperCase()}`
          );
          customerLines.push(
            order.fulfillment === "delivery"
              ? "🛵 We'll prepare your order and deliver it shortly."
              : "🏪 We'll prepare your order for pickup at our shop."
          );
          customerLines.push(
            "",
            "Track your order anytime — reply to this message or call +254 714 399 302."
          );

          // ---------- Send (fire-and-forget, never blocks) ----------
          const ownerPhone = process.env.CALLMEBOT_PHONE;
          const ownerKey = process.env.CALLMEBOT_API_KEY;
          const customerPhone = normalizePhone(order.customer_phone);

          const tasks: Promise<unknown>[] = [];

          if (ownerPhone && ownerKey) {
            tasks.push(sendCallMeBot(ownerPhone, ownerKey, ownerLines.join("\n"), "owner"));
          } else {
            console.warn("[notify-order] CALLMEBOT_PHONE/API_KEY missing — owner not notified");
          }

          // CallMeBot requires the recipient to have pre-registered and obtained
          // their OWN apikey. We attempt to use CALLMEBOT_CUSTOMER_API_KEY if a
          // shared/registered customer key exists; otherwise we log and skip.
          // For real customer-facing WhatsApp, swap this for Twilio/WABA.
          const customerKey = process.env.CALLMEBOT_CUSTOMER_API_KEY;
          if (customerPhone && customerKey) {
            tasks.push(sendCallMeBot(customerPhone, customerKey, customerLines.join("\n"), "customer"));
          } else {
            console.info(
              "[notify-order:customer] skipped — CALLMEBOT_CUSTOMER_API_KEY not set or invalid phone. " +
                "CallMeBot only delivers to numbers that have pre-registered with the bot."
            );
          }

          await Promise.allSettled(tasks);

          return new Response(JSON.stringify({ ok: true, orderId: order.id }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        } catch (e) {
          console.error("[notify-order] error:", e);
          // Always return 200 so checkout never sees a failure on this side-effect
          return new Response(JSON.stringify({ ok: false }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        }
      },
    },
  },
});
