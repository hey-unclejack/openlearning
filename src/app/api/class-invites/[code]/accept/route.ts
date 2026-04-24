import { NextResponse } from "next/server";
import { acceptClassInvite } from "@/lib/store";
import { getSessionIdFromHeaders } from "@/lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const sessionId = await getSessionIdFromHeaders();
  const { code } = await params;
  const body = await request.json() as { childLearnerId?: string; childName?: string };

  if (!body.childLearnerId && !body.childName?.trim()) {
    return NextResponse.json({ ok: false, error: "childName or childLearnerId is required" }, { status: 400 });
  }

  const result = await acceptClassInvite(sessionId, code, body);

  if (!result) {
    return NextResponse.json({ ok: false, error: "invite not found or disabled" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, ...result });
}
