import { NextResponse } from "next/server";
import { createSupervisedLearner, readState } from "@/lib/store";
import { getSessionIdFromHeaders } from "@/lib/session";

export async function GET() {
  const sessionId = await getSessionIdFromHeaders();
  const state = await readState(sessionId);

  return NextResponse.json({ ok: true, activeLearnerId: state.activeLearnerId, learners: state.learners ?? [] });
}

export async function POST(request: Request) {
  const sessionId = await getSessionIdFromHeaders();
  const body = await request.json() as { displayName?: string };

  if (!body.displayName?.trim()) {
    return NextResponse.json({ ok: false, error: "displayName is required" }, { status: 400 });
  }

  const learner = await createSupervisedLearner(sessionId, { displayName: body.displayName });

  return NextResponse.json({ ok: true, learner });
}
