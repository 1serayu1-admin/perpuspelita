import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify the calling user is authenticated and is a global_super_admin or school_super_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

    // Verify caller
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check caller has admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: callerRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    const callerRoleList = (callerRoles || []).map((r: any) => r.role);
    const isGlobalAdmin = callerRoleList.includes("global_super_admin");
    const isSchoolAdmin = callerRoleList.includes("school_super_admin");

    if (!isGlobalAdmin && !isSchoolAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: insufficient permissions" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, password, name, role, school_id, username } = await req.json();

    if (!password || !name || !role) {
      return new Response(JSON.stringify({ error: "Missing required fields: password, name, role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate placeholder email if not provided
    const userEmail = email || `${username || name.toLowerCase().replace(/\s+/g, '.')}.${Date.now()}@noemail.local`;

    // Prevent non-global admins from creating global_super_admin
    if (role === "global_super_admin" && !isGlobalAdmin) {
      return new Response(JSON.stringify({ error: "Only global super admin can create global super admin accounts" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create user via admin API (auto-confirms email)
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: userEmail,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // The handle_new_user trigger will create profile and default role.
    // Now update role to the specified one (replacing default 'siswa').
    await adminClient
      .from("user_roles")
      .update({ role, school_id: school_id || null })
      .eq("user_id", newUser.user.id);

    // Update profile school_id and username
    const profileUpdate: Record<string, any> = {};
    if (school_id) profileUpdate.school_id = school_id;
    if (username) profileUpdate.username = username;

    if (Object.keys(profileUpdate).length > 0) {
      await adminClient
        .from("profiles")
        .update(profileUpdate)
        .eq("user_id", newUser.user.id);
    }

    return new Response(
      JSON.stringify({ success: true, user_id: newUser.user.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
