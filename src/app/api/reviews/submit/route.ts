import { NextResponse } from "next/server";
import { APP_SESSION_COOKIE } from "@/lib/session";
import { reviewItem } from "@/lib/store";
import { ReviewGrade, ReviewSessionType } from "@/lib/types";
import {
  APP_PERFORMANCE_COOKIE,
  parseLearningPerformanceCookie,
  serializeLearningPerformanceCookie,
  updateLearningPerformance,
} from "@/lib/practice-performance";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    itemId: string;
    grade: ReviewGrade;
    sessionType?: ReviewSessionType;
    confidence?: number;
    responseMs?: number;
  };
  const sessionId =
    request.headers.get("x-openlearning-session-id") ??
    request.headers.get("cookie")?.match(new RegExp(`${APP_SESSION_COOKIE}=([^;]+)`))?.[1] ??
    "local-demo";
  const existingPerformanceCookie =
    request.headers.get("cookie")?.match(new RegExp(`${APP_PERFORMANCE_COOKIE}=([^;]+)`))?.[1] ?? null;

  const item = await reviewItem(sessionId, body.itemId, body.grade, {
    sessionType: body.sessionType,
    confidence: body.confidence,
    responseMs: body.responseMs,
  });

  const nextPerformance = updateLearningPerformance({
    performance: parseLearningPerformanceCookie(existingPerformanceCookie),
    learningType: item.learningType,
    correct: body.grade !== "again",
  });

  const response = NextResponse.json({
    ok: true,
    item,
    schedule: {
      dueDate: item.dueDate,
      scheduledDays: item.fsrsScheduledDays ?? item.intervalDays,
      state: item.fsrsState ?? "New",
      stability: item.fsrsStability ?? 0,
      difficulty: item.fsrsDifficulty ?? 0,
    },
  });
  response.cookies.set(APP_PERFORMANCE_COOKIE, serializeLearningPerformanceCookie(nextPerformance), {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 90,
  });

  return response;
}
