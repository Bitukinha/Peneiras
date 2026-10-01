import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileDown, FileSpreadsheet, Pencil, Plus, Trash2 } from "lucide-react";
import { PeriodoFilter } from "@/components/periodo-filter";
import { formatDate, noPeriodo, periodoPadrao, type Periodo } from "@/lib/periodo";
import {
  useCrud, useMoinhos, useMotivos, usePeneiras, useTrocas, type Troca,
} from "@/lib/storage";
import { exportTrocasExcel, exportTrocasPDF } from "@/lib/exporters";

export const Route = createFileRoute("/trocas")({
  head: () => ({ meta: [{ title: "Trocas de Peneira — Nutrimilho" }] }),
  component: Page,
});

type FormState = Omit<Troca, "id" | "criadoEm">;

const empty = (): FormState => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    moinhoId: "",
    data: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    turno: "A",
    horario: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    peneiraEntradaId: "",
    peneiraSaidaId: "",
    motivoId: "",
    responsavel: "",
  };
};

function Page() {
  const [moinhos] = useMoinhos();
  const [peneiras] = usePeneiras();
  const [motivos] = useMotivos();
  const { items, add, update, remove } = useCrud(useTrocas());

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Troca | null>(null);
  const [form, setForm] = useState<FormState>(empty());
  const [filtroMoinho, setFiltroMoinho] = useState<string>("todos");
  const [periodo, setPeriodo] = useState<Periodo>(periodoPadrao);
  const [confirmarAvisos, setConfirmarAvisos] = useState(false);

  const cadastrosOk = moinhos.length && peneiras.length && motivos.length;

  const openNew = () => { setEditing(null); setForm(empty()); setOpen(true); };
  const openEdit = (t: Troca) => {
    setEditing(t);
    const { id: _id, criadoEm: _c, ...rest } = t;
    setForm(rest);
    setOpen(true);
  };

  const nomeMoinho = (id: string) => moinhos.find((m) => m.id === id)?.nome ?? "—";
  const codPeneira = (id: string) => peneiras.find((p) => p.id === id)?.codigo ?? "—";
  const nomeMotivo = (id: string) => motivos.find((m) => m.id === id)?.nome ?? "—";

  // Confere a troca do formulário contra o histórico do moinho (mesma regra da aba Divergências).
  const avisos = useMemo(() => {
    const out: string[] = [];
    if (!form.moinhoId) return out;
    if (form.peneiraEntradaId && form.peneiraEntradaId === form.peneiraSaidaId) {
      out.push(`A peneira de entrada e a de saída são a mesma (${codPeneira(form.peneiraEntradaId)}).`);
    }
    const chave = (t: Pick<Troca, "data" | "horario" | "criadoEm">) => `${t.data}${t.horario}${t.criadoEm}`;
    const minha = chave({ ...form, criadoEm: editing?.criadoEm ?? "\uffff" });
    const doMoinho = items
      .filter((t) => t.moinhoId === form.moinhoId && t.id !== editing?.id)
      .sort((a, b) => chave(a).localeCompare(chave(b)));
    const anterior = [...doMoinho].reverse().find((t) => chave(t) < minha);
    const posterior = doMoinho.find((t) => chave(t) > minha);
    if (anterior && form.peneiraSaidaId && anterior.peneiraEntradaId !== form.peneiraSaidaId) {
      out.push(
        `A peneira instalada no ${nomeMoinho(form.moinhoId)} é a ${codPeneira(anterior.peneiraEntradaId)} ` +
        `(troca de ${formatDate(anterior.data)} ${anterior.horario}), mas a saída informada é ${codPeneira(form.peneiraSaidaId)}.`,
      );
    }
    if (posterior && form.peneiraEntradaId && posterior.peneiraSaidaId !== form.peneiraEntradaId) {
      out.push(
        `A troca seguinte (${formatDate(posterior.data)} ${posterior.horario}) registra a saída da peneira ` +
        `${codPeneira(posterior.peneiraSaidaId)}, mas a entrada informada aqui é ${codPeneira(form.peneiraEntradaId)}.`,
      );
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, items, editing, peneiras, moinhos]);

  const salvar = () => {
    if (editing) update(editing.id, form);
    else add({ ...form, criadoEm: new Date().toISOString() });
    setConfirmarAvisos(false);
    setOpen(false);
  };

  const submit = () => {
    if (!form.moinhoId || !form.peneiraEntradaId || !form.peneiraSaidaId || !form.motivoId || !form.responsavel.trim()) return;
    // Não bloqueia: só pede confirmação quando há algo estranho.
    if (avisos.length > 0) setConfirmarAvisos(true);
    else salvar();
  };

  const filtradas = useMemo(() => {
    const arr = items.filter(
      (t) => (filtroMoinho === "todos" || t.moinhoId === filtroMoinho) && noPeriodo(t.data, periodo),
    );
    return [...arr].sort((a, b) => (b.data + b.horario).localeCompare(a.data + a.horario));
  }, [items, filtroMoinho, periodo]);

  const exportCtx = () => ({
    moinhos, peneiras, motivos, trocas: filtradas, filtros: { periodo, moinhoId: filtroMoinho },
  });

  return (
    <AppShell>
      <PageHeader
        title="Trocas de Peneira"
        description="Registre cada troca realizada nos moinhos."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => exportTrocasExcel(exportCtx())}
              disabled={filtradas.length === 0}
            >
              <FileSpreadsheet className="size-4" /> Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => exportTrocasPDF(exportCtx())}
              disabled={filtradas.length === 0}
            >
              <FileDown className="size-4" /> PDF
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNew} disabled={!cadastrosOk}>
                  <Plus className="size-4" /> Nova troca
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>{editing ? "Editar troca" : "Nova troca de peneira"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2 sm:grid-cols-2">
                <Field label="Moinho *">
                  <Select value={form.moinhoId} onValueChange={(v) => setForm((p) => ({ ...p, moinhoId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {moinhos.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Turno *">
                  <Select value={form.turno} onValueChange={(v) => setForm((p) => ({ ...p, turno: v as "A" | "B" | "C" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Turno A</SelectItem>
                      <SelectItem value="B">Turno B</SelectItem>
                      <SelectItem value="C">Turno C</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Data *">
                  <Input type="date" value={form.data} onChange={(e) => setForm((p) => ({ ...p, data: e.target.value }))} />
                </Field>
                <Field label="Horário *">
                  <Input type="time" value={form.horario} onChange={(e) => setForm((p) => ({ ...p, horario: e.target.value }))} />
                </Field>
                <Field label="Peneira de entrada *">
                  <Select value={form.peneiraEntradaId} onValueChange={(v) => setForm((p) => ({ ...p, peneiraEntradaId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {peneiras.map((p) => <SelectItem key={p.id} value={p.id}>{p.codigo}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Peneira de saída *">
                  <Select value={form.peneiraSaidaId} onValueChange={(v) => setForm((p) => ({ ...p, peneiraSaidaId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {peneiras.map((p) => <SelectItem key={p.id} value={p.id}>{p.codigo}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Motivo *">
                  <Select value={form.motivoId} onValueChange={(v) => setForm((p) => ({ ...p, motivoId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {motivos.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Responsável *">
                  <Input
                    placeholder="Nome do responsável"
                    value={form.responsavel}
                    onChange={(e) => setForm((p) => ({ ...p, responsavel: e.target.value }))}
                  />
                </Field>
              </div>
              {avisos.length > 0 && (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
                  <div className="mb-1 flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="size-4" /> Atenção: confira as peneiras
                  </div>
                  <ul className="list-disc space-y-0.5 pl-5">
                    {avisos.map((a) => <li key={a}>{a}</li>)}
                  </ul>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={submit}>{editing ? "Salvar" : "Registrar troca"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <AlertDialog open={confirmarAvisos} onOpenChange={setConfirmarAvisos}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="size-5 text-amber-500" /> Peneira possivelmente errada
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-2 text-sm">
                    <ul className="list-disc space-y-1 pl-5">
                      {avisos.map((a) => <li key={a}>{a}</li>)}
                    </ul>
                    <p className="font-medium text-foreground">Tem certeza que deseja salvar mesmo assim?</p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Voltar e corrigir</AlertDialogCancel>
                <AlertDialogAction onClick={salvar}>Sim, salvar mesmo assim</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          </div>
        }
      />

      {!cadastrosOk && (
        <Card className="mb-4 border-dashed bg-accent/40 p-4 text-sm">
          Para registrar trocas, cadastre antes pelo menos um{" "}
          <Link to="/moinhos" className="font-medium text-primary underline">moinho</Link>,{" "}
          <Link to="/peneiras" className="font-medium text-primary underline">peneira</Link> e{" "}
          <Link to="/motivos" className="font-medium text-primary underline">motivo</Link>.
        </Card>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <PeriodoFilter value={periodo} onChange={setPeriodo} />
        <div className="flex flex-wrap items-center gap-3">
        <Label className="text-sm text-muted-foreground">Moinho:</Label>
        <Select value={filtroMoinho} onValueChange={setFiltroMoinho}>
          <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os moinhos</SelectItem>
            {moinhos.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        </div>
        <span className="text-sm text-muted-foreground sm:ml-auto">
          {filtradas.length} {filtradas.length === 1 ? "troca" : "trocas"}
        </span>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead>Moinho</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Saída</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                    Nenhuma troca registrada no período.
                  </TableCell>
                </TableRow>
              ) : (
                filtradas.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{formatDate(t.data)}</TableCell>
                    <TableCell>{t.horario}</TableCell>
                    <TableCell><Badge variant="secondary">{t.turno}</Badge></TableCell>
                    <TableCell className="font-medium">{nomeMoinho(t.moinhoId)}</TableCell>
                    <TableCell>{codPeneira(t.peneiraEntradaId)}</TableCell>
                    <TableCell>{codPeneira(t.peneiraSaidaId)}</TableCell>
                    <TableCell>{nomeMotivo(t.motivoId)}</TableCell>
                    <TableCell>{t.responsavel}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(t)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => { if (confirm("Excluir esta troca?")) remove(t.id); }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}
