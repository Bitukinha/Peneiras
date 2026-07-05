import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { CrudList } from "@/components/crud-list";
import { useCrud, useMoinhos } from "@/lib/storage";

export const Route = createFileRoute("/moinhos")({
  head: () => ({ meta: [{ title: "Moinhos — Nutrimilho" }] }),
  component: Page,
});

function Page() {
  const { items, add, update, remove } = useCrud(useMoinhos());
  return (
    <AppShell>
      <PageHeader title="Moinhos" description="Cadastre os moinhos da planta." />
      <CrudList
        title="Moinho"
        items={items}
        fields={[{ key: "nome", label: "Nome do moinho", required: true, placeholder: "Ex.: Moinho 01" }]}
        onAdd={(v) => add({ nome: v.nome })}
        onUpdate={(id, v) => update(id, { nome: v.nome })}
        onRemove={remove}
      />
    </AppShell>
  );
}
