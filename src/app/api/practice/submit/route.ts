import { NextResponse } from "next/server";
import { LearningType } from "@/lib/types";
import {
  APP_PERFORMANCE_COOKIE,
  parseLearningPerformanceCookie,
  serializeLearningPerformanceCookie,
  updateLearningPerformance
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
  const existingCookie = cookieHeader.match(new RegExp(`${APP_PERFORMANCE_COOKIE}=([^;]+)`))?.[1];
  const currentPerformance = parseLearningPerformanceCookie(existingCookie);
  const nextPerformance = updateLearningPerformance({
    performance: currentPerformance,
    learningType: payload.learningType,
    correct: payload.correct
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
