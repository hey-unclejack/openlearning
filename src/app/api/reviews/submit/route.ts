import { NextResponse } from "next/server";
import { APP_SESSION_COOKIE } from "@/lib/session";
import { reviewItem } from "@/lib/store";
import { ReviewGrade } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as { itemId: string; grade: ReviewGrade };
  const sessionId =
    request.headers.get("x-openlearning-session-id") ??
    request.headers.get("cookie")?.match(new RegExp(`${APP_SESSION_COOKIE}=([^;]+)`))?.[1] ??
    "local-demo";

  const item = await reviewItem(sessionId, body.itemId, body.grade);

  return NextResponse.json({ ok: true, item });
}
