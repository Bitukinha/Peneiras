create table if not exists moinhos (
  id text primary key,
  nome text not null
);

create table if not exists peneiras (
  id text primary key,
  codigo text not null,
  descricao text
);

create table if not exists motivos (
  id text primary key,
  nome text not null
);

create table if not exists trocas (
  id text primary key,
  moinho_id text not null references moinhos(id) on delete cascade,
  data text not null,
  turno text not null,
  horario text not null,
  peneira_entrada_id text not null references peneiras(id) on delete cascade,
  peneira_saida_id text not null references peneiras(id) on delete cascade,
  motivo_id text not null references motivos(id) on delete cascade,
  responsavel text not null,
  criado_em text not null
);
