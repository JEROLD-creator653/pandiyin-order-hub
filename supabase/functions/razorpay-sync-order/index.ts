import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getNormalizedEnv(name: string): string | undefined {
  const value = Deno.env.get(name);
  return value
    ?.trim()
    .replace(/^['\"]|['\"]$/g, "")
    .replace(/\s+/g, "") || undefined;
}

function getAuthHeaders(keyId: string, keySecret: string) {
  return {
    Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
    "Content-Type": "application/json",
  };
}

function getPaymentStatus(orderStatus: string | null, latestPayment: any): string {
  const latestPaymentStatus = latestPayment?.status ?? null;

  if (orderStatus === "paid") return "paid";
  if (latestPaymentStatus === "captured") return "paid";
  // "authorized" = bank reserved funds. Treat as paid from app perspective.
  if (latestPaymentStatus === "authorized") return "paid";
  if (latestPaymentStatus === "failed") return "failed";
  if (latestPaymentStatus === "created") return "pending";
  return "pending";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { order_id, razorpay_order_id } = await req.json().catch(() => ({}));

    if (!order_id && !razorpay_order_id) {
      return new Response(JSON.stringify({ error: "Order reference is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    let orderQuery = adminClient
      .from("orders")
      .select("id, user_id, order_number, created_at, total, payment_method, payment_status, payment_mode, razorpay_order_id, stripe_payment_id, status")
      .eq("user_id", user.id);

    orderQuery = order_id ? orderQuery.eq("id", order_id) : orderQuery.eq("razorpay_order_id", razorpay_order_id);

    const { data: order, error: orderError } = await orderQuery.maybeSingle();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order.payment_method !== "razorpay") {
      return new Response(JSON.stringify({ synced: false, order }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let resolvedRazorpayOrderId = order.razorpay_order_id;

    if (!resolvedRazorpayOrderId) {
      const windowStart = new Date(new Date(order.created_at).getTime() - 30 * 60 * 1000).toISOString();
      const windowEnd = new Date(new Date(order.created_at).getTime() + 30 * 60 * 1000).toISOString();

      const { data: candidateLogs } = await adminClient
        .from("payment_logs")
        .select("id, created_at, amount, razorpay_order_id")
        .eq("user_id", user.id)
        .eq("event_type", "order_created")
        .gte("created_at", windowStart)
        .lte("created_at", windowEnd)
        .not("razorpay_order_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(20);

      const matchedLog = (candidateLogs || [])
        .filter((log: any) => Math.abs(Number(log.amount || 0) - Number(order.total || 0)) < 0.01)
        .sort((a: any, b: any) => {
          const diffA = Math.abs(new Date(a.created_at).getTime() - new Date(order.created_at).getTime());
          const diffB = Math.abs(new Date(b.created_at).getTime() - new Date(order.created_at).getTime());
          return diffA - diffB;
        })[0];

      if (matchedLog?.razorpay_order_id) {
        resolvedRazorpayOrderId = matchedLog.razorpay_order_id;

        await adminClient
          .from("orders")
          .update({ razorpay_order_id: resolvedRazorpayOrderId })
          .eq("id", order.id);

        await adminClient
          .from("payment_logs")
          .update({ order_id: order.id })
          .eq("id", matchedLog.id);
      }
    }

    if (!resolvedRazorpayOrderId) {
      return new Response(JSON.stringify({ synced: false, reason: "missing_razorpay_order_id", order }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RAZORPAY_KEY_ID = getNormalizedEnv("RAZORPAY_KEY_ID");
    const RAZORPAY_KEY_SECRET = getNormalizedEnv("RAZORPAY_KEY_SECRET");

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials are not configured");
    }

    const authHeaders = getAuthHeaders(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET);
    const [orderRes, paymentsRes] = await Promise.all([
      fetch(`https://api.razorpay.com/v1/orders/${resolvedRazorpayOrderId}`, { headers: authHeaders }),
      fetch(`https://api.razorpay.com/v1/orders/${resolvedRazorpayOrderId}/payments`, { headers: authHeaders }),
    ]);

    if (!orderRes.ok || !paymentsRes.ok) {
      const orderErrorBody = await orderRes.text().catch(() => "");
      const paymentsErrorBody = await paymentsRes.text().catch(() => "");
      console.error("Failed to sync Razorpay order", { resolvedRazorpayOrderId, orderErrorBody, paymentsErrorBody });

      return new Response(JSON.stringify({ error: "Failed to fetch payment status" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const razorpayOrder = await orderRes.json();
    const paymentsPayload = await paymentsRes.json();
    const payments = Array.isArray(paymentsPayload?.items) ? paymentsPayload.items : [];
    const latestPayment = [...payments].sort((a: any, b: any) => (Number(b.created_at || 0) - Number(a.created_at || 0)))[0] ?? null;
    const nextPaymentStatus = getPaymentStatus(razorpayOrder?.status ?? null, latestPayment);
    const nextPaymentId = latestPayment?.id || order.stripe_payment_id || null;
    const nextPaymentMode = latestPayment?.method || order.payment_mode || null;

    const shouldUpdate =
      order.payment_status !== nextPaymentStatus ||
      order.razorpay_order_id !== resolvedRazorpayOrderId ||
      order.stripe_payment_id !== nextPaymentId ||
      order.payment_mode !== nextPaymentMode;

    let nextOrder = {
      ...order,
      payment_status: nextPaymentStatus,
      razorpay_order_id: resolvedRazorpayOrderId,
      stripe_payment_id: nextPaymentId,
      payment_mode: nextPaymentMode,
    };

    if (shouldUpdate) {
      const { data: updatedOrder, error: updateError } = await adminClient
        .from("orders")
        .update({
          payment_status: nextPaymentStatus,
          razorpay_order_id: resolvedRazorpayOrderId,
          stripe_payment_id: nextPaymentId,
          payment_mode: nextPaymentMode,
        })
        .eq("id", order.id)
        .select("id, user_id, order_number, created_at, total, payment_method, payment_status, payment_mode, razorpay_order_id, stripe_payment_id, status")
        .single();

      if (updateError) {
        console.error("Failed to update synced order:", updateError);
        return new Response(JSON.stringify({ error: "Failed to save synced payment status" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      nextOrder = updatedOrder;

      try {
        await adminClient.from("payment_logs").insert({
          order_id: order.id,
          user_id: user.id,
          event_type: "payment_synced",
          razorpay_order_id: resolvedRazorpayOrderId,
          razorpay_payment_id: latestPayment?.id || null,
          amount: Number(order.total || 0),
          currency: latestPayment?.currency || "INR",
          metadata: {
            razorpay_order_status: razorpayOrder?.status || null,
            razorpay_payment_status: latestPayment?.status || null,
            payment_mode: nextPaymentMode,
            attempts: razorpayOrder?.attempts || 0,
          },
        });
      } catch (logError) {
        console.error("Failed to log payment sync:", logError);
      }
    }

    return new Response(JSON.stringify({
      synced: shouldUpdate,
      payment_status: nextOrder.payment_status,
      order: nextOrder,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("razorpay-sync-order error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});