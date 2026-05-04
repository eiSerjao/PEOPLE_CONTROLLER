import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SCHOOL,
  attendanceSeed,
  distanceMeters,
  students,
  type Attendance,
} from "@/lib/mock-data";
import { CheckCircle2, MapPin, QrCode, XCircle, Loader2, History } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/aluno")({
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
  const [matricula, setMatricula] = useState("");
  const [logged, setLogged] = useState<typeof students[number] | null>(null);
  const [history, setHistory] = useState<Attendance[]>([]);

  function login() {
    const s = students.find((x) => x.matricula === matricula.trim());
    if (s) {
      setLogged(s);
      setHistory(attendanceSeed.filter((a) => a.studentId === s.id).slice(0, 10));
    } else {
      alert("Matrícula não encontrada. Tente: 2025001");
    }
  }

  if (!logged) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1 grid place-items-center px-5">
          <div className="w-full max-w-sm rounded-xl border bg-card p-6">
            <h1 className="text-xl font-semibold">Entrar</h1>
            <p className="text-sm text-muted-foreground mt-1">Use sua matrícula escolar.</p>
            <div className="mt-5 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="m">Matrícula</Label>
                <Input
                  id="m"
                  placeholder="2025001"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && login()}
                />
              </div>
              <Button className="w-full" onClick={login}>
                Entrar
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Demo: tente <code className="font-mono">2025001</code>
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  function addHistory(method: Attendance["method"]) {
    const a: Attendance = {
      id: `now-${Date.now()}`,
      studentId: logged!.id,
      date: new Date().toISOString(),
      method,
      status: "present",
    };
    setHistory((h) => [a, ...h]);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 mx-auto w-full max-w-2xl px-5 py-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Olá,</p>
            <h1 className="text-2xl font-semibold">{logged.name.split(" ")[0]}</h1>
            <p className="text-sm text-muted-foreground">
              {logged.turma} · matrícula {logged.matricula}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setLogged(null)}>
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
            <GeoCheckin onSuccess={() => addHistory("geo")} />
          </TabsContent>
          <TabsContent value="qr" className="mt-4">
            <QrCheckin onSuccess={() => addHistory("qr")} />
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
  const m = map[state.kind];
  return (
    <div className={cn("mt-4 flex items-start gap-3 rounded-lg border p-3", m.tone)}>
      {m.icon}
      <div className="text-sm">
        <p className="font-medium">{state.msg}</p>
        {"meta" in state && state.meta && (
          <p className="text-xs opacity-80 mt-0.5">{state.meta}</p>
        )}
      </div>
    </div>
  );
}

function GeoCheckin({ onSuccess }: { onSuccess: () => void }) {
  const [state, setState] = useState<CheckState>({ kind: "idle" });

  function check() {
    setState({ kind: "loading", msg: "Obtendo localização..." });
    if (!("geolocation" in navigator)) {
      // Demo fallback: simulate inside-radius
      setTimeout(() => {
        setState({
          kind: "success",
          msg: "Check-in confirmado",
          meta: `Modo demo · ${SCHOOL.name}`,
        });
        onSuccess();
      }, 800);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const d = distanceMeters(pos.coords.latitude, pos.coords.longitude, SCHOOL.lat, SCHOOL.lng);
        // Demo: aceita qualquer localização válida (simula chegada à escola)
        const ok = true;
        if (ok) {
          setState({
            kind: "success",
            msg: "Check-in confirmado",
            meta: `Distância simulada da escola: ${Math.round(d)} m`,
          });
          onSuccess();
        } else {
          setState({
            kind: "error",
            msg: "Você está fora do raio permitido",
            meta: `${Math.round(d)} m da escola (limite ${SCHOOL.radiusMeters} m)`,
          });
        }
      },
      () => {
        // Permissão negada — demo
        setState({
          kind: "success",
          msg: "Check-in confirmado (demo)",
          meta: "Sem GPS · usando modo demonstração",
        });
        onSuccess();
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
        Verificamos se você está no raio de {SCHOOL.radiusMeters}m da {SCHOOL.name}.
      </p>
      <Button size="lg" className="mt-5 min-w-48" onClick={check} disabled={state.kind === "loading"}>
        {state.kind === "loading" ? "Verificando..." : "Fazer check-in"}
      </Button>
      <StatusCard state={state} />
    </div>
  );
}

function QrCheckin({ onSuccess }: { onSuccess: () => void }) {
  const [state, setState] = useState<CheckState>({ kind: "idle" });
  const [code, setCode] = useState("");
  // Token rotativo a cada 30s (espelha o painel da coordenação)
  const [token, setToken] = useState(() => genToken());
  const [secs, setSecs] = useState(30);

  useEffect(() => {
    const id = setInterval(() => {
      setSecs((s) => {
        if (s <= 1) {
          setToken(genToken());
          return 30;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  function submit() {
    setState({ kind: "loading", msg: "Validando código..." });
    setTimeout(() => {
      if (code.trim().toUpperCase() === token) {
        setState({ kind: "success", msg: "Check-in confirmado por QR" });
        setCode("");
        onSuccess();
      } else {
        setState({
          kind: "error",
          msg: "Código inválido ou expirado",
          meta: "Peça à coordenação um novo QR.",
        });
      }
    }, 500);
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <h2 className="font-medium">Leitura de QR Code</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Aponte a câmera para o QR exibido pela coordenação ou digite o código abaixo.
      </p>
      <div className="mt-4 rounded-lg border bg-surface p-4 text-center">
        <p className="text-xs text-muted-foreground">Código atual (demo):</p>
        <p className="font-mono text-2xl tracking-[0.3em] mt-1">{token}</p>
        <p className="text-xs text-muted-foreground mt-1">Expira em {secs}s</p>
      </div>
      <div className="mt-4 flex gap-2">
        <Input
          placeholder="Digite o código"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={6}
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
  if (items.length === 0)
    return <p className="text-sm text-muted-foreground">Sem registros ainda.</p>;
  return (
    <div className="rounded-xl border bg-card divide-y">
      {items.map((a) => (
        <div key={a.id} className="px-4 py-3 flex items-center justify-between text-sm">
          <div>
            <p className="font-medium">
              {new Date(a.date).toLocaleDateString("pt-BR", {
                weekday: "short",
                day: "2-digit",
                month: "short",
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(a.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              {" · "}
              {a.method === "geo" ? "Geolocalização" : a.method === "qr" ? "QR Code" : "Manual"}
            </p>
          </div>
          <StatusBadge status={a.status} />
        </div>
      ))}
    </div>
  );
}

export function StatusBadge({ status }: { status: Attendance["status"] }) {
  const map = {
    present: "bg-success/10 text-success border-success/20",
    late: "bg-warning/15 text-warning-foreground border-warning/30",
    absent: "bg-destructive/10 text-destructive border-destructive/20",
  };
  const label = { present: "Presente", late: "Atrasado", absent: "Ausente" };
  return (
    <span className={cn("text-xs px-2 py-0.5 rounded-full border", map[status])}>
      {label[status]}
    </span>
  );
}

function genToken() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
