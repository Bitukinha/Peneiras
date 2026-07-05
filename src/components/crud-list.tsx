import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Pencil, Plus, Trash2 } from "lucide-react";

export type Field = { key: string; label: string; required?: boolean; placeholder?: string };

export function CrudList<T extends { id: string } & Record<string, any>>({
  title,
  items,
  fields,
  onAdd,
  onUpdate,
  onRemove,
  emptyHint,
  extra,
}: {
  title: string;
  items: T[];
  fields: Field[];
  onAdd: (v: Record<string, string>) => void;
  onUpdate: (id: string, v: Record<string, string>) => void;
  onRemove: (id: string) => void;
  emptyHint?: string;
  extra?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const openNew = () => {
    setEditing(null);
    setForm(Object.fromEntries(fields.map((f) => [f.key, ""])));
    setOpen(true);
  };
  const openEdit = (it: T) => {
    setEditing(it);
    setForm(Object.fromEntries(fields.map((f) => [f.key, it[f.key] ?? ""])));
    setOpen(true);
  };
  const submit = () => {
    for (const f of fields) if (f.required && !form[f.key]?.trim()) return;
    if (editing) onUpdate(editing.id, form);
    else onAdd(form);
    setOpen(false);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{items.length} {items.length === 1 ? "registro" : "registros"}</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="size-4" /> Novo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? `Editar ${title}` : `Novo ${title}`}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              {fields.map((f) => (
                <div key={f.key} className="grid gap-1.5">
                  <Label htmlFor={f.key}>{f.label}{f.required && " *"}</Label>
                  <Input
                    id={f.key}
                    value={form[f.key] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={submit}>{editing ? "Salvar" : "Cadastrar"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {extra}

      {items.length === 0 ? (
        <Card className="border-dashed bg-muted/30 p-10 text-center text-sm text-muted-foreground">
          {emptyHint ?? `Nenhum ${title.toLowerCase()} cadastrado ainda.`}
        </Card>
      ) : (
        <div className="grid gap-2">
          {items.map((it) => (
            <Card key={it.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                {fields.map((f, i) => (
                  <div key={f.key} className={i === 0 ? "font-medium text-foreground" : "text-xs text-muted-foreground"}>
                    {i === 0 ? it[f.key] : it[f.key] ? `${f.label}: ${it[f.key]}` : null}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(it)}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => { if (confirm("Excluir este registro?")) onRemove(it.id); }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
