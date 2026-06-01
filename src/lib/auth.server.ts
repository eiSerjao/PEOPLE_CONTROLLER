import { students } from "@/lib/mock-data";
import { AUTH_COOKIE_NAME, type AuthSession, type LoginRequest } from "@/lib/auth";

const SESSION_SECRET = "school-connect-session-v2";
const COORD_PASSWORD = "coord2026";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function parseCookies(cookieHeader: string | null | undefined) {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey) continue;
    cookies[rawKey] = decodeURIComponent(rest.join("=") || "");
  }

  return cookies;
}

function base64UrlEncode(value: string) {
  return btoa(value).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecode(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  return atob(`${padded}${"=".repeat(padLength)}`);
}

async function hmacSha256(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
}

async function signSession(session: AuthSession) {
  const payload = JSON.stringify({ ...session, issuedAt: Date.now() });
  const encodedPayload = base64UrlEncode(payload);
  const signature = await hmacSha256(SESSION_SECRET, encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function encodeSessionCookie(session: AuthSession) {
  return `${AUTH_COOKIE_NAME}=${encodeURIComponent(await signSession(session))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookie() {
  return `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export async function decodeSessionCookie(cookieValue: string | undefined) {
  if (!cookieValue) return null;

  const [encodedPayload, signature] = cookieValue.split(".");
  if (!encodedPayload || !signature) return null;

  const expected = await hmacSha256(SESSION_SECRET, encodedPayload);
  if (expected !== signature) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AuthSession & { issuedAt?: number };
    if (!payload.role || !payload.displayName) return null;
    return {
      role: payload.role,
      displayName: payload.displayName,
      studentId: payload.studentId,
      matricula: payload.matricula,
    } satisfies AuthSession;
  } catch {
    return null;
  }
}

export async function resolveLogin(request: LoginRequest) {
  if (request.role === "student") {
    const student = students.find((entry) => entry.matricula === request.matricula.trim());
    if (!student) {
      throw new Error("Matrícula não encontrada.");
    }

    return {
      role: "student",
      displayName: student.name,
      studentId: student.id,
      matricula: student.matricula,
    } satisfies AuthSession;
  }

  if (request.password.trim() !== COORD_PASSWORD) {
    throw new Error("Senha da coordenação inválida.");
  }

  return {
    role: "coord",
    displayName: "Coordenação",
  } satisfies AuthSession;
}

export function getCookieValueFromHeader(cookieHeader: string | null | undefined) {
  return parseCookies(cookieHeader)[AUTH_COOKIE_NAME];
}
