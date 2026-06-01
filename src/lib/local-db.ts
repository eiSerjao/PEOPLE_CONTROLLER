import { useEffect, useState } from "react";
import { attendanceSeed, students, turmas, type Attendance, type Student } from "@/lib/mock-data";

const STORAGE_KEY = "school-connect:attendance:v1";
const STORAGE_EVENT = "school-connect:attendance-changed";
export const ATTENDANCE_BACKUP_SCHEMA_VERSION = 2;

const seedAttendance = attendanceSeed.map((record) => ({ ...record })).sort(sortByDateDesc);

type ParsedAttendanceBackup =
  | { ok: true; records: Attendance[]; schemaVersion: number; invalidCount?: number }
  | { ok: false; message: string };

export type AttendanceBackupEnvelopeV2 = {
  schemaVersion: typeof ATTENDANCE_BACKUP_SCHEMA_VERSION;
  generatedAt: string;
  records: Attendance[];
};

function isBrowser() {
  return typeof window !== "undefined";
}

function sortByDateDesc(a: Attendance, b: Attendance) {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

function isAttendance(value: unknown): value is Attendance {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<Attendance>;
  return (
    typeof record.id === "string" &&
    typeof record.studentId === "string" &&
    typeof record.date === "string" &&
    (record.method === "geo" || record.method === "qr" || record.method === "manual") &&
    (record.status === "present" || record.status === "late" || record.status === "absent")
  );
}

function cloneAttendance(records: Attendance[]) {
  return records.map((record) => ({ ...record })).sort(sortByDateDesc);
}

function normalizeAttendanceRecords(records: Attendance[]) {
  return cloneAttendance(records.filter(isAttendance));
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function loadAttendanceRecords() {
  if (!isBrowser()) return cloneAttendance(seedAttendance);

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return cloneAttendance(seedAttendance);

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return cloneAttendance(seedAttendance);

    const records = parsed.filter(isAttendance).map((record) => ({ ...record }));
    return records.sort(sortByDateDesc);
  } catch {
    return cloneAttendance(seedAttendance);
  }
}

function saveAttendanceRecords(records: Attendance[]) {
  const next = cloneAttendance(records);

  if (isBrowser()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(STORAGE_EVENT));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Falha ao salvar o banco local.");
    }
  }

  return next;
}

export function createAttendanceBackup(records: Attendance[]): AttendanceBackupEnvelopeV2 {
  return {
    schemaVersion: ATTENDANCE_BACKUP_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    records: normalizeAttendanceRecords(records),
  };
}

export function parseAttendanceBackup(rawJson: string): ParsedAttendanceBackup {
  try {
    const parsed = JSON.parse(rawJson) as unknown;

    if (Array.isArray(parsed)) {
      const records = normalizeAttendanceRecords(parsed as Attendance[]);
      if (records.length === 0) {
        return { ok: false, message: "Nenhum registro válido foi encontrado no arquivo." };
      }

      return { ok: true, records, schemaVersion: 1, invalidCount: 0 };
    }

    if (!parsed || typeof parsed !== "object") {
      return { ok: false, message: "O backup precisa ser um JSON com registros de presença." };
    }

    const envelope = parsed as Partial<AttendanceBackupEnvelopeV2> & {
      schemaVersion?: number;
      records?: unknown;
    };

    if (envelope.schemaVersion && envelope.schemaVersion > ATTENDANCE_BACKUP_SCHEMA_VERSION) {
      return {
        ok: false,
        message: `Backup do schema v${envelope.schemaVersion} não é suportado neste app.`,
      };
    }

    if (!Array.isArray(envelope.records)) {
      return { ok: false, message: "O arquivo precisa conter a chave records com uma lista." };
    }

    const records = normalizeAttendanceRecords(envelope.records as Attendance[]);
    if (records.length === 0) {
      return { ok: false, message: "Nenhum registro válido foi encontrado no backup." };
    }

    return { ok: true, records, schemaVersion: envelope.schemaVersion ?? 1, invalidCount: 0 };
  } catch {
    return { ok: false, message: "Não foi possível ler o JSON enviado." };
  }
}

export function exportAttendanceJson(records: Attendance[]) {
  return JSON.stringify(createAttendanceBackup(records), null, 2);
}

export function resetAttendanceRecords() {
  return saveAttendanceRecords(seedAttendance);
}

export function importAttendanceJson(rawJson: string) {
  const result = parseAttendanceBackup(rawJson);
  if (!result.ok) return result;

  saveAttendanceRecords(result.records);
  return result;
}

export function useAttendanceRecords() {
  const [records, setRecords] = useState<Attendance[]>(() => cloneAttendance(seedAttendance));

  useEffect(() => {
    if (!isBrowser()) return;

    const sync = () => setRecords(loadAttendanceRecords());

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(STORAGE_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(STORAGE_EVENT, sync);
    };
  }, []);

  return records;
}

export function findStudentByMatricula(matricula: string) {
  return students.find((student) => student.matricula === matricula.trim());
}

export function getStudentHistory(records: Attendance[], studentId: string, limit = 10) {
  return records
    .filter((record) => record.studentId === studentId)
    .sort(sortByDateDesc)
    .slice(0, limit);
}

export function appendAttendance(record: Attendance) {
  const next = [record, ...loadAttendanceRecords().filter((item) => item.id !== record.id)];
  return saveAttendanceRecords(next);
}

export function buildCoordinationSnapshot(records: Attendance[], turma: string) {
  const visibleStudents = students.filter((student) => turma === "todas" || student.turma === turma);
  const todaysRecords = records.filter((record) => sameDay(new Date(record.date), new Date()));
  const latestByStudent = new Map<string, Attendance>();

  for (const record of todaysRecords.sort(sortByDateDesc)) {
    if (!latestByStudent.has(record.studentId)) {
      latestByStudent.set(record.studentId, record);
    }
  }

  const rows = visibleStudents.map((student) => {
    const attendance = latestByStudent.get(student.id) ?? null;
    const present = attendance ? attendance.status !== "absent" : false;

    return {
      student,
      attendance,
      present,
    };
  });

  const total = rows.length;
  const present = rows.filter((row) => row.present).length;

  return {
    rows,
    totals: {
      total,
      present,
      absent: total - present,
      pct: total ? Math.round((present / total) * 100) : 0,
    },
  };
}

export { turmas, type Attendance, type Student };
