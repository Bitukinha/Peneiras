import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "@/assets/logo.png";
import type { Moinho, Motivo, Peneira, Troca } from "./storage";
import { formatDate, periodoLabel, periodoSlug, type Periodo } from "./periodo";

type Ctx = {
  moinhos: Moinho[];
  peneiras: Peneira[];
  motivos: Motivo[];
  trocas: Troca[];
  /** Filtros aplicados na tela, exibidos no relatório. */
  filtros: { periodo: Periodo; moinhoId: string };
};

function nomeMoinhoFiltro(ctx: Ctx) {
  return ctx.filtros.moinhoId === "todos"
    ? "Todos os moinhos"
    : ctx.moinhos.find((m) => m.id === ctx.filtros.moinhoId)?.nome ?? "—";
}

function resumoPorMotivo(ctx: Ctx) {
  return ctx.motivos
    .map((m) => ({ nome: m.nome, total: ctx.trocas.filter((t) => t.motivoId === m.id).length }))
    .filter((m) => m.total > 0)
    .sort((a, b) => b.total - a.total);
}

function nomeArquivo(ctx: Ctx, ext: string) {
  const moinho = ctx.filtros.moinhoId === "todos"
    ? ""
    : "-" + nomeMoinhoFiltro(ctx)
      .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
  return `nutrimilho-trocas-${periodoSlug(ctx.filtros.periodo)}${moinho}.${ext}`;
}

function buildRows({ moinhos, peneiras, motivos, trocas }: Ctx) {
  const nm = (id: string) => moinhos.find((m) => m.id === id)?.nome ?? "—";
  const pn = (id: string) => peneiras.find((p) => p.id === id)?.codigo ?? "—";
  const mt = (id: string) => motivos.find((m) => m.id === id)?.nome ?? "—";
  const sorted = [...trocas].sort((a, b) => (b.data + b.horario).localeCompare(a.data + a.horario));
  return sorted.map((t) => ({
    Data: formatDate(t.data),
    Horário: t.horario,
    Turno: t.turno,
    Moinho: nm(t.moinhoId),
    "Peneira Entrada": pn(t.peneiraEntradaId),
    "Peneira Saída": pn(t.peneiraSaidaId),
    Motivo: mt(t.motivoId),
    Responsável: t.responsavel,
  }));
}

export function exportTrocasExcel(ctx: Ctx) {
  const rows = buildRows(ctx);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 12 }, { wch: 9 }, { wch: 7 }, { wch: 20 },
    { wch: 16 }, { wch: 16 }, { wch: 22 }, { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Trocas");

  // Resumo
  const resumo = [
    ["Relatório de Trocas de Peneira — Nutrimilho"],
    ["Gerado em", new Date().toLocaleString("pt-BR")],
    ["Período", periodoLabel(ctx.filtros.periodo)],
    ["Moinho", nomeMoinhoFiltro(ctx)],
    [],
    ["Total de trocas", ctx.trocas.length],
    ["Moinhos cadastrados", ctx.moinhos.length],
    ["Peneiras cadastradas", ctx.peneiras.length],
    ["Motivos cadastrados", ctx.motivos.length],
    [],
    ["Por turno", "Total"],
    ["Turno A", ctx.trocas.filter((t) => t.turno === "A").length],
    ["Turno B", ctx.trocas.filter((t) => t.turno === "B").length],
    ["Turno C", ctx.trocas.filter((t) => t.turno === "C").length],
    [],
    ["Por motivo", "Total"],
    ...resumoPorMotivo(ctx).map((m) => [m.nome, m.total]),
  ];
  const wsR = XLSX.utils.aoa_to_sheet(resumo);
  wsR["!cols"] = [{ wch: 30 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsR, "Resumo");

  XLSX.writeFile(wb, nomeArquivo(ctx, "xlsx"));
}

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch(logo);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve((r.result as string) ?? null);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function exportTrocasPDF(ctx: Ctx) {
  const rows = buildRows(ctx);
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Brand colors
  const green: [number, number, number] = [34, 102, 51];
  const yellow: [number, number, number] = [240, 200, 50];
  const dark: [number, number, number] = [40, 50, 45];
  const muted: [number, number, number] = [110, 115, 110];

  // Header band
  doc.setFillColor(...green);
  doc.rect(0, 0, pageW, 70, "F");
  doc.setFillColor(...yellow);
  doc.rect(0, 70, pageW, 4, "F");

  // Logo
  const logoData = await loadLogoDataUrl();
  if (logoData) {
    try { doc.addImage(logoData, "PNG", 28, 16, 110, 38); } catch {}
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Relatório de Trocas de Peneira", pageW - 28, 32, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    `Período: ${periodoLabel(ctx.filtros.periodo)}  ·  ${nomeMoinhoFiltro(ctx)}`,
    pageW - 28, 48, { align: "right" },
  );
  doc.setFontSize(8);
  doc.text(
    `Gerado em ${new Date().toLocaleString("pt-BR")}`,
    pageW - 28, 61, { align: "right" },
  );

  // Summary cards
  const cardsY = 92;
  const cardW = (pageW - 28 * 2 - 12 * 3) / 4;
  const cards = [
    { label: "Total de trocas", value: String(ctx.trocas.length) },
    { label: "Turno A", value: String(ctx.trocas.filter((t) => t.turno === "A").length) },
    { label: "Turno B", value: String(ctx.trocas.filter((t) => t.turno === "B").length) },
    { label: "Turno C", value: String(ctx.trocas.filter((t) => t.turno === "C").length) },
  ];
  cards.forEach((c, i) => {
    const x = 28 + i * (cardW + 12);
    doc.setFillColor(248, 248, 244);
    doc.setDrawColor(225, 225, 215);
    doc.roundedRect(x, cardsY, cardW, 50, 6, 6, "FD");
    doc.setTextColor(...muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(c.label.toUpperCase(), x + 12, cardsY + 18);
    doc.setTextColor(...dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(c.value, x + 12, cardsY + 40);
  });

  // Table
  autoTable(doc, {
    startY: cardsY + 70,
    head: [["Data", "Horário", "Turno", "Moinho", "Peneira Entrada", "Peneira Saída", "Motivo", "Responsável"]],
    body: rows.map((r) => [
      r.Data, r.Horário, r.Turno, r.Moinho,
      r["Peneira Entrada"], r["Peneira Saída"], r.Motivo, r.Responsável,
    ]),
    styles: { font: "helvetica", fontSize: 9, cellPadding: 6, textColor: dark, lineColor: [225, 225, 215] },
    headStyles: { fillColor: green, textColor: [255, 255, 255], fontStyle: "bold", halign: "left" },
    alternateRowStyles: { fillColor: [248, 248, 244] },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 55 },
      2: { cellWidth: 45, halign: "center" },
    },
    margin: { left: 28, right: 28, bottom: 40 },
    didDrawPage: () => {
      // Footer
      const y = pageH - 22;
      doc.setDrawColor(225, 225, 215);
      doc.line(28, y - 10, pageW - 28, y - 10);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...muted);
      doc.text("Novaes Tech 2026", 28, y);
      const pageInfo = `Página ${doc.getCurrentPageInfo().pageNumber}`;
      doc.text(pageInfo, pageW - 28, y, { align: "right" });
    },
  });

  if (rows.length === 0) {
    doc.setTextColor(...muted);
    doc.setFontSize(11);
    doc.text("Nenhuma troca registrada no período.", pageW / 2, cardsY + 110, { align: "center" });
  }

  const porMotivo = resumoPorMotivo(ctx);
  if (porMotivo.length > 0) {
    autoTable(doc, {
      head: [["Resumo por motivo", "Trocas", "%"]],
      body: porMotivo.map((m) => [
        m.nome, String(m.total), `${((m.total / ctx.trocas.length) * 100).toFixed(1)}%`,
      ]),
      styles: { font: "helvetica", fontSize: 9, cellPadding: 5, textColor: dark, lineColor: [225, 225, 215] },
      headStyles: { fillColor: green, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 248, 244] },
      columnStyles: { 1: { halign: "right", cellWidth: 60 }, 2: { halign: "right", cellWidth: 60 } },
      tableWidth: 320,
      margin: { left: 28, right: 28, bottom: 40 },
    });
  }

  doc.save(nomeArquivo(ctx, "pdf"));
}
