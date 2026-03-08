import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const { school_id } = await req.json();

    if (!school_id) {
      // No school assigned, allow access
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

    const isAllowed = allowedIps.some((cidr: string) => isIpInCidr(clientIp, cidr));

    return new Response(
      JSON.stringify({ allowed: isAllowed, ip: clientIp }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ allowed: true, ip: "unknown", error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
