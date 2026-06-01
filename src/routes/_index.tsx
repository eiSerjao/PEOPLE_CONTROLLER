import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSession, login, logout } from "@/lib/auth.functions";
import { BarChart3, Clock, LogOut, MapPin, QrCode, ShieldCheck, Users } from "lucide-react";

export const Route = createFileRoute("/_index")({
  loader: async () => getSession(),
  head: () => ({
    meta: [
      { title: "PresençaEdu — Controle de presença escolar" },
      {
        name: "description",
        content:
          "Plataforma simples e segura de check-in escolar por geolocalização e QR Code dinâmico.",
      },
    ],
  }),
  component: Index,
});

function Feature({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-3 grid h-9 w-9 place-items-center rounded-md bg-secondary">
        <Icon className="h-4 w-4 text-foreground" />
      </div>
      <h3 className="font-medium">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

function Index() {
  const session = Route.useLoaderData();
  const navigate = useNavigate();
  const [role, setRole] = useState<"student" | "coord">("student");
  const [matricula, setMatricula] = useState("2025001");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");

    if (role === "student" && !matricula.trim()) {
      setError("Preencha a matrícula do aluno.");
      return;
    }

    if (role === "coord" && !password.trim()) {
      setError("Preencha a senha da coordenação.");
      return;
    }

    try {
      const logged =
        role === "student"
          ? await login({ data: { role: "student", matricula } })
          : await login({ data: { role: "coord", password } });

      navigate({ to: logged.role === "student" ? "/aluno" : "/coordenacao" });
    } catch (caught) {
      if (Array.isArray(caught) && caught.length > 0 && caught[0]?.message) {
        setError(caught.map((item) => item.message).join("; "));
        return;
      }

      if (caught instanceof Error) {
        setError(caught.message);
        return;
      }

      if (caught && typeof caught === "object" && "message" in caught) {
        setError(String((caught as { message: string }).message));
        return;
      }

      setError("Não foi possível entrar.");
    }
  }

  async function handleLogout() {
    await logout();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl items-start gap-8 px-5 pb-12 pt-16 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> ENTRAR
            </span>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
              Acesso por perfil
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
              Entre como aluno para fazer check-in por geolocalização ou QR Code, ou como coordenação para controlar a presença em tempo real.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Feature
                icon={Clock}
                title="Rotação automática"
                desc="O QR muda periodicamente e é validado no servidor para reduzir fraude."
              />
              <Feature
                icon={MapPin}
                title="Check-in geográfico"
                desc="A presença por local é validada pelo raio permitido da escola."
              />
              <Feature
                icon={ShieldCheck}
                title="Sessão assinada"
                desc="O acesso é controlado por cookie assinado e perfis distintos."
              />
              <Feature
                icon={QrCode}
                title="QR dinâmico"
                desc="A coordenação exibe um código atual para leitura rápida no celular."
              />
              <Feature
                icon={Users}
                title="Perfis separados"
                desc="Aluno e coordenação têm telas e permissões diferentes."
              />
              <Feature
                icon={BarChart3}
                title="Visão em tempo real"
                desc="A coordenação acompanha a chamada com exportação e auditoria."
              />
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <Tabs
              value={role}
              onValueChange={(value) => setRole(value as "student" | "coord")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="student">Aluno</TabsTrigger>
                <TabsTrigger value="coord">Coordenação</TabsTrigger>
              </TabsList>

              <TabsContent value="student" className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="matricula">Matrícula</Label>
                  <Input
                    id="matricula"
                    value={matricula}
                    onChange={(event) => setMatricula(event.target.value)}
                    placeholder="2025001"
                    autoComplete="off"
                  />
                </div>
                <Button className="w-full" onClick={handleSubmit}>
                  Entrar como aluno
                </Button>
                <p className="text-xs text-muted-foreground">
                  Demo local: matrícula 2025001.
                </p>
              </TabsContent>

              <TabsContent value="coord" className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Senha da coordenação</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Digite a senha"
                    autoComplete="current-password"
                  />
                </div>
                <Button className="w-full" onClick={handleSubmit}>
                  Entrar como coordenação
                </Button>
                <p className="text-xs text-muted-foreground">
                  A coordenação acessa o painel para acompanhar presença, QR e auditoria.
                </p>
              </TabsContent>
            </Tabs>

            {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

            {session ? (
              <div className="mt-6 rounded-xl border bg-secondary/40 p-4">
                <p className="text-sm font-medium">Você já está autenticado como {session.displayName}.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => navigate({ to: session.role === "student" ? "/aluno" : "/coordenacao" })}>
                    Continuar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
