import { NextResponse } from "next/server";
import { APP_SESSION_COOKIE } from "@/lib/session";
import { getDueReviewItems } from "@/lib/store";

export async function GET(request: Request) {
  const sessionId =
    request.headers.get("x-openlearning-session-id") ??
    request.headers.get("cookie")?.match(new RegExp(`${APP_SESSION_COOKIE}=([^;]+)`))?.[1] ??
    "local-demo";

  return NextResponse.json({ items: await getDueReviewItems(sessionId) });
}
