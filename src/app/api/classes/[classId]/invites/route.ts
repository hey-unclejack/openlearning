import { NextResponse } from "next/server";
import { createClassInvite, readState } from "@/lib/store";
import { getSessionIdFromHeaders } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ classId: string }> },
) {
  const sessionId = await getSessionIdFromHeaders();
  const { classId } = await params;
  const state = await readState(sessionId);
  const invites = state.classInvites.filter((invite) => invite.classroomId === classId);

  return NextResponse.json({ ok: true, invites });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ classId: string }> },
) {
  const sessionId = await getSessionIdFromHeaders();
  const { classId } = await params;
  const body = await request.json() as { templateId?: string; expiresAt?: string };

  if (!body.templateId) {
    return NextResponse.json({ ok: false, error: "templateId is required" }, { status: 400 });
  }

  const invite = await createClassInvite(sessionId, classId, body.templateId, { expiresAt: body.expiresAt });

  if (!invite) {
    return NextResponse.json({ ok: false, error: "classroom or template not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, invite });
}
