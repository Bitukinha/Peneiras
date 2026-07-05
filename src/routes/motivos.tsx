import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { CrudList } from "@/components/crud-list";
import { useCrud, useMotivos } from "@/lib/storage";

export const Route = createFileRoute("/motivos")({
  head: () => ({ meta: [{ title: "Motivos — Nutrimilho" }] }),
  component: Page,
});

function Page() {
  const { items, add, update, remove } = useCrud(useMotivos());
  return (
    <AppShell>
      <PageHeader title="Motivos" description="Cadastre os motivos da troca de peneira." />
      <CrudList
        title="Motivo"
        items={items}
        fields={[{ key: "nome", label: "Descrição do motivo", required: true, placeholder: "Ex.: Desgaste" }]}
        onAdd={(v) => add({ nome: v.nome })}
        onUpdate={(id, v) => update(id, { nome: v.nome })}
        onRemove={remove}
      />
    </AppShell>
  );
}
