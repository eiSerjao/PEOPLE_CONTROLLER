import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { attendanceSeed, students, turmas, type Attendance } from "@/lib/mock-data";
import { Download, RefreshCw, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./aluno";

export const Route = createFileRoute("/coordenacao")({
  head: () => ({
    meta: [
      { title: "Coordenação — PresençaEdu" },
      { name: "description", content: "Painel em tempo real de presença escolar." },
    ],
  }),
  component: CoordPage,
});

function CoordPage() {
  const [turma, setTurma] = useState<string>("todas");
  const [token, setToken] = useState(() => genToken());
  const [secs, setSecs] = useState(30);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSecs((s) => {
        if (s <= 1) {
          setToken(genToken());
          return 30;
        }
        return s - 1;
      });
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const today = useMemo(() => {
    // Simula chegadas de hoje a partir do seed (primeiro dia)
    return attendanceSeed
      .filter((a) => sameDay(new Date(a.date), new Date()))
      .map((a) => ({ ...a }));
  }, []);

  const filteredStudents = students.filter((s) => turma === "todas" || s.turma === turma);

  // Liveness simulation: número crescente de presentes ao longo da manhã (demo)
  const presentIds = useMemo(() => {
    const totalSlots = filteredStudents.length;
    const presentCount = Math.min(totalSlots, 3 + Math.floor(tick / 4));
    return new Set(filteredStudents.slice(0, presentCount).map((s) => s.id));
  }, [tick, filteredStudents]);

  const totals = {
    total: filteredStudents.length,
    present: filteredStudents.filter((s) => presentIds.has(s.id)).length,
  };
  const absent = totals.total - totals.present;
  const pct = totals.total ? Math.round((totals.present / totals.total) * 100) : 0;

  function exportCsv() {
    const rows = [
      ["Matrícula", "Nome", "Turma", "Status", "Hora"],
      ...filteredStudents.map((s) => [
        s.matricula,
        s.name,
        s.turma,
        presentIds.has(s.id) ? "Presente" : "Ausente",
        presentIds.has(s.id) ? new Date().toLocaleTimeString("pt-BR") : "-",
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `presenca-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 mx-auto w-full max-w-6xl px-5 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Painel</p>
            <h1 className="text-2xl font-semibold">Presença em tempo real</h1>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={turma} onValueChange={setTurma}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as turmas</SelectItem>
                {turmas.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="h-4 w-4" /> Exportar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <Stat label="Total" value={totals.total} />
          <Stat label="Presentes" value={totals.present} accent="success" />
          <Stat label="Ausentes" value={absent} accent="destructive" />
          <Stat label="Taxa de presença" value={`${pct}%`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
          <div className="lg:col-span-2 rounded-xl border bg-card">
            <div className="px-5 py-3 border-b flex items-center justify-between">
              <h2 className="font-medium">Lista de chamada</h2>
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> ao vivo
              </span>
            </div>
            <div className="divide-y max-h-[28rem] overflow-auto">
              {filteredStudents.map((s) => {
                const present = presentIds.has(s.id);
                return (
                  <div
                    key={s.id}
                    className="px-5 py-3 flex items-center justify-between text-sm hover:bg-accent/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-secondary grid place-items-center text-xs font-medium">
                        {s.name
                          .split(" ")
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.turma} · {s.matricula}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {present && (
                        <span className="text-xs text-muted-foreground">
                          {new Date().toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                      <StatusBadge status={present ? "present" : "absent"} />
                      {!present && (
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                          Aprovar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-medium">QR Code dinâmico</h2>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => {
                    setToken(genToken());
                    setSecs(30);
                  }}
                  aria-label="Regenerar"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="mt-4 aspect-square w-full rounded-lg border bg-surface p-3 grid place-items-center">
                <QrPreview token={token} />
              </div>
              <div className="mt-3 text-center">
                <p className="font-mono text-xl tracking-[0.3em]">{token}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Expira em {secs}s · rotação automática
                </p>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-warning-foreground" />
                <h2 className="font-medium">Antifraude</h2>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>· Token QR rotativo (30s)</li>
                <li>· Bloqueio de múltiplos dispositivos por conta</li>
                <li>· Validação de raio geográfico (120m)</li>
                <li>· Janela horária de chegada</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "success" | "destructive";
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums",
          accent === "success" && "text-success",
          accent === "destructive" && "text-destructive",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function QrPreview({ token }: { token: string }) {
  // Decorativo: grade pseudo-aleatória derivada do token (não é um QR real)
  const size = 17;
  const cells = useMemo(() => {
    let seed = 0;
    for (let i = 0; i < token.length; i++) seed = (seed * 31 + token.charCodeAt(i)) >>> 0;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0xffffffff;
    };
    return Array.from({ length: size * size }, () => rnd() > 0.55);
  }, [token]);

  return (
    <div
      className="grid w-full h-full"
      style={{ gridTemplateColumns: `repeat(${size}, 1fr)`, gap: 2 }}
      aria-label="QR Code de demonstração"
    >
      {cells.map((on, i) => {
        const r = Math.floor(i / size);
        const c = i % size;
        // marcadores de canto (estilo QR)
        const inCorner =
          (r < 3 && c < 3) || (r < 3 && c > size - 4) || (r > size - 4 && c < 3);
        return (
          <div
            key={i}
            className={cn(
              "rounded-[1px]",
              (inCorner ? (r === 0 || r === 2 || c === 0 || c === 2 || (r > size - 4 && (r === size - 1 || r === size - 3)) || (c > size - 4 && (c === size - 1 || c === size - 3)) ? "bg-foreground" : "bg-transparent") : on ? "bg-foreground" : "bg-transparent"),
            )}
          />
        );
      })}
    </div>
  );
}

function genToken() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
