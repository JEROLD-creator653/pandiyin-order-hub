import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { cart_items, delivery_state, currency = "INR", receipt, notes } = await req.json();

    // Validate inputs
    if (!cart_items || !Array.isArray(cart_items) || cart_items.length === 0) {
      return new Response(JSON.stringify({ error: "Cart is empty" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!delivery_state || typeof delivery_state !== "string") {
      return new Response(JSON.stringify({ error: "Delivery state is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-side price calculation — never trust client amount
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const productIds = cart_items.map((i: any) => i.product_id);
    const { data: products, error: prodErr } = await adminClient
      .from("products")
      .select("id, price, stock_quantity, is_available, weight_kg, name")
      .in("id", productIds);

    if (prodErr || !products) {
      return new Response(JSON.stringify({ error: "Failed to fetch products" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const productMap = new Map(products.map((p: any) => [p.id, p]));
    let subtotal = 0;
    let totalWeightKg = 0;

    for (const item of cart_items) {
      const product = productMap.get(item.product_id);
      if (!product) {
        return new Response(JSON.stringify({ error: `Product not found: ${item.product_id}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!product.is_available) {
        return new Response(JSON.stringify({ error: `${product.name} is no longer available` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (item.quantity > product.stock_quantity) {
        return new Response(JSON.stringify({ error: `${product.name}: only ${product.stock_quantity} in stock` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      subtotal += Number(product.price) * item.quantity;
      totalWeightKg += (Number(product.weight_kg) || 0) * item.quantity;
    }

    // Calculate delivery charge server-side
    const STATE_ZONES: Record<string, string> = {};
    ["Tamil Nadu", "Puducherry", "Pondicherry"].forEach((s) => (STATE_ZONES[s] = "local"));
    ["Kerala", "Karnataka", "Andhra Pradesh", "Telangana"].forEach((s) => (STATE_ZONES[s] = "nearby"));

    const zone = STATE_ZONES[delivery_state.trim()] || "rest_of_india";
    const chargedWeight = totalWeightKg > 0 ? Math.ceil(totalWeightKg) : 0;

    const { data: regions } = await adminClient
      .from("shipping_regions")
      .select("*")
      .eq("is_enabled", true);

    let perKgRate = 150;
    let freeAbove: number | null = null;

    if (regions) {
      const regionMatch = regions.find((r: any) => r.region_key === zone);
      if (regionMatch) {
        perKgRate = Number(regionMatch.per_kg_rate) || perKgRate;
        freeAbove = regionMatch.free_delivery_above ? Number(regionMatch.free_delivery_above) : null;
      }
    }

    let deliveryCharge = 0;
    if (chargedWeight > 0 && !(freeAbove !== null && subtotal >= freeAbove)) {
      deliveryCharge = chargedWeight * perKgRate;
    }

    const serverTotal = subtotal + deliveryCharge;

    if (serverTotal <= 0) {
      return new Response(JSON.stringify({ error: "Invalid order total" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Razorpay order with server-calculated amount
    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID") || "rzp_test_SOl9lqqJlvN9Ln";
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay key secret not configured");
    }

    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: Math.round(serverTotal * 100), // paise
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        notes: { user_id: userId, ...(notes || {}) },
      }),
    });

    const razorpayOrder = await razorpayRes.json();

    if (!razorpayRes.ok) {
      console.error("Razorpay error:", razorpayOrder);
      return new Response(
        JSON.stringify({ error: razorpayOrder.error?.description || "Failed to create order" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({
      ...razorpayOrder,
      server_total: serverTotal,
      server_subtotal: subtotal,
      server_delivery_charge: deliveryCharge,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
