import { NextResponse } from "next/server";
import { APP_ADULT_UNLOCK_COOKIE, getSessionIdFromHeaders } from "@/lib/session";
import { isValidSupervisorPin } from "@/lib/supervisor-pin";
import { setSupervisorPin } from "@/lib/store";

export async function POST(request: Request) {
  const sessionId = await getSessionIdFromHeaders();
  const body = await request.json() as { pin?: string };
  const pin = body.pin?.trim() ?? "";

  if (!isValidSupervisorPin(pin)) {
    return NextResponse.json({ ok: false, error: "PIN must be 4 to 6 digits" }, { status: 400 });
  }

  await setSupervisorPin(sessionId, pin);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(APP_ADULT_UNLOCK_COOKIE, "1", {
    httpOnly: true,
    maxAge: 60 * 30,
    path: "/",
    sameSite: "lax",
  });

  return response;
}
