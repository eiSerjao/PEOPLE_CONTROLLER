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
      </div>
    </header>
  );
}
