export type Student = {
  id: string;
  name: string;
  matricula: string;
  turma: string;
};

export type Attendance = {
  id: string;
  studentId: string;
  date: string; // ISO
  method: "geo" | "qr" | "manual";
  status: "present" | "late" | "absent";
};

export const SCHOOL = {
  name: "E.E. Monteiro Lobato",
  lat: -23.5505,
  lng: -46.6333,
  radiusMeters: 120,
};

export const turmas = ["6º A", "7º B", "8º A", "9º C", "1º EM", "2º EM", "3º EM"];

export const students: Student[] = [
  { id: "s1", name: "Ana Beatriz Souza", matricula: "2025001", turma: "9º C" },
  { id: "s2", name: "Bruno Carvalho", matricula: "2025002", turma: "9º C" },
  { id: "s3", name: "Carla Mendes", matricula: "2025003", turma: "1º EM" },
  { id: "s4", name: "Daniel Rocha", matricula: "2025004", turma: "1º EM" },
  { id: "s5", name: "Eduarda Lima", matricula: "2025005", turma: "2º EM" },
  { id: "s6", name: "Felipe Araújo", matricula: "2025006", turma: "2º EM" },
  { id: "s7", name: "Gabriela Nunes", matricula: "2025007", turma: "3º EM" },
  { id: "s8", name: "Henrique Dias", matricula: "2025008", turma: "8º A" },
  { id: "s9", name: "Isabela Castro", matricula: "2025009", turma: "8º A" },
  { id: "s10", name: "João Pedro Silva", matricula: "2025010", turma: "7º B" },
  { id: "s11", name: "Larissa Pinto", matricula: "2025011", turma: "7º B" },
  { id: "s12", name: "Mateus Oliveira", matricula: "2025012", turma: "6º A" },
];

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(7, 30 + Math.floor(Math.random() * 25), 0, 0);
  return d.toISOString();
}

export const attendanceSeed: Attendance[] = students.flatMap((s, i) =>
  Array.from({ length: 14 }).map((_, k) => ({
    id: `${s.id}-${k}`,
    studentId: s.id,
    date: daysAgo(k),
    method: (k % 3 === 0 ? "qr" : "geo") as "geo" | "qr",
    status: (k === 4 && i % 4 === 0
      ? "absent"
      : k === 2 && i % 5 === 0
      ? "late"
      : "present") as Attendance["status"],
  })),
);

export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
