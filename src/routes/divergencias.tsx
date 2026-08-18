import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { useMoinhos, usePeneiras, useTrocas, type Troca } from "@/lib/storage";

export const Route = createFileRoute("/divergencias")({
  head: () => ({ meta: [{ title: "Divergências — Nutrimilho" }] }),
  component: Page,
});

type Divergencia = {
  moinhoId: string;
  atual: Troca;
  anterior: Troca;
  tipo: "sequencia";
};

function chave(t: Troca) {
  return `${t.data}${t.horario}${t.criadoEm}`;
}

function Page() {
  const [moinhos] = useMoinhos();
  const [peneiras] = usePeneiras();
  const [trocas] = useTrocas();
  const [filtroMoinho, setFiltroMoinho] = useState<string>("todos");

  const nomeMoinho = (id: string) => moinhos.find((m) => m.id === id)?.nome ?? "—";
  const codPeneira = (id: string) => peneiras.find((p) => p.id === id)?.codigo ?? "—";

  const divergencias = useMemo(() => {
    const porMoinho = new Map<string, Troca[]>();
    for (const t of trocas) {
      if (!porMoinho.has(t.moinhoId)) porMoinho.set(t.moinhoId, []);
      porMoinho.get(t.moinhoId)!.push(t);
    }

    const out: Divergencia[] = [];
    for (const [moinhoId, lista] of porMoinho) {
      const ordenada = [...lista].sort((a, b) => chave(a).localeCompare(chave(b)));
      for (let i = 1; i < ordenada.length; i++) {
        const anterior = ordenada[i - 1];
        const atual = ordenada[i];
        if (anterior.peneiraEntradaId !== atual.peneiraSaidaId) {
          out.push({ moinhoId, atual, anterior, tipo: "sequencia" });
        }
      }
    }
    return out.sort((a, b) => chave(b.atual).localeCompare(chave(a.atual)));
  }, [trocas]);

  const filtradas = useMemo(
    () => (filtroMoinho === "todos" ? divergencias : divergencias.filter((d) => d.moinhoId === filtroMoinho)),
    [divergencias, filtroMoinho],
  );

  return (
    <AppShell>
      <PageHeader
        title="Divergências"
        description="Trocas em que a peneira de saída não corresponde à peneira que ficou instalada na troca anterior do mesmo moinho."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Label className="text-sm text-muted-foreground">Filtrar por moinho:</Label>
        <Select value={filtroMoinho} onValueChange={setFiltroMoinho}>
          <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os moinhos</SelectItem>
            {moinhos.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Moinho</TableHead>
                <TableHead>Troca com divergência</TableHead>
                <TableHead>Saída registrada</TableHead>
                <TableHead>Entrada esperada</TableHead>
                <TableHead>Troca anterior</TableHead>
                <TableHead>Responsável</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="size-6 text-primary" />
                      Nenhuma divergência encontrada.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtradas.map((d, i) => (
                  <TableRow key={`${d.atual.id}-${i}`}>
                    <TableCell className="font-medium">{nomeMoinho(d.moinhoId)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{d.atual.turno}</Badge>
                        {formatDate(d.atual.data)} {d.atual.horario}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-destructive font-medium">
                        <AlertTriangle className="size-3.5" />
                        {codPeneira(d.atual.peneiraSaidaId)}
                      </span>
                    </TableCell>
                    <TableCell>{codPeneira(d.anterior.peneiraEntradaId)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(d.anterior.data)} {d.anterior.horario}
                      <span className="mx-1"><ArrowRight className="inline size-3" /></span>
                      entrou {codPeneira(d.anterior.peneiraEntradaId)}
                    </TableCell>
                    <TableCell>{d.atual.responsavel}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </AppShell>
  );
}

function formatDate(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
