import { NextResponse } from "next/server";
import { getClassSummary } from "@/lib/store";
import { getSessionIdFromHeaders } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ classId: string }> },
) {
  const sessionId = await getSessionIdFromHeaders();
  const { classId } = await params;
  const summary = await getClassSummary(sessionId, classId);

  if (!summary) {
    return NextResponse.json({ ok: false, error: "classroom not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, summary });
}
