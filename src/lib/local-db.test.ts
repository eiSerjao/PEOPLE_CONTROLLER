import { describe, expect, it } from "vitest";
import {
  createAttendanceBackup,
  parseAttendanceBackup,
  type Attendance,
} from "@/lib/local-db";

const sampleAttendance: Attendance = {
  id: "att-1",
  studentId: "s1",
  date: "2026-05-31T12:00:00.000Z",
  method: "qr",
  status: "present",
};

describe("local-db backups", () => {
  it("exports versioned backups", () => {
    const backup = createAttendanceBackup([sampleAttendance]);

    expect(backup.schemaVersion).toBe(2);
    expect(backup.records).toHaveLength(1);
    expect(backup.records[0]).toEqual(sampleAttendance);
  });

  it("parses versioned backups", () => {
    const backup = createAttendanceBackup([sampleAttendance]);
    const parsed = parseAttendanceBackup(JSON.stringify(backup));

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.schemaVersion).toBe(2);
      expect(parsed.records).toHaveLength(1);
      expect(parsed.records[0]).toEqual(sampleAttendance);
    }
  });

  it("accepts legacy array backups", () => {
    const parsed = parseAttendanceBackup(JSON.stringify([sampleAttendance]));

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.schemaVersion).toBe(1);
      expect(parsed.records).toHaveLength(1);
    }
  });
});
