import { NextResponse } from "next/server";
import { APP_SESSION_COOKIE } from "@/lib/session";
import { saveProfile } from "@/lib/store";
import { LearnerProfile } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, string>;
  const sessionId =
    request.headers.get("x-openlearning-session-id") ??
    request.headers.get("cookie")?.match(new RegExp(`${APP_SESSION_COOKIE}=([^;]+)`))?.[1] ??
    "local-demo";

  const profile: LearnerProfile = {
    targetLanguage: body.targetLanguage,
    nativeLanguage: body.nativeLanguage,
    level: body.level as LearnerProfile["level"],
    dailyMinutes: Number(body.dailyMinutes),
    focus: body.focus
  };

  await saveProfile(sessionId, profile);

  return NextResponse.json({ ok: true });
}
