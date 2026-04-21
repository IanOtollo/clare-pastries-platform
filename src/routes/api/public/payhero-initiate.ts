import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * POST /api/public/payhero-initiate
 * Body: { orderId: string, phone: string }
 *
 * Triggers an M-Pesa STK push via PayHero for the given order.
 * Records payment_ref on the order so the callback can match it back.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function normalizeKePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return "254" + digits.slice(1);
  if (digits.startsWith("7") && digits.length === 9) return "254" + digits;
  if (digits.startsWith("1") && digits.length === 9) return "254" + digits;
  return null;
}

export const Route = createFileRoute("/api/public/payhero-initiate")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        try {
          const { orderId, phone } = (await request.json()) as {
            orderId?: string;
            phone?: string;
          };

          if (!orderId || !phone) {
            return Response.json(
              { ok: false, error: "Missing orderId or phone" },
              { status: 400, headers: CORS }
            );
          }

          const username = process.env.PAYHERO_API_USERNAME;
          const password = process.env.PAYHERO_API_SECRET;
          const channelId = process.env.PAYHERO_CHANNEL_ID;

          if (!username || !password || !channelId) {
            return Response.json(
              { ok: false, error: "PayHero not configured" },
              { status: 500, headers: CORS }
            );
          }

          // Fetch order
          const { data: order, error: oerr } = await supabaseAdmin
            .from("orders")
            .select("id, total_kes, customer_name, payment_status")
            .eq("id", orderId)
            .single();

          if (oerr || !order) {
            return Response.json(
              { ok: false, error: "Order not found" },
              { status: 404, headers: CORS }
            );
          }

          if (order.payment_status === "paid") {
            return Response.json({ ok: true, alreadyPaid: true }, { headers: CORS });
          }

          const msisdn = normalizeKePhone(phone);
          if (!msisdn) {
            return Response.json(
              { ok: false, error: "Invalid Kenyan phone number" },
              { status: 400, headers: CORS }
            );
          }

          // Build callback URL from request origin
          const origin = new URL(request.url).origin;
          const callbackUrl = `${origin}/api/public/payhero-callback`;

          const externalRef = `CP-${order.id.slice(0, 8).toUpperCase()}-${Date.now()}`;

          const auth = Buffer.from(`${username}:${password}`).toString("base64");

          const payload = {
            amount: order.total_kes,
            phone_number: msisdn,
            channel_id: Number(channelId),
            provider: "m-pesa",
            external_reference: externalRef,
            customer_name: order.customer_name,
            callback_url: callbackUrl,
          };

          const res = await fetch("https://backend.payhero.co.ke/api/v2/payments", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${auth}`,
            },
            body: JSON.stringify(payload),
          });

          const result = await res.json().catch(() => ({}));

          if (!res.ok) {
            console.error("[payhero-initiate] failed:", res.status, result);
            return Response.json(
              { ok: false, error: result?.message || `PayHero error ${res.status}` },
              { status: 502, headers: CORS }
            );
          }

          // Save reference so callback can match it
          await supabaseAdmin
            .from("orders")
            .update({ payment_ref: externalRef })
            .eq("id", order.id);

          return Response.json(
            { ok: true, reference: externalRef, payhero: result },
            { headers: CORS }
          );
        } catch (e) {
          console.error("[payhero-initiate] error:", e);
          return Response.json(
            { ok: false, error: e instanceof Error ? e.message : "unknown" },
            { status: 500, headers: CORS }
          );
        }
      },
    },
  },
});
