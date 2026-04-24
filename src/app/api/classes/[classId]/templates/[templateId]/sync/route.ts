import { NextResponse } from "next/server";
import { syncClassTemplate } from "@/lib/store";
import { getSessionIdFromHeaders } from "@/lib/session";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ classId: string; templateId: string }> },
) {
  const sessionId = await getSessionIdFromHeaders();
  const { classId, templateId } = await params;
  const result = await syncClassTemplate(sessionId, classId, templateId);

  if (!result) {
    return NextResponse.json({ ok: false, error: "template not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, ...result });
}
