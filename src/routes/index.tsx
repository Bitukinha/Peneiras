import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMoinhos, useMotivos, usePeneiras, useTrocas } from "@/lib/storage";
import { Factory, Filter, ListChecks, Replace, ArrowRight } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Nutrimilho" },
      { name: "description", content: "Controle de trocas de peneiras dos moinhos Nutrimilho." },
    ],
  }),
  component: Dashboard,
});

const PALETTE = ["var(--brand-green)", "var(--brand-yellow)", "oklch(0.55 0.15 140)", "oklch(0.7 0.15 110)", "oklch(0.35 0.1 150)"];

function Dashboard() {
  const [moinhos] = useMoinhos();
  const [peneiras] = usePeneiras();
  const [motivos] = useMotivos();
  const [trocas] = useTrocas();

  const hoje = new Date().toISOString().slice(0, 10);
  const trocasHoje = trocas.filter((t) => t.data === hoje).length;

  const ultimos7 = useMemo(() => {
    const dias: { dia: string; label: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      dias.push({
        dia: iso,
        label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        total: trocas.filter((t) => t.data === iso).length,
      });
    }
    return dias;
  }, [trocas]);

  const porMoinho = useMemo(() => {
    return moinhos
      .map((m) => ({ nome: m.nome, total: trocas.filter((t) => t.moinhoId === m.id).length }))
      .sort((a, b) => b.total - a.total);
  }, [moinhos, trocas]);

  const porMotivo = useMemo(() => {
    const total = trocas.length || 1;
    return motivos
      .map((m) => ({ name: m.nome, value: trocas.filter((t) => t.motivoId === m.id).length }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
    void total;
  }, [motivos, trocas]);

  const porTurno = useMemo(
    () => (["A", "B", "C"] as const).map((tn) => ({
      turno: `Turno ${tn}`,
      total: trocas.filter((t) => t.turno === tn).length,
    })),
    [trocas],
  );

  const ultimas = useMemo(
    () => [...trocas].sort((a, b) => (b.data + b.horario).localeCompare(a.data + a.horario)).slice(0, 5),
    [trocas],
  );

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="Visão geral das trocas de peneira."
        action={
          <Button asChild>
            <Link to="/trocas"><Replace className="size-4" /> Nova troca</Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Trocas no total" value={trocas.length} icon={<Replace className="size-5" />} />
        <Stat label="Trocas hoje" value={trocasHoje} icon={<Replace className="size-5" />} accent />
        <Stat label="Moinhos cadastrados" value={moinhos.length} icon={<Factory className="size-5" />} />
        <Stat label="Peneiras cadastradas" value={peneiras.length} icon={<Filter className="size-5" />} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Trocas nos últimos 7 dias</h3>
          {trocas.length === 0 ? (
            <Empty />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ultimos7}>
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip cursor={{ fill: "var(--accent)" }} />
                  <Bar dataKey="total" fill="var(--brand-green)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Trocas por motivo</h3>
          {porMotivo.length === 0 ? (
            <Empty />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={porMotivo} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>
                    {porMotivo.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Trocas por turno</h3>
          <div className="space-y-3">
            {porTurno.map((t) => {
              const max = Math.max(1, ...porTurno.map((x) => x.total));
              const pct = (t.total / max) * 100;
              return (
                <div key={t.turno}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium">{t.turno}</span>
                    <span className="text-muted-foreground">{t.total}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Ranking de trocas por moinho</h3>
            <Link to="/moinhos" className="text-xs text-primary hover:underline">Gerenciar</Link>
          </div>
          {porMoinho.length === 0 ? (
            <Empty hint="Cadastre um moinho para começar." />
          ) : (
            <div className="space-y-2">
              {porMoinho.map((m) => {
                const max = Math.max(1, ...porMoinho.map((x) => x.total));
                return (
                  <div key={m.nome} className="flex items-center gap-3">
                    <div className="w-32 truncate text-sm font-medium">{m.nome}</div>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-secondary"
                        style={{ width: `${(m.total / max) * 100}%` }}
                      />
                    </div>
                    <div className="w-8 text-right text-sm tabular-nums">{m.total}</div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Últimas trocas registradas</h3>
          <Button asChild variant="ghost" size="sm">
            <Link to="/trocas">Ver todas <ArrowRight className="size-4" /></Link>
          </Button>
        </div>
        {ultimas.length === 0 ? (
          <Empty />
        ) : (
          <ul className="divide-y">
            {ultimas.map((t) => {
              const moinho = moinhos.find((m) => m.id === t.moinhoId)?.nome ?? "—";
              const ent = peneiras.find((p) => p.id === t.peneiraEntradaId)?.codigo ?? "—";
              const sai = peneiras.find((p) => p.id === t.peneiraSaidaId)?.codigo ?? "—";
              const motivo = motivos.find((m) => m.id === t.motivoId)?.nome ?? "—";
              const [y, mo, d] = t.data.split("-");
              return (
                <li key={t.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                  <Badge variant="secondary">{t.turno}</Badge>
                  <span className="text-muted-foreground">{d}/{mo}/{y} {t.horario}</span>
                  <span className="font-medium">{moinho}</span>
                  <span className="text-muted-foreground">{ent} <ArrowRight className="inline size-3" /> {sai}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{motivo} · {t.responsavel}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {moinhos.length + peneiras.length + motivos.length === 0 && (
        <Card className="mt-6 border-dashed bg-accent/30 p-6">
          <h3 className="text-base font-semibold">Comece configurando seus cadastros</h3>
          <p className="mt-1 text-sm text-muted-foreground">Cadastre moinhos, peneiras e motivos para começar a registrar trocas.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline"><Link to="/moinhos"><Factory className="size-4" /> Moinhos</Link></Button>
            <Button asChild variant="outline"><Link to="/peneiras"><Filter className="size-4" /> Peneiras</Link></Button>
            <Button asChild variant="outline"><Link to="/motivos"><ListChecks className="size-4" /> Motivos</Link></Button>
          </div>
        </Card>
      )}
    </AppShell>
  );
}

function Stat({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent?: boolean }) {
  return (
    <Card className={"p-5 " + (accent ? "border-primary/30 bg-primary/5" : "")}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={"flex size-9 items-center justify-center rounded-md " + (accent ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
          {icon}
        </span>
      </div>
      <div className="mt-3 text-3xl font-semibold tabular-nums">{value}</div>
    </Card>
  );
}

function Empty({ hint }: { hint?: string }) {
  return (
    <div className="grid h-40 place-items-center rounded-md border border-dashed text-sm text-muted-foreground">
      {hint ?? "Sem dados ainda."}
    </div>
  );
}
