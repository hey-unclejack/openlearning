import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { APP_SESSION_COOKIE } from "@/lib/session";
import { LearningType } from "@/lib/types";
import {
  APP_PERFORMANCE_COOKIE,
  recordLearningPerformance,
  serializeLearningPerformanceCookie,
} from "@/lib/practice-performance";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    learningType?: LearningType;
    correct?: boolean;
  };

  if (!payload.learningType || typeof payload.correct !== "boolean") {
    return NextResponse.json({ ok: false, error: "Invalid practice payload." }, { status: 400 });
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const existingCookie = cookieHeader.match(new RegExp(`${APP_PERFORMANCE_COOKIE}=([^;]+)`))?.[1] ?? null;
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
    cookieHeader.match(new RegExp(`${APP_SESSION_COOKIE}=([^;]+)`))?.[1] ??
    "local-demo";

  const nextPerformance = await recordLearningPerformance({
    sessionId,
    learningType: payload.learningType,
    correct: payload.correct,
    fallbackCookieValue: existingCookie
  });

  const response = NextResponse.json({ ok: true, performance: nextPerformance });
  response.cookies.set(APP_PERFORMANCE_COOKIE, serializeLearningPerformanceCookie(nextPerformance), {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 90
  });

  return response;
}
