import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSession, logout } from "@/lib/auth.functions";
import { getQrChallenge, submitCheckIn } from "@/lib/checkin.functions";
import { SCHOOL, distanceMeters, type Attendance } from "@/lib/mock-data";
import { appendAttendance, getStudentHistory, useAttendanceRecords } from "@/lib/local-db";
import { CheckCircle2, History, Loader2, MapPin, QrCode, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/aluno")({
  loader: async () => {
    const session = await getSession();
    if (!session || session.role !== "student") {
      throw redirect({ to: "/" });
    }
    return session;
  },
  head: () => ({
    meta: [
      { title: "Aluno — PresençaEdu" },
      { name: "description", content: "Faça seu check-in escolar de forma rápida e segura." },
    ],
  }),
  component: AlunoPage,
});

type CheckState =
  | { kind: "idle" }
  | { kind: "loading"; msg: string }
  | { kind: "success"; msg: string; meta?: string }
  | { kind: "error"; msg: string; meta?: string };

function AlunoPage() {
  const session = Route.useLoaderData();
  const attendance = useAttendanceRecords();
  const navigate = useNavigate();
  const history = useMemo(() => getStudentHistory(attendance, session.studentId ?? ""), [attendance, session.studentId]);

  async function handleLogout() {
    await logout();
    navigate({ to: "/" });
  }

  function addHistory(method: Attendance["method"], record: Attendance) {
    if (record.studentId !== session.studentId) return;
    appendAttendance(record);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 mx-auto w-full max-w-2xl px-5 py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Olá,</p>
            <h1 className="text-2xl font-semibold">{session.displayName.split(" ")[0]}</h1>
            <p className="text-sm text-muted-foreground">{session.matricula}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Sair
          </Button>
        </div>

        <Tabs defaultValue="geo" className="mt-7">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="geo">
              <MapPin className="h-4 w-4 mr-1.5" /> Geo
            </TabsTrigger>
            <TabsTrigger value="qr">
              <QrCode className="h-4 w-4 mr-1.5" /> QR
            </TabsTrigger>
            <TabsTrigger value="hist">
              <History className="h-4 w-4 mr-1.5" /> Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geo" className="mt-4">
            <GeoCheckin
              onSuccess={(record) => addHistory("geo", record)}
            />
          </TabsContent>
          <TabsContent value="qr" className="mt-4">
            <QrCheckin onSuccess={(record) => addHistory("qr", record)} />
          </TabsContent>
          <TabsContent value="hist" className="mt-4">
            <HistoryList items={history} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function StatusCard({ state }: { state: CheckState }) {
  if (state.kind === "idle") return null;
  const iconCls = "h-5 w-5";
  const map = {
    loading: { icon: <Loader2 className={cn(iconCls, "animate-spin")} />, tone: "bg-secondary" },
    success: { icon: <CheckCircle2 className={iconCls} />, tone: "bg-success/10 text-success border-success/20" },
    error: { icon: <XCircle className={iconCls} />, tone: "bg-destructive/10 text-destructive border-destructive/20" },
  } as const;
  const current = map[state.kind];
  return (
    <div className={cn("mt-4 flex items-start gap-3 rounded-lg border p-3", current.tone)}>
      {current.icon}
      <div className="text-sm">
        <p className="font-medium">{state.msg}</p>
        {"meta" in state && state.meta ? <p className="text-xs opacity-80 mt-0.5">{state.meta}</p> : null}
      </div>
    </div>
  );
}

function GeoCheckin({ onSuccess }: { onSuccess: (record: Attendance) => void }) {
  const [state, setState] = useState<CheckState>({ kind: "idle" });

  async function check() {
    setState({ kind: "loading", msg: "Obtendo localização..." });

    if (!("geolocation" in navigator)) {
      setState({ kind: "error", msg: "Seu navegador não suporta geolocalização." });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const record = await submitCheckIn({
            data: {
              method: "geo",
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          });
          setState({
            kind: "success",
            msg: "Check-in confirmado",
            meta: `Distância simulada da escola: ${Math.round(
              distanceMeters(position.coords.latitude, position.coords.longitude, SCHOOL.lat, SCHOOL.lng),
            )} m`,
          });
          onSuccess(record);
        } catch (error) {
          setState({
            kind: "error",
            msg: "Não foi possível validar o check-in",
            meta: error instanceof Error ? error.message : "Erro inesperado.",
          });
        }
      },
      () => {
        setState({
          kind: "error",
          msg: "Permissão de localização negada",
          meta: "Use a aba QR para concluir o registro.",
        });
      },
      { enableHighAccuracy: true, timeout: 6000 },
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6 text-center">
      <div className="mx-auto h-14 w-14 rounded-full bg-secondary grid place-items-center">
        <MapPin className="h-6 w-6" />
      </div>
      <h2 className="mt-4 font-medium">Check-in por localização</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Validamos no servidor se você está no raio de {SCHOOL.radiusMeters}m da {SCHOOL.name}.
      </p>
      <Button size="lg" className="mt-5 min-w-48" onClick={check} disabled={state.kind === "loading"}>
        {state.kind === "loading" ? "Verificando..." : "Fazer check-in"}
      </Button>
      <StatusCard state={state} />
    </div>
  );
}

function QrCheckin({ onSuccess }: { onSuccess: (record: Attendance) => void }) {
  const [state, setState] = useState<CheckState>({ kind: "idle" });
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<{ token: string; expiresAt: string } | null>(null);
  const [secs, setSecs] = useState(30);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const next = await getQrChallenge();
      if (cancelled) return;
      setChallenge(next);
      setSecs(Math.max(1, Math.ceil((new Date(next.expiresAt).getTime() - Date.now()) / 1000)));
    }

    void refresh();

    const interval = setInterval(() => {
      const next = challenge
        ? Math.max(0, Math.ceil((new Date(challenge.expiresAt).getTime() - Date.now()) / 1000))
        : 0;
      setSecs(next);
      if (next <= 1) {
        void refresh();
      }
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [challenge]);

  async function submit() {
    if (!challenge) {
      setState({ kind: "error", msg: "QR ainda não carregou." });
      return;
    }

    setState({ kind: "loading", msg: "Validando código..." });
    try {
        const record = await submitCheckIn({ data: { method: "qr", token: code.trim() } });
      setState({ kind: "success", msg: "Check-in confirmado por QR" });
      setCode("");
      onSuccess(record);
    } catch (error) {
      setState({
        kind: "error",
        msg: "Código inválido ou expirado",
        meta: error instanceof Error ? error.message : "Peça à coordenação um novo QR.",
      });
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <h2 className="font-medium">Leitura de QR Code</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Aponte a câmera para o QR exibido pela coordenação ou digite o código abaixo.
      </p>
      <div className="mt-4 rounded-lg border bg-surface p-4 text-center">
        <p className="text-xs text-muted-foreground">Código atual:</p>
        <p className="font-mono text-2xl tracking-[0.3em] mt-1">{challenge?.token ?? "—"}</p>
        <p className="text-xs text-muted-foreground mt-1">Expira em {secs}s</p>
      </div>
      <div className="mt-4 flex gap-2">
        <Input
          placeholder="Digite o código"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          maxLength={8}
          className="font-mono tracking-widest"
        />
        <Button onClick={submit} disabled={!code || state.kind === "loading"}>
          Validar
        </Button>
      </div>
      <StatusCard state={state} />
    </div>
  );
}

function HistoryList({ items }: { items: Attendance[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem registros ainda.</p>;
  }

  return (
    <div className="rounded-xl border bg-card divide-y">
      {items.map((attendance) => (
        <div key={attendance.id} className="px-4 py-3 flex items-center justify-between text-sm">
          <div>
            <p className="font-medium">
              {new Date(attendance.date).toLocaleDateString("pt-BR", {
                weekday: "short",
                day: "2-digit",
                month: "short",
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(attendance.date).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" · "}
              {attendance.method === "geo" ? "Geolocalização" : "QR Code"}
            </p>
          </div>
          <StatusBadge status={attendance.status} />
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: Attendance["status"] }) {
  const map = {
    present: "bg-success/10 text-success border-success/20",
    late: "bg-warning/15 text-warning-foreground border-warning/30",
    absent: "bg-destructive/10 text-destructive border-destructive/20",
  };
  const label = { present: "Presente", late: "Atrasado", absent: "Ausente" };
  return <span className={cn("text-xs px-2 py-0.5 rounded-full border", map[status])}>{label[status]}</span>;
}
