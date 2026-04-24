import { createHash, timingSafeEqual } from "crypto";

const PIN_PATTERN = /^\d{4,6}$/;

export function isValidSupervisorPin(pin: string) {
  return PIN_PATTERN.test(pin);
}

export function hashSupervisorPin(sessionId: string, pin: string) {
  const pepper = process.env.SUPERVISOR_PIN_PEPPER ?? "openlearning-supervisor-pin-v1";
  return createHash("sha256").update(`${sessionId}:${pin}:${pepper}`).digest("hex");
}

export function verifySupervisorPinHash(sessionId: string, pin: string, expectedHash?: string) {
  if (!expectedHash || !isValidSupervisorPin(pin)) {
    return false;
  }

  const actualHash = hashSupervisorPin(sessionId, pin);
  const actual = Buffer.from(actualHash, "hex");
  const expected = Buffer.from(expectedHash, "hex");

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
