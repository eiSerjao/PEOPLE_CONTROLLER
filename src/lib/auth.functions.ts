import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";
import {
  clearSessionCookie,
  decodeSessionCookie,
  encodeSessionCookie,
  getCookieValueFromHeader,
  resolveLogin,
} from "@/lib/auth.server";
import type { AuthSession } from "@/lib/auth";

const loginSchema = z.discriminatedUnion("role", [
  z.object({ role: z.literal("student"), matricula: z.string().min(1) }),
  z.object({ role: z.literal("coord"), password: z.string().min(1) }),
]);

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const cookieHeader = getRequestHeader("cookie");
  const cookieValue = getCookieValueFromHeader(cookieHeader);
  if (!cookieValue) return null;

  return decodeSessionCookie(cookieValue);
});

export const login = createServerFn({ method: "POST" })
  .inputValidator(loginSchema)
  .handler(async ({ data }) => {
    const session = await resolveLogin(data);
    setResponseHeader("Set-Cookie", await encodeSessionCookie(session));
    return session;
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  setResponseHeader("Set-Cookie", clearSessionCookie());
  return { ok: true };
});

export async function requireSessionRole(expectedRole: AuthSession["role"]) {
  const session = await getSession();
  if (!session || session.role !== expectedRole) {
    throw new Error("Acesso negado.");
  }

  return session;
}
