import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseAdminClient: SupabaseClient | null | undefined;

export function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseAdminClient() {
  if (!hasSupabaseConfig()) {
    return null;
  }

  if (supabaseAdminClient !== undefined) {
    return supabaseAdminClient;
  }

  supabaseAdminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    },
  );

  return supabaseAdminClient;
}
