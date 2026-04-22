import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const APP_SESSION_COOKIE = "openlearning_session_id";
export const APP_SESSION_HEADER = "x-openlearning-session-id";

export async function getSessionIdFromHeaders() {
  const headerStore = await headers();
  const sessionId = headerStore.get(APP_SESSION_HEADER);

  return sessionId ?? "local-demo";
}

export async function getCurrentUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}
