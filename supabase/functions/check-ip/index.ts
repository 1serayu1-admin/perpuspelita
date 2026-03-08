import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function ipToNumber(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function isIpInCidr(ip: string, cidr: string): boolean {
  if (cidr.includes('/')) {
    const [network, bits] = cidr.split('/');
    const mask = (~0 << (32 - parseInt(bits, 10))) >>> 0;
    return (ipToNumber(ip) & mask) === (ipToNumber(network) & mask);
  }
  return ip === cidr;
}

function isPrivateIp(ip: string): boolean {
  // Common private/intranet ranges
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  if (ip.startsWith('172.')) {
    const second = parseInt(ip.split('.')[1], 10);
    if (second >= 16 && second <= 31) return true;
  }
  if (ip === '127.0.0.1' || ip === 'localhost') return true;
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP from headers
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const body = await req.json();
    const school_id = body?.school_id;

    // Validate school_id is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!school_id || typeof school_id !== 'string' || !uuidRegex.test(school_id)) {
      return new Response(
        JSON.stringify({ allowed: true, ip: clientIp }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: school, error } = await adminClient
      .from("schools")
      .select("ip_access_mode, allowed_ips")
      .eq("id", school_id)
      .single();

    if (error || !school) {
      return new Response(
        JSON.stringify({ allowed: true, ip: clientIp }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (school.ip_access_mode !== "restricted") {
      return new Response(
        JSON.stringify({ allowed: true, ip: clientIp }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allowedIps: string[] = school.allowed_ips || [];
    if (allowedIps.length === 0) {
      // Restricted but no IPs configured = allow all (safety)
      return new Response(
        JSON.stringify({ allowed: true, ip: clientIp }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // On intranet, x-forwarded-for may show private IPs or be missing.
    // If we can't determine IP, allow access (fail-open for intranet safety).
    if (clientIp === 'unknown') {
      return new Response(
        JSON.stringify({ allowed: true, ip: clientIp, note: 'IP tidak terdeteksi' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isAllowed = allowedIps.some((cidr: string) => isIpInCidr(clientIp, cidr));

    return new Response(
      JSON.stringify({ allowed: isAllowed, ip: clientIp }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    // On any error (network timeout, etc.), allow access (fail-open)
    return new Response(
      JSON.stringify({ allowed: true, ip: "unknown", error: err.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
