import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { APP_SESSION_COOKIE } from "@/lib/session";
import { completeLesson } from "@/lib/store";

export async function POST(request: Request) {
  const body = (await request.json()) as { lessonId?: string };

  if (!body.lessonId) {
    return NextResponse.json({ error: "lessonId is required" }, { status: 400 });
  }

  let sessionId: string | null = null;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    sessionId = user?.id ?? null;
  }

  sessionId =
    sessionId ??
    request.headers.get("x-openlearning-session-id") ??
    request.headers.get("cookie")?.match(new RegExp(`${APP_SESSION_COOKIE}=([^;]+)`))?.[1] ??
    "local-demo";

  const result = await completeLesson(sessionId, body.lessonId);

  return NextResponse.json({ ok: true, ...result });
}
