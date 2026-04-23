import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const APP_SESSION_COOKIE = "openlearning_session_id";
export const APP_SESSION_HEADER = "x-openlearning-session-id";
export const APP_AVATAR_COOKIE = "openlearning_avatar_url";

export function resolveAvatarCookie(value?: string | null) {
  if (!value) {
    return undefined;
  }

  const decoded = (() => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  })();

  if (decoded.startsWith("http://") || decoded.startsWith("https://") || decoded.startsWith("/")) {
    return decoded;
  }

  return undefined;
}

export async function getSessionIdFromHeaders() {
  const headerStore = await headers();
  const sessionId = headerStore.get(APP_SESSION_HEADER);

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user?.id) {
      return user.id;
    }
  }

  const cookieSessionId = headerStore.get("cookie")?.match(new RegExp(`${APP_SESSION_COOKIE}=([^;]+)`))?.[1];

  return sessionId ?? cookieSessionId ?? "local-demo";
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
