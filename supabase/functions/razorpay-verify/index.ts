import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ error: "Missing payment details", verified: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    if (!RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay key secret not configured");
    }

    // Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = await hmacSha256(RAZORPAY_KEY_SECRET, body);
    const isValid = expectedSignature === razorpay_signature;

    let paymentMode: string | null = null;

    if (isValid && order_id) {
      // Fetch payment details from Razorpay to get the method
      if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
        try {
          const paymentRes = await fetch(
            `https://api.razorpay.com/v1/payments/${razorpay_payment_id}`,
            {
              headers: {
                Authorization: "Basic " + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
              },
            }
          );
          if (paymentRes.ok) {
            const paymentData = await paymentRes.json();
            // method can be: card, upi, netbanking, wallet, emi, bank_transfer
            paymentMode = paymentData.method || null;
          }
        } catch (e) {
          console.error("Failed to fetch payment method:", e);
        }
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          stripe_payment_id: razorpay_payment_id,
          payment_mode: paymentMode,
        })
        .eq("id", order_id);
    }

    return new Response(
      JSON.stringify({ verified: isValid, payment_mode: paymentMode }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Verification error:", err);
    return new Response(
      JSON.stringify({ error: err.message, verified: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
