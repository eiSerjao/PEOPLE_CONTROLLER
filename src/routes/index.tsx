import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { MapPin, QrCode, ShieldCheck, BarChart3, Clock, Users } from "lucide-react";

export const Route = createFileRoute("/")({
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
      <div className="h-9 w-9 rounded-md bg-secondary grid place-items-center mb-3">
        <Icon className="h-4 w-4 text-foreground" />
      </div>
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{desc}</p>
    </div>
  );
}

function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-5 pt-16 pb-12">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground border">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              MVP em demonstração
            </span>
            <h1 className="mt-5 text-4xl md:text-5xl font-semibold tracking-tight">
              Presença escolar sem fricção, sem fraude.
            </h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
              Check-in por geolocalização ou QR Code dinâmico. Acompanhamento em tempo real para a
              coordenação. Comprovação confiável para programas de incentivo.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/aluno">Sou aluno</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/coordenacao">Sou coordenação</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Feature
              icon={MapPin}
              title="Check-in por geolocalização"
              desc="Valida a presença dentro do raio da escola com tolerância configurável."
            />
            <Feature
              icon={QrCode}
              title="QR Code dinâmico"
              desc="Token rotativo a cada 30s evita compartilhamento e prints."
            />
            <Feature
              icon={ShieldCheck}
              title="Antifraude integrado"
              desc="Bloqueio de múltiplos dispositivos e checagens de janela horária."
            />
            <Feature
              icon={BarChart3}
              title="Relatórios"
              desc="Frequência por turma e aluno, exportável em PDF/Excel."
            />
            <Feature
              icon={Clock}
              title="Tempo real"
              desc="Coordenação vê chegadas conforme acontecem, sem recarregar."
            />
            <Feature
              icon={Users}
              title="Multiescola"
              desc="Arquitetura preparada para várias unidades simultaneamente."
            />
          </div>
        </section>
      </main>
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-5 py-6 text-xs text-muted-foreground flex justify-between">
          <span>© {new Date().getFullYear()} PresençaEdu</span>
          <span>Demonstração — dados simulados</span>
        </div>
      </footer>
    </div>
  );
}
