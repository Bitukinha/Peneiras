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
import { Badge } from "@/components/ui/badge";
import { FileDown, FileSpreadsheet, Pencil, Plus, Trash2 } from "lucide-react";
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

  const cadastrosOk = moinhos.length && peneiras.length && motivos.length;

  const openNew = () => { setEditing(null); setForm(empty()); setOpen(true); };
  const openEdit = (t: Troca) => {
    setEditing(t);
    const { id: _id, criadoEm: _c, ...rest } = t;
    setForm(rest);
    setOpen(true);
  };

  const submit = () => {
    if (!form.moinhoId || !form.peneiraEntradaId || !form.peneiraSaidaId || !form.motivoId || !form.responsavel.trim()) return;
    if (editing) update(editing.id, form);
    else add({ ...form, criadoEm: new Date().toISOString() });
    setOpen(false);
  };

  const nomeMoinho = (id: string) => moinhos.find((m) => m.id === id)?.nome ?? "—";
  const codPeneira = (id: string) => peneiras.find((p) => p.id === id)?.codigo ?? "—";
  const nomeMotivo = (id: string) => motivos.find((m) => m.id === id)?.nome ?? "—";

  const filtradas = useMemo(() => {
    const arr = filtroMoinho === "todos" ? items : items.filter((t) => t.moinhoId === filtroMoinho);
    return [...arr].sort((a, b) => (b.data + b.horario).localeCompare(a.data + a.horario));
  }, [items, filtroMoinho]);

  return (
    <AppShell>
      <PageHeader
        title="Trocas de Peneira"
        description="Registre cada troca realizada nos moinhos."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => exportTrocasExcel({ moinhos, peneiras, motivos, trocas: items })}
              disabled={items.length === 0}
            >
              <FileSpreadsheet className="size-4" /> Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => exportTrocasPDF({ moinhos, peneiras, motivos, trocas: items })}
              disabled={items.length === 0}
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
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={submit}>{editing ? "Salvar" : "Registrar troca"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                    Nenhuma troca registrada.
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

function formatDate(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
