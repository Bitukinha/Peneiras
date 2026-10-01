export type PeriodoPreset = "mes-atual" | "mes-anterior" | "ultimos-7" | "ultimos-30" | "ano-atual" | "tudo" | "personalizado";

export type Periodo = { preset: PeriodoPreset; de: string; ate: string };

const pad = (n: number) => String(n).padStart(2, "0");

/** Data local em yyyy-mm-dd (evita o deslocamento de fuso do toISOString). */
export function isoLocal(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function hojeIso() {
  return isoLocal(new Date());
}

export function formatDate(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export const PRESETS: { value: PeriodoPreset; label: string }[] = [
  { value: "mes-atual", label: "Mês atual" },
  { value: "mes-anterior", label: "Mês anterior" },
  { value: "ultimos-7", label: "Últimos 7 dias" },
  { value: "ultimos-30", label: "Últimos 30 dias" },
  { value: "ano-atual", label: "Ano atual" },
  { value: "tudo", label: "Todo o período" },
  { value: "personalizado", label: "Personalizado" },
];

export function periodoDoPreset(preset: PeriodoPreset, atual?: Periodo): Periodo {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (preset) {
    case "mes-atual":
      return { preset, de: isoLocal(new Date(y, m, 1)), ate: isoLocal(new Date(y, m + 1, 0)) };
    case "mes-anterior":
      return { preset, de: isoLocal(new Date(y, m - 1, 1)), ate: isoLocal(new Date(y, m, 0)) };
    case "ultimos-7":
      return { preset, de: isoLocal(new Date(y, m, now.getDate() - 6)), ate: isoLocal(now) };
    case "ultimos-30":
      return { preset, de: isoLocal(new Date(y, m, now.getDate() - 29)), ate: isoLocal(now) };
    case "ano-atual":
      return { preset, de: `${y}-01-01`, ate: `${y}-12-31` };
    case "tudo":
      return { preset, de: "", ate: "" };
    case "personalizado":
      return { preset, de: atual?.de || isoLocal(new Date(y, m, 1)), ate: atual?.ate || isoLocal(now) };
  }
}

export const periodoPadrao = () => periodoDoPreset("mes-atual");

export function noPeriodo(data: string, p: Periodo) {
  if (p.de && data < p.de) return false;
  if (p.ate && data > p.ate) return false;
  return true;
}

export function periodoLabel(p: Periodo) {
  if (!p.de && !p.ate) return "Todo o período";
  if (p.de && p.ate) return `${formatDate(p.de)} a ${formatDate(p.ate)}`;
  if (p.de) return `A partir de ${formatDate(p.de)}`;
  return `Até ${formatDate(p.ate)}`;
}

/** Trecho para nome de arquivo, ex.: 2026-10-01_a_2026-10-31 */
export function periodoSlug(p: Periodo) {
  if (!p.de && !p.ate) return "completo";
  return `${p.de || "inicio"}_a_${p.ate || "hoje"}`;
}
