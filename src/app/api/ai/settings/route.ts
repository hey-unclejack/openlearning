import { NextResponse } from "next/server";
import { normalizeAiSettings } from "@/lib/ai/settings";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { APP_SESSION_COOKIE } from "@/lib/session";
import { readState, saveAiSettings } from "@/lib/store";
import { AISettings } from "@/lib/types";

async function resolveSessionId(request: Request) {
  let sessionId: string | null = null;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    sessionId = user?.id ?? null;
  }

  return (
    sessionId ??
    request.headers.get("x-openlearning-session-id") ??
    request.headers.get("cookie")?.match(new RegExp(`${APP_SESSION_COOKIE}=([^;]+)`))?.[1] ??
    "local-demo"
  );
}

export async function GET(request: Request) {
  const sessionId = await resolveSessionId(request);
  const state = await readState(sessionId);

  return NextResponse.json({
    ok: true,
    settings: normalizeAiSettings(state.aiSettings),
  });
}

export async function PUT(request: Request) {
  const sessionId = await resolveSessionId(request);
  const body = (await request.json()) as Partial<AISettings>;
  const settings = await saveAiSettings(sessionId, normalizeAiSettings(body));

  return NextResponse.json({
    ok: true,
    settings,
  });
}
