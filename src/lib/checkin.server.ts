import { SCHOOL, distanceMeters } from "@/lib/mock-data";
import { CHECKIN_SECRET, createQrToken, validateQrToken, type CheckInRequest } from "@/lib/checkin";
import type { AuthSession } from "@/lib/auth";

export type QrAuditEntry = {
  id: string;
  event: "challenge" | "validate";
  tokenMasked: string;
  studentId?: string;
  ok?: boolean;
  reason?: string;
  windowIndex?: number;
  timestamp: string;
};

const QR_AUDIT_LOG: QrAuditEntry[] = [];

function maskToken(token: string) {
  const t = token.trim().toUpperCase();
  if (t.length <= 4) return "****";
  return `${t.slice(0, 2)}···${t.slice(-2)}`;
}

function pushAudit(entry: Omit<QrAuditEntry, "id" | "timestamp">) {
  const e: QrAuditEntry = {
    id: `qr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  QR_AUDIT_LOG.unshift(e);
  // keep a bounded log
  if (QR_AUDIT_LOG.length > 500) QR_AUDIT_LOG.pop();
  // also emit to standard logs for external aggregation
  // eslint-disable-next-line no-console
  console.info("QR-AUDIT", JSON.stringify(e));
  return e;
}

export async function getCurrentQrChallenge(now = Date.now()) {
  const challenge = await createQrToken(CHECKIN_SECRET, now);
  pushAudit({
    event: "challenge",
    tokenMasked: maskToken(challenge.token),
    windowIndex: challenge.windowIndex,
  });
  return challenge;
}

export async function validateCheckIn(session: AuthSession | null, request: CheckInRequest) {
  if (!session || session.role !== "student" || !session.studentId) {
    throw new Error("É necessário entrar como aluno para registrar presença.");
  }

  if (request.method === "qr") {
    // record attempt
    const masked = maskToken(request.token);
    try {
      const ok = await validateQrToken(CHECKIN_SECRET, request.token);
      pushAudit({ event: "validate", tokenMasked: masked, studentId: session.studentId, ok });
      if (!ok) throw new Error("Código QR inválido ou expirado.");
    } catch (err) {
      pushAudit({ event: "validate", tokenMasked: masked, studentId: session.studentId, ok: false, reason: (err as Error)?.message });
      throw err;
    }
  }

  if (request.method === "geo") {
    const distance = distanceMeters(request.lat, request.lng, SCHOOL.lat, SCHOOL.lng);
    if (distance > SCHOOL.radiusMeters) {
      throw new Error(`Você está fora do raio permitido (${Math.round(distance)} m).`);
    }
  }

  const record = {
    id: `attendance-${session.studentId}-${Date.now()}`,
    studentId: session.studentId,
    date: new Date().toISOString(),
    method: request.method,
    status: "present" as const,
  };

  return record;
}

export function getQrAuditLogs(limit = 100) {
  return QR_AUDIT_LOG.slice(0, limit);
}

