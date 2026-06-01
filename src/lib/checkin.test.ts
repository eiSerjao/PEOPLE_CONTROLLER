import { describe, expect, it } from "vitest";
import { CHECKIN_SECRET, createQrToken, validateQrToken } from "@/lib/checkin";

describe("check-in qr helpers", () => {
  it("creates stable tokens for the same time window", async () => {
    const now = Date.UTC(2026, 4, 31, 12, 0, 0);
    const first = await createQrToken(CHECKIN_SECRET, now);
    const second = await createQrToken(CHECKIN_SECRET, now + 10_000);

    expect(first.token).toBe(second.token);
    expect(first.expiresAt).toBeDefined();
  });

  it("accepts tokens from the current or previous window", async () => {
    const now = Date.UTC(2026, 4, 31, 12, 0, 0);
    const token = await createQrToken(CHECKIN_SECRET, now);

    expect(await validateQrToken(CHECKIN_SECRET, token.token, now)).toBe(true);
    expect(await validateQrToken(CHECKIN_SECRET, token.token, now + 45_000)).toBe(true);
  });
});
