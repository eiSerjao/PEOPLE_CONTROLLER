import { Link } from "@tanstack/react-router";

export function AppHeader() {
  return (
    <header className="border-b bg-card/60 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto max-w-6xl px-5 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary text-primary-foreground grid place-items-center text-xs font-semibold">
            P
          </div>
          <span className="font-semibold tracking-tight">PresençaEdu</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/aluno"
            className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            activeProps={{ className: "px-3 py-1.5 rounded-md bg-accent text-foreground" }}
          >
            Aluno
          </Link>
          <Link
            to="/coordenacao"
            className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            activeProps={{ className: "px-3 py-1.5 rounded-md bg-accent text-foreground" }}
          >
            Coordenação
          </Link>
        </nav>
      </div>
    </header>
  );
}
