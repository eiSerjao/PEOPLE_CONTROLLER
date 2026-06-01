import type { AuthSession } from "@/lib/auth";

export const CHECKIN_WINDOW_MS = 30_000;
export const CHECKIN_TOLERANCE_WINDOWS = 1;
export const CHECKIN_SECRET = "school-connect-checkin-v2";

export type CheckInMethod = "geo" | "qr";

export type CheckInChallenge = {
  token: string;
  expiresAt: string;
  windowIndex: number;
};

export type CheckInRequest =
  | { method: "qr"; token: string }
  | { method: "geo"; lat: number; lng: number };

export type CheckInOutcome = {
  id: string;
  studentId: string;
  date: string;
  method: CheckInMethod;
  status: "present";
};

export function getQrWindowIndex(now = Date.now()) {
  return Math.floor(now / CHECKIN_WINDOW_MS);
}

export function getQrExpiry(now = Date.now()) {
  return new Date((getQrWindowIndex(now) + 1) * CHECKIN_WINDOW_MS).toISOString();
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toHex(new Uint8Array(signature));
}

export async function createQrToken(secret: string, now = Date.now()) {
  const windowIndex = getQrWindowIndex(now);
  const digest = await hmac(secret, `${windowIndex}`);
  return {
    token: digest.slice(0, 8).toUpperCase(),
    expiresAt: getQrExpiry(now),
    windowIndex,
  } satisfies CheckInChallenge;
}

export async function validateQrToken(secret: string, token: string, now = Date.now()) {
  const normalized = token.trim().toUpperCase();
  const current = await createQrToken(secret, now);
  if (normalized === current.token) return true;

  for (let offset = 1; offset <= CHECKIN_TOLERANCE_WINDOWS; offset += 1) {
    const previousWindow = now - offset * CHECKIN_WINDOW_MS;
    const challenge = await createQrToken(secret, previousWindow);
    if (normalized === challenge.token) return true;
  }

  return false;
}

export function buildCheckInRecord(studentId: string, method: CheckInMethod): CheckInOutcome {
  return {
    id: `attendance-${studentId}-${Date.now()}`,
    studentId,
    date: new Date().toISOString(),
    method,
    status: "present",
  };
}
