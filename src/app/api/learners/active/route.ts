import { NextResponse } from "next/server";
import { switchActiveLearner } from "@/lib/store";
import { getSessionIdFromHeaders } from "@/lib/session";

export async function POST(request: Request) {
  const sessionId = await getSessionIdFromHeaders();
  const body = await request.json() as { learnerId?: string };

  if (!body.learnerId) {
    return NextResponse.json({ ok: false, error: "learnerId is required" }, { status: 400 });
  }

  const learner = await switchActiveLearner(sessionId, body.learnerId);

  if (!learner) {
    return NextResponse.json({ ok: false, error: "learner not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, learner });
}
