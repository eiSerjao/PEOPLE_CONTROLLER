import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSession } from "@/lib/auth.functions";
import type { CheckInRequest } from "@/lib/checkin";
import { getCurrentQrChallenge, validateCheckIn, getQrAuditLogs } from "@/lib/checkin.server";

export const getQrChallenge = createServerFn({ method: "GET" }).handler(async () => {
  return getCurrentQrChallenge();
});

const checkInSchema = z.discriminatedUnion("method", [
  z.object({ method: z.literal("qr"), token: z.string().min(1) }),
  z.object({ method: z.literal("geo"), lat: z.number(), lng: z.number() }),
]);

export const submitCheckIn = createServerFn({ method: "POST" })
  .inputValidator(checkInSchema)
  .handler(async ({ data }) => {
    const session = await getSession();
    const attendance = await validateCheckIn(session, data as CheckInRequest);
    return attendance;
  });

export const getQrAudit = createServerFn({ method: "GET" })
  .handler(async () => {
    const session = await getSession();
    if (!session || session.role !== "coord") throw new Error("Acesso não autorizado.");
    return getQrAuditLogs(200);
  });
