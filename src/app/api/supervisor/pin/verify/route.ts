import { NextResponse } from "next/server";
import { APP_ADULT_UNLOCK_COOKIE, getSessionIdFromHeaders } from "@/lib/session";
import { isValidSupervisorPin } from "@/lib/supervisor-pin";
import { setAccountMode, verifySupervisorPin } from "@/lib/store";

export async function POST(request: Request) {
  const sessionId = await getSessionIdFromHeaders();
  const body = await request.json() as { pin?: string };
  const pin = body.pin?.trim() ?? "";

  if (!isValidSupervisorPin(pin)) {
    return NextResponse.json({ ok: false, error: "PIN must be 4 to 6 digits" }, { status: 400 });
  }

  const valid = await verifySupervisorPin(sessionId, pin);

  if (!valid) {
    return NextResponse.json({ ok: false, error: "Invalid PIN" }, { status: 403 });
  }

  await setAccountMode(sessionId, { mode: "supervisor" });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(APP_ADULT_UNLOCK_COOKIE, "1", {
    httpOnly: true,
    maxAge: 60 * 30,
    path: "/",
    sameSite: "lax",
  });

  return response;
}
