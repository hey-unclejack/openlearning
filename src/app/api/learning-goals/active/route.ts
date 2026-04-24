import { NextResponse } from "next/server";
import { switchActiveLearningGoal } from "@/lib/store";
import { getSessionIdFromHeaders } from "@/lib/session";

export async function POST(request: Request) {
  const sessionId = await getSessionIdFromHeaders();
  const body = await request.json() as { goalId?: string };

  if (!body.goalId) {
    return NextResponse.json({ ok: false, error: "goalId is required" }, { status: 400 });
  }

  const goal = await switchActiveLearningGoal(sessionId, body.goalId);

  if (!goal) {
    return NextResponse.json({ ok: false, error: "goal not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, goal });
}
