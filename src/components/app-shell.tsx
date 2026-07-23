import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import logo from "@/assets/logo.png";
import { LayoutDashboard, Replace, Factory, Filter, ListChecks } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/trocas", label: "Trocas de Peneira", icon: Replace },
  { to: "/moinhos", label: "Moinhos", icon: Factory },
  { to: "/peneiras", label: "Peneiras", icon: Filter },
  { to: "/motivos", label: "Motivos", icon: ListChecks },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Nutrimilho" className="h-9 w-auto" />
            <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
              Controle de Peneiras
            </span>
          </Link>
          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {nav.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={
                    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors " +
                    (active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground")
                  }
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
            <ThemeToggle />
          </nav>
          <div className="ml-auto md:hidden">
            <ThemeToggle />
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t px-2 py-2 md:hidden">
          {nav.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium " +
                  (active ? "bg-primary text-primary-foreground" : "text-muted-foreground")
                }
              >
                <Icon className="size-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-muted-foreground sm:px-6">
          © 2026 Nutrimilho - (Novaes Tech) | Todos os direitos reservados
        </div>
      </footer>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
