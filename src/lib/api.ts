import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sql } from "./db";

export type Moinho = { id: string; nome: string };
export type Peneira = { id: string; codigo: string; descricao?: string };
export type Motivo = { id: string; nome: string };
export type Troca = {
  id: string;
  moinhoId: string;
  data: string; // yyyy-mm-dd
  turno: "A" | "B" | "C";
  horario: string; // HH:mm
  peneiraEntradaId: string;
  peneiraSaidaId: string;
  motivoId: string;
  responsavel: string;
  criadoEm: string;
};

const idValidator = z.object({ id: z.string() });

// Moinhos

export const listMoinhos = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await sql()`select id, nome from moinhos order by nome`;
  return rows as Moinho[];
});

export const upsertMoinho = createServerFn({ method: "POST" })
  .validator((data: Moinho) => data)
  .handler(async ({ data }) => {
    await sql()`
      insert into moinhos (id, nome) values (${data.id}, ${data.nome})
      on conflict (id) do update set nome = excluded.nome
    `;
  });

export const removeMoinho = createServerFn({ method: "POST" })
  .validator(idValidator)
  .handler(async ({ data }) => {
    await sql()`delete from moinhos where id = ${data.id}`;
  });

// Peneiras

export const listPeneiras = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await sql()`select id, codigo, descricao from peneiras order by codigo`;
  return (rows as any[]).map((r) => ({
    id: r.id,
    codigo: r.codigo,
    descricao: r.descricao ?? undefined,
  })) as Peneira[];
});

export const upsertPeneira = createServerFn({ method: "POST" })
  .validator((data: Peneira) => data)
  .handler(async ({ data }) => {
    await sql()`
      insert into peneiras (id, codigo, descricao) values (${data.id}, ${data.codigo}, ${data.descricao ?? null})
      on conflict (id) do update set codigo = excluded.codigo, descricao = excluded.descricao
    `;
  });

export const removePeneira = createServerFn({ method: "POST" })
  .validator(idValidator)
  .handler(async ({ data }) => {
    await sql()`delete from peneiras where id = ${data.id}`;
  });

// Motivos

export const listMotivos = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await sql()`select id, nome from motivos order by nome`;
  return rows as Motivo[];
});

export const upsertMotivo = createServerFn({ method: "POST" })
  .validator((data: Motivo) => data)
  .handler(async ({ data }) => {
    await sql()`
      insert into motivos (id, nome) values (${data.id}, ${data.nome})
      on conflict (id) do update set nome = excluded.nome
    `;
  });

export const removeMotivo = createServerFn({ method: "POST" })
  .validator(idValidator)
  .handler(async ({ data }) => {
    await sql()`delete from motivos where id = ${data.id}`;
  });

// Trocas

export const listTrocas = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await sql()`
    select id, moinho_id, data, turno, horario, peneira_entrada_id, peneira_saida_id, motivo_id, responsavel, criado_em
    from trocas
  `;
  return (rows as any[]).map((r) => ({
    id: r.id,
    moinhoId: r.moinho_id,
    data: r.data,
    turno: r.turno,
    horario: r.horario,
    peneiraEntradaId: r.peneira_entrada_id,
    peneiraSaidaId: r.peneira_saida_id,
    motivoId: r.motivo_id,
    responsavel: r.responsavel,
    criadoEm: r.criado_em,
  })) as Troca[];
});

export const upsertTroca = createServerFn({ method: "POST" })
  .validator((data: Troca) => data)
  .handler(async ({ data }) => {
    await sql()`
      insert into trocas (id, moinho_id, data, turno, horario, peneira_entrada_id, peneira_saida_id, motivo_id, responsavel, criado_em)
      values (${data.id}, ${data.moinhoId}, ${data.data}, ${data.turno}, ${data.horario}, ${data.peneiraEntradaId}, ${data.peneiraSaidaId}, ${data.motivoId}, ${data.responsavel}, ${data.criadoEm})
      on conflict (id) do update set
        moinho_id = excluded.moinho_id,
        data = excluded.data,
        turno = excluded.turno,
        horario = excluded.horario,
        peneira_entrada_id = excluded.peneira_entrada_id,
        peneira_saida_id = excluded.peneira_saida_id,
        motivo_id = excluded.motivo_id,
        responsavel = excluded.responsavel,
        criado_em = excluded.criado_em
    `;
  });

export const removeTroca = createServerFn({ method: "POST" })
  .validator(idValidator)
  .handler(async ({ data }) => {
    await sql()`delete from trocas where id = ${data.id}`;
  });
