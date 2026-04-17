import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting (DB-backed, 125 req/min per IP)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const adminClient = createClient(supabaseUrl, supabaseServiceKey);
        const { data: limitData } = await adminClient.rpc('check_rate_limit', {
          _identifier: `pincode:${clientIp}`,
          _max_requests: 125,
          _window_seconds: 60,
        });
        if (limitData && limitData.length > 0 && !limitData[0].allowed) {
          return new Response(JSON.stringify({ error: 'Too many requests' }), {
            status: 429,
            headers: { ...corsHeaders, 'Retry-After': String(limitData[0].retry_after) },
          });
        }
      } catch (_e) {
        // Fail open
      }
    }

    const { pincode } = await req.json();

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return new Response(JSON.stringify({ error: 'Valid 6-digit pincode is required' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Server-to-server request — no CORS restrictions
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.statusText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error: any) {
    console.error('Pincode proxy error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
