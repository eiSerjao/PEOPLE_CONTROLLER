import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSession, logout } from "@/lib/auth.functions";
import { getQrChallenge, getQrAudit } from "@/lib/checkin.functions";
import {
  appendAttendance,
  buildCoordinationSnapshot,
  exportAttendanceJson,
  importAttendanceJson,
  resetAttendanceRecords,
  turmas,
  useAttendanceRecords,
} from "@/lib/local-db";
import { Download, FileJson, LogOut, RefreshCw, ShieldAlert, Trash2, Upload, Copy, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/coordenacao")({
  loader: async () => {
    const session = await getSession();
    if (!session || session.role !== "coord") {
      throw redirect({ to: "/" });
    }
    return session;
  },
  head: () => ({
    meta: [
      { title: "Coordenação — PresençaEdu" },
      { name: "description", content: "Painel em tempo real de presença escolar." },
    ],
  }),
  component: CoordPage,
});

type SnapshotRow = ReturnType<typeof buildCoordinationSnapshot>["rows"][number];

function CoordPage() {
  const session = Route.useLoaderData();
  const attendance = useAttendanceRecords();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [turma, setTurma] = useState<string>("todas");
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importName, setImportName] = useState("");
  const [challenge, setChallenge] = useState<{ token: string; expiresAt: string } | null>(null);
  const [secs, setSecs] = useState(30);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function refreshChallenge() {
      const next = await getQrChallenge();
      if (cancelled) return;
      setChallenge(next);
      setSecs(Math.max(1, Math.ceil((new Date(next.expiresAt).getTime() - Date.now()) / 1000)));
    }

    void refreshChallenge();

    const interval = setInterval(() => {
      if (!challenge) return;
      const remaining = Math.max(0, Math.ceil((new Date(challenge.expiresAt).getTime() - Date.now()) / 1000));
      setSecs(remaining);
      if (remaining <= 1) {
        void refreshChallenge();
      }
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [challenge]);

  const { rows, totals } = useMemo(() => buildCoordinationSnapshot(attendance, turma), [attendance, turma]);

  async function handleLogout() {
    await logout();
    navigate({ to: "/" });
  }

  function exportCsv() {
    const csvRows = [
      ["Matrícula", "Nome", "Turma", "Status", "Hora", "Método"],
      ...rows.map((row) => [
        row.student.matricula,
        row.student.name,
        row.student.turma,
        row.present ? (row.attendance?.status === "late" ? "Atrasado" : "Presente") : "Ausente",
        row.attendance ? new Date(row.attendance.date).toLocaleTimeString("pt-BR") : "-",
        row.attendance ? row.attendance.method.toUpperCase() : "-",
      ]),
    ];
    const csv = csvRows.map((row) => row.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `presenca-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function exportJson() {
    try {
      const json = exportAttendanceJson(attendance);
      const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `presenca-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Backup JSON exportado.");
    } catch {
      toast.error("Não foi possível exportar o backup agora.");
    }
  }

  function handleFilePick(file: File | null) {
    if (!file) return;
    setImportName(file.name);
    const reader = new FileReader();
    reader.onload = () => setImportText(String(reader.result ?? ""));
    reader.onerror = () => toast.error("Não foi possível ler o arquivo selecionado.");
    reader.readAsText(file);
  }

  function handleImport() {
    const result = importAttendanceJson(importText);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    setImportOpen(false);
    setImportText("");
    setImportName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.success(`Importado backup v${result.schemaVersion} com ${result.records.length} registro(s).`);
  }

  function handleReset() {
    resetAttendanceRecords();
    toast.success("Banco local restaurado para o seed inicial.");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <AuditDialog open={auditOpen} onOpenChange={setAuditOpen} logs={auditLogs} />
      <main className="flex-1 mx-auto w-full max-w-6xl px-5 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Painel</p>
            <h1 className="text-2xl font-semibold">Presença em tempo real</h1>
            <p className="text-sm text-muted-foreground">Bem-vindo, {session.displayName}.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={turma} onValueChange={setTurma}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as turmas</SelectItem>
                {turmas.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="h-4 w-4" /> Exportar CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportJson}>
              <FileJson className="h-4 w-4" /> Backup JSON
            </Button>
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4" /> Importar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Importar backup JSON</DialogTitle>
                  <DialogDescription>
                    Envie um arquivo JSON exportado pelo app. O schema atual aceita versões legadas e o formato v2.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    onChange={(event) => handleFilePick(event.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground"
                  />
                  <div className="rounded-lg border bg-surface p-3 text-sm">
                    <p className="font-medium">{importName || "Nenhum arquivo selecionado"}</p>
                    <p className="mt-1 text-muted-foreground">
                      O conteúdo será validado e apenas registros compatíveis serão importados.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setImportOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleImport} disabled={!importText}>
                    Importar backup
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4" /> Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Resetar banco local?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso apaga apenas os registros salvos neste navegador e restaura o seed inicial.
                    O cadastro de alunos permanece intacto.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset}>Confirmar reset</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <Stat label="Total" value={totals.total} />
          <Stat label="Presentes" value={totals.present} accent="success" />
          <Stat label="Ausentes" value={totals.absent} accent="destructive" />
          <Stat label="Taxa de presença" value={`${totals.pct}%`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
          <div className="lg:col-span-2 rounded-xl border bg-card">
            <div className="px-5 py-3 border-b flex items-center justify-between">
              <h2 className="font-medium">Lista de chamada</h2>
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> ao vivo
              </span>
            </div>
            <div className="divide-y max-h-112 overflow-auto">
              {rows.map((row) => {
                const { student, attendance: latest, present } = row;
                return (
                  <div
                    key={student.id}
                    className="px-5 py-3 flex items-center justify-between text-sm hover:bg-accent/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-secondary grid place-items-center text-xs font-medium">
                        {student.name
                          .split(" ")
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {student.turma} · {student.matricula}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {present && latest && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(latest.date).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                      <StatusBadge status={latest?.status ?? "absent"} />
                      {!present && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            appendAttendance({
                              id: `manual-${student.id}-${Date.now()}`,
                              studentId: student.id,
                              date: new Date().toISOString(),
                              method: "manual",
                              status: "present",
                            });
                            toast.success(`Presença manual aprovada para ${student.name}.`);
                          }}
                        >
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
                  onClick={async () => setChallenge(await getQrChallenge())}
                  aria-label="Regenerar"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="mt-4 aspect-square w-full rounded-lg border bg-surface p-3 grid place-items-center">
                <QrPreview token={challenge?.token ?? ""} />
              </div>
              <div className="mt-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <p className="font-mono text-xl tracking-[0.3em]">{challenge?.token ?? "—"}</p>
                  <Button variant="ghost" size="icon" onClick={async () => {
                    if (!challenge?.token) return;
                    await navigator.clipboard.writeText(challenge.token);
                    toast.success('Código copiado para a área de transferência.');
                  }} aria-label="Copiar código">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Expira em {secs}s · rotação automática</p>
                <p className="text-xs text-muted-foreground mt-2">Instruções: abra a câmera do celular e aponte para o QR; ou digite o código no app do aluno.</p>
                <div className="mt-2">
                  <Button variant="outline" size="sm" onClick={async () => {
                    setAuditOpen(true);
                    try {
                      const logs = await getQrAudit();
                      setAuditLogs(logs ?? []);
                    } catch (err) {
                      toast.error('Não foi possível buscar os logs.');
                      setAuditOpen(false);
                    }
                  }}>
                    <List className="h-4 w-4 mr-2" /> Ver logs
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-warning-foreground" />
                <h2 className="font-medium">Antifraude</h2>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>· Token QR rotativo (30s) validado no servidor</li>
                <li>· Bloqueio por sessão e perfil</li>
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

function StatusBadge({ status }: { status: "present" | "late" | "absent" }) {
  const map: Record<typeof status, string> = {
    present: "bg-success/10 text-success border-success/20",
    late: "bg-warning/15 text-warning-foreground border-warning/30",
    absent: "bg-destructive/10 text-destructive border-destructive/20",
  };
  const label: Record<typeof status, string> = { present: "Presente", late: "Atrasado", absent: "Ausente" };
  return <span className={cn("text-xs px-2 py-0.5 rounded-full border", map[status])}>{label[status]}</span>;
}

function QrPreview({ token }: { token: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      if (!containerRef.current) return;
      if (!token) {
        containerRef.current.innerHTML = "<div class='text-muted-foreground'>—</div>";
        return;
      }

      try {
        // dynamic import so dev SSR/build environments don't eagerly bundle QR library for server
        const qrcode = await import("qrcode");
        // `toString` returns an SVG string when type: 'svg' is provided
        const svg = await (qrcode as any).toString(token, { type: "svg", errorCorrectionLevel: "M", margin: 1, width: 240 });
        if (!cancelled) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        if (!cancelled) containerRef.current.innerHTML = "<div class='text-destructive text-xs'>Erro gerando QR</div>";
      }
    }

    void render();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return <div ref={containerRef} className="w-full h-full flex items-center justify-center" aria-label="QR Code" />;
}

function AuditDialog({ open, onOpenChange, logs }: { open: boolean; onOpenChange: (v: boolean) => void; logs: any[] | null }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Logs de QR</DialogTitle>
          <DialogDescription>Últimos eventos de geração e validação de tokens (máscara aplicada).</DialogDescription>
        </DialogHeader>
        <div className="max-h-80 overflow-auto text-sm">
          {!logs || logs.length === 0 ? (
            <p className="text-muted-foreground">Nenhum registro encontrado.</p>
          ) : (
            logs.map((l) => (
              <div key={l.id} className="py-2 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{l.event.toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">{l.timestamp} · {l.tokenMasked} {l.studentId ? `· ${l.studentId}` : ''}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">{l.ok === undefined ? '-' : l.ok ? 'OK' : 'FAIL'}</div>
                </div>
                {l.reason && <p className="text-xs text-destructive">{l.reason}</p>}
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
