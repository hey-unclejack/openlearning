import { NextResponse } from "next/server";
import { APP_ADULT_UNLOCK_COOKIE, getSessionIdFromHeaders } from "@/lib/session";
import { isValidSupervisorPin } from "@/lib/supervisor-pin";
import { readState, setAccountMode, verifySupervisorPin } from "@/lib/store";
import { AccountMode } from "@/lib/types";

export async function POST(request: Request) {
  const sessionId = await getSessionIdFromHeaders();
  const body = await request.json() as { mode?: AccountMode; learnerId?: string; pin?: string };

  if (body.mode !== "child" && body.mode !== "supervisor") {
    return NextResponse.json({ ok: false, error: "mode must be child or supervisor" }, { status: 400 });
  }

  const state = await readState(sessionId);

  if (!state.supervisorPinHash) {
    return NextResponse.json({ ok: false, error: "Supervisor PIN is not set" }, { status: 428 });
  }

  if (body.mode === "supervisor") {
    const pin = body.pin?.trim() ?? "";

    if (!isValidSupervisorPin(pin) || !(await verifySupervisorPin(sessionId, pin))) {
      return NextResponse.json({ ok: false, error: "Invalid PIN" }, { status: 403 });
    }
  }

  const result = await setAccountMode(sessionId, { mode: body.mode, learnerId: body.learnerId });

  if (!result) {
    return NextResponse.json({ ok: false, error: "learner not found" }, { status: 404 });
  }

  const response = NextResponse.json({ ok: true, ...result });

  if (body.mode === "supervisor") {
    response.cookies.set(APP_ADULT_UNLOCK_COOKIE, "1", {
      httpOnly: true,
      maxAge: 60 * 30,
      path: "/",
      sameSite: "lax",
    });
  } else {
    response.cookies.delete(APP_ADULT_UNLOCK_COOKIE);
  }

  return response;
}
