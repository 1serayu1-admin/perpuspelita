import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, context, userId: hardcodedUserId } = await req.json();
    
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let remainingQuota: number | null = null;
    
    // Try Supabase auth first
    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        {
          global: { headers: { Authorization: authHeader } },
        }
      );

      // Get user
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      if (user && !userError) {
        userId = user.id;
        
        // Call RPC to decrement quota for Supabase users
        const { data: rpcData, error: rpcError } = await supabaseClient.rpc("decrement_ai_quota", {
          p_user_id: userId,
        });

        if (rpcError) {
          console.error("RPC Error:", rpcError);
          throw new Error("Error checking quota");
        }

        const rpcResult = rpcData as any;
        if (!rpcResult.success) {
          return new Response(JSON.stringify({ error: rpcResult.error }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        remainingQuota = rpcResult.remaining;
      }
    }
    
    // Fallback to hardcoded user ID if no Supabase user
    if (!userId && hardcodedUserId) {
      userId = hardcodedUserId;
      // Hardcoded users get unlimited quota (or fixed high quota)
      remainingQuota = 999999;
    }
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Call Gemini API
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in Supabase Secrets");
    }

    const geminiMessages = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }]
    }));

    if (context) {
      geminiMessages.unshift(
        { role: "user", parts: [{ text: `System Context: ${context}\n\nUser Question follows:` }] },
        { role: "model", parts: [{ text: "Understood." }] }
      );
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: geminiMessages }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini Error:", errorText);
      throw new Error("Failed to get AI response");
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, saya tidak bisa memproses permintaan Anda saat ini.";

    return new Response(JSON.stringify({ reply: replyText, remainingQuota }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
