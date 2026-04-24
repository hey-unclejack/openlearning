import { NextResponse } from "next/server";
import { createClassGoalTemplate, readState } from "@/lib/store";
import { getSessionIdFromHeaders } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ classId: string }> },
) {
  const sessionId = await getSessionIdFromHeaders();
  const { classId } = await params;
  const state = await readState(sessionId);
  const templates = state.classGoalTemplates.filter((template) => template.classroomId === classId);

  return NextResponse.json({ ok: true, templates });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ classId: string }> },
) {
  const sessionId = await getSessionIdFromHeaders();
  const { classId } = await params;
  const body = await request.json() as { goalId?: string; title?: string };
  const template = await createClassGoalTemplate(sessionId, classId, body);

  if (!template) {
    return NextResponse.json({ ok: false, error: "classroom or source goal not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, template });
}
