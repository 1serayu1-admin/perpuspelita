import { getSupabase } from '@/integrations/supabase/client';

export type ChatMessage = { role: "user" | "assistant"; content: string };
const CURRENT_USER_KEY = 'perpuspelita_current_user';

export async function sendChatMessage(messages: ChatMessage[], context?: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase client not initialized");

  const { data: { session } } = await supabase.auth.getSession();
  
  // Check for hardcoded user if no Supabase session
  let currentUser = null;
  if (!session) {
    const storedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (storedUser) {
      try {
        currentUser = JSON.parse(storedUser);
      } catch (e) {
        // ignore parse error
      }
    }
  }
  
  // If neither session nor hardcoded user, throw error
  if (!session && !currentUser) {
    throw new Error("Silakan login terlebih dahulu.");
  }

  // Prepare headers - only add Authorization if we have a session
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({ messages, context, userId: currentUser?.id }),
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
