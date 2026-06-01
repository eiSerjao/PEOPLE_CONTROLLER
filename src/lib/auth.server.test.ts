import { describe, expect, it } from "vitest";
import { decodeSessionCookie, encodeSessionCookie, resolveLogin } from "@/lib/auth.server";

describe("auth server helpers", () => {
  it("creates and validates a student session cookie", async () => {
    const session = await resolveLogin({ role: "student", matricula: "2025001" });
    const cookie = await encodeSessionCookie(session);
    const value = cookie.split(";")[0].split("=")[1];

    const decoded = await decodeSessionCookie(decodeURIComponent(value));

    expect(decoded).toMatchObject({
      role: "student",
      matricula: "2025001",
      studentId: "s1",
    });
  });

  it("rejects an invalid coordinator password", async () => {
    await expect(resolveLogin({ role: "coord", password: "wrong" })).rejects.toThrow(
      "Senha da coordenação inválida.",
    );
  });

  it("accepts a valid coordinator password", async () => {
    const session = await resolveLogin({ role: "coord", password: "coord2026" });
    expect(session).toMatchObject({ role: "coord", displayName: "Coordenação" });
  });
});
