import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { orderId, customerName, customerPhone, itemsList, totalKes, fulfillment } =
      await req.json();

    const phone = Deno.env.get("CALLMEBOT_PHONE");
    const apikey = Deno.env.get("CALLMEBOT_API_KEY");

    if (!phone || !apikey) {
      return new Response(
        JSON.stringify({ error: "CallMeBot env variables not set" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const message = encodeURIComponent(
      `🧁 New Order!\nID: ${String(orderId).slice(0, 8)}\nCustomer: ${customerName}\nPhone: ${customerPhone}\nItems: ${itemsList}\nTotal: KES ${totalKes}\nType: ${fulfillment}`
    );

    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${message}&apikey=${apikey}`;

    const response = await fetch(url);
    const text = await response.text();

    return new Response(
      JSON.stringify({ success: true, callmebotResponse: text }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
