import { getSupabase } from '@/integrations/supabase/client';

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function sendChatMessage(messages: ChatMessage[], context?: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase client not initialized");

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Silakan login terlebih dahulu.");

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ messages, context }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || "Gagal menghubungi layanan AI.");
  }

  return {
    reply: data.reply,
    remainingQuota: data.remainingQuota
  };
}
