import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { CrudList } from "@/components/crud-list";
import { useCrud, usePeneiras } from "@/lib/storage";

export const Route = createFileRoute("/peneiras")({
  head: () => ({ meta: [{ title: "Peneiras — Nutrimilho" }] }),
  component: Page,
});

function Page() {
  const { items, add, update, remove } = useCrud(usePeneiras());
  return (
    <AppShell>
      <PageHeader title="Peneiras" description="Cadastre os tipos de peneira utilizados." />
      <CrudList
        title="Peneira"
        items={items}
        fields={[
          { key: "codigo", label: "Código / Malha", required: true, placeholder: "Ex.: 3.5 mm" },
          { key: "descricao", label: "Descrição", placeholder: "Opcional" },
        ]}
        onAdd={(v) => add({ codigo: v.codigo, descricao: v.descricao })}
        onUpdate={(id, v) => update(id, { codigo: v.codigo, descricao: v.descricao })}
        onRemove={remove}
      />
    </AppShell>
  );
}
