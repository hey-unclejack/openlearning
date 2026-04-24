import { NextResponse } from "next/server";
import { createClassroom, readState } from "@/lib/store";
import { getSessionIdFromHeaders } from "@/lib/session";

export async function GET() {
  const sessionId = await getSessionIdFromHeaders();
  const state = await readState(sessionId);

  return NextResponse.json({ ok: true, classrooms: state.classrooms });
}

export async function POST(request: Request) {
  const sessionId = await getSessionIdFromHeaders();
  const body = await request.json() as { title?: string; schoolName?: string; gradeBand?: string };

  if (!body.title?.trim()) {
    return NextResponse.json({ ok: false, error: "class title is required" }, { status: 400 });
  }

  const classroom = await createClassroom(sessionId, {
    title: body.title,
    schoolName: body.schoolName,
    gradeBand: body.gradeBand,
  });

  return NextResponse.json({ ok: true, classroom });
}
