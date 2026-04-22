import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * POST /api/public/payhero-callback
 * Receives async STK push results from PayHero.
 * Matches the order via external_reference (stored as payment_ref) and
 * updates payment_status accordingly. Always returns 200 so PayHero
 * does not retry endlessly.
 */

interface PayHeroCallback {
  response?: {
    Status?: string;
    ResultCode?: number;
    ResultDesc?: string;
    ExternalReference?: string;
    MpesaReceiptNumber?: string;
    Amount?: number;
    Phone?: string;
  };
  // Some PayHero variants wrap differently
  status?: string;
  ResultCode?: number;
  ExternalReference?: string;
  MpesaReceiptNumber?: string;
}

export const Route = createFileRoute("/api/public/payhero-callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as PayHeroCallback;
          console.log("[payhero-callback] payload:", JSON.stringify(body));

          const r = body.response ?? {};
          const externalRef = r.ExternalReference ?? body.ExternalReference;
          const resultCode = r.ResultCode ?? body.ResultCode;
          const status = (r.Status ?? body.status ?? "").toString().toLowerCase();
          const receipt = r.MpesaReceiptNumber ?? body.MpesaReceiptNumber ?? null;

          if (!externalRef) {
            return Response.json({ ok: true, note: "no reference" });
          }

          // Match: success when ResultCode === 0 OR status === 'success'
          const isSuccess = resultCode === 0 || status === "success";

          const { data: order } = await supabaseAdmin
            .from("orders")
            .select("id, payment_status")
            .eq("payment_ref", externalRef)
            .maybeSingle();

          if (!order) {
            console.warn("[payhero-callback] no order for ref:", externalRef);
            return Response.json({ ok: true, note: "order not found" });
          }

          if (isSuccess && order.payment_status !== "paid") {
            await supabaseAdmin
              .from("orders")
              .update({
                payment_status: "paid",
                status: "confirmed",
                payment_ref: receipt ?? externalRef,
              })
              .eq("id", order.id);

            // Fire owner notification for paid order (best effort)
            const origin = new URL(request.url).origin;
            void fetch(`${origin}/api/public/notify-order`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: order.id }),
            }).catch(() => {});
          }

          return Response.json({ ok: true });
        } catch (e) {
          console.error("[payhero-callback] error:", e);
          // Always 200 to prevent retry storms
          return Response.json({ ok: false, error: "parse-failed" });
        }
      },
    },
  },
});
