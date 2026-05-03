import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
};

function getNormalizedEnv(name: string): string | undefined {
  const value = Deno.env.get(name);
  return value
    ?.trim()
    .replace(/^['\"]|['\"]$/g, "")
    .replace(/\s+/g, "") || undefined;
}

async function hmacSha256(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const RAZORPAY_WEBHOOK_SECRET = getNormalizedEnv("RAZORPAY_WEBHOOK_SECRET");
    if (!RAZORPAY_WEBHOOK_SECRET) {
      console.error("RAZORPAY_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: "Webhook not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify webhook signature
    const expectedSignature = await hmacSha256(RAZORPAY_WEBHOOK_SECRET, rawBody);
    if (!secureCompare(expectedSignature, signature)) {
      console.error("Webhook signature verification failed");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || null;

    // Log webhook event
    try {
      await supabaseAdmin.from("payment_logs").insert({
        event_type: `webhook_${event}`,
        razorpay_order_id: paymentEntity?.order_id || null,
        razorpay_payment_id: paymentEntity?.id || null,
        amount: paymentEntity?.amount ? paymentEntity.amount / 100 : null,
        currency: paymentEntity?.currency || "INR",
        metadata: {
          event,
          status: paymentEntity?.status,
          method: paymentEntity?.method,
          error_code: paymentEntity?.error_code,
          error_description: paymentEntity?.error_description,
        },
        ip_address: clientIp,
      });
    } catch (logErr) {
      console.error("Failed to log webhook event:", logErr);
    }

    // Handle specific events
    if (
      (event === "payment.captured" || event === "payment.failed" || event === "order.paid") &&
      paymentEntity
    ) {
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;
      const newPaymentStatus =
        event === "payment.failed" ? "failed" : "paid";

      console.log("[WEBHOOK] event:", event, "razorpay_order_id:", razorpayOrderId, "payment_id:", razorpayPaymentId);

      let matchedOrderId: string | null = null;

      // Strategy A: razorpay_order_id on orders table
      if (razorpayOrderId) {
        const { data } = await supabaseAdmin
          .from("orders")
          .select("id")
          .eq("razorpay_order_id", razorpayOrderId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data) matchedOrderId = data.id;
      }

      // Strategy B: notes.order_id (set by razorpay-order)
      if (!matchedOrderId && paymentEntity?.notes?.order_id) {
        const { data } = await supabaseAdmin
          .from("orders")
          .select("id")
          .eq("id", paymentEntity.notes.order_id)
          .maybeSingle();
        if (data) {
          matchedOrderId = data.id;
          if (razorpayOrderId) {
            await supabaseAdmin
              .from("orders")
              .update({ razorpay_order_id: razorpayOrderId })
              .eq("id", matchedOrderId);
          }
        }
      }

      // Strategy C: payment_logs lookup
      if (!matchedOrderId && razorpayOrderId) {
        const { data } = await supabaseAdmin
          .from("payment_logs")
          .select("order_id, user_id, amount")
          .eq("razorpay_order_id", razorpayOrderId)
          .not("order_id", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data?.order_id) matchedOrderId = data.order_id;
      }

      if (!matchedOrderId) {
        console.error("[WEBHOOK] Could not find order for razorpay_order_id:", razorpayOrderId);
        // Return 200 so Razorpay does not retry forever; we logged it for manual review
        return new Response(JSON.stringify({ status: "order_not_found" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updatePayload: any = { payment_status: newPaymentStatus };
      if (newPaymentStatus === "paid") {
        updatePayload.stripe_payment_id = razorpayPaymentId;
        updatePayload.payment_mode = paymentEntity.method || null;
        if (razorpayOrderId) updatePayload.razorpay_order_id = razorpayOrderId;
      }

      const { error: updateError } = await supabaseAdmin
        .from("orders")
        .update(updatePayload)
        .eq("id", matchedOrderId);

      if (updateError) {
        console.error("[WEBHOOK] Failed to update order:", updateError);
        return new Response(JSON.stringify({ error: "Order update failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log("[WEBHOOK] Updated order", matchedOrderId, "->", newPaymentStatus);
    }

    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
