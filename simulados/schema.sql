-- Execute este script no SQL Editor do Supabase (Project > SQL Editor > New query).
-- Cria/recria as tabelas usadas pela página /simulados.
-- Seguro rodar do zero: como a feature ainda não tem dados em produção, este script
-- derruba e recria a tabela "simulados" para refletir o novo modelo (duas datas +
-- acertos por área + dificuldade). Se você já rodou uma versão anterior deste script,
-- pode rodar este de novo sem problema.

drop table if exists public.raio_x_dismissals;
drop table if exists public.simulado_revisoes;
drop table if exists public.simulado_erros;
drop table if exists public.simulados;

create table public.simulados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  data_dia1 date,
  data_dia2 date,
  dificuldade text check (dificuldade in ('facil', 'medio', 'dificil')),
  constraint simulados_pelo_menos_uma_data check (data_dia1 is not null or data_dia2 is not null),
  questoes_total integer check (questoes_total >= 0),
  acertos_linguagens integer check (acertos_linguagens >= 0),
  acertos_humanas integer check (acertos_humanas >= 0),
  acertos_matematica integer check (acertos_matematica >= 0),
  acertos_natureza integer check (acertos_natureza >= 0),
  nota_redacao integer check (nota_redacao >= 0 and nota_redacao <= 1000),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.simulado_erros (
  id uuid primary key default gen_random_uuid(),
  simulado_id uuid not null references public.simulados(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  materia text not null,
  conteudo text not null,
  subtopico text,
  motivo text not null check (motivo in (
    'nao_sabia_conteudo',
    'erro_interpretacao',
    'erro_calculo',
    'falta_tempo',
    'confundi_alternativas',
    'erro_atencao',
    'chute',
    'outro'
  )),
  observacao text,
  created_at timestamptz not null default now()
);

-- Coluna adicionada após lançamento inicial
alter table public.simulado_erros add column if not exists numero_questao integer check (numero_questao >= 1 and numero_questao <= 9999);

create table public.simulado_revisoes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  simulado_id uuid not null references public.simulados(id) on delete cascade,
  materia     text not null check (materia <> ''),
  conteudo    text not null check (conteudo <> ''),
  created_at  timestamptz not null default now(),
  constraint simulado_revisoes_unique unique (user_id, simulado_id, materia, conteudo)
);

create index simulados_user_id_idx on public.simulados(user_id);
create index simulados_data_dia1_idx on public.simulados(data_dia1 desc);
create index simulado_erros_simulado_id_idx on public.simulado_erros(simulado_id);
create index simulado_erros_user_id_idx on public.simulado_erros(user_id);

alter table public.simulados enable row level security;
alter table public.simulado_erros enable row level security;

create policy "simulados_select_own" on public.simulados
  for select using (auth.uid() = user_id);
create policy "simulados_insert_own" on public.simulados
  for insert with check (auth.uid() = user_id);
create policy "simulados_update_own" on public.simulados
  for update using (auth.uid() = user_id);
create policy "simulados_delete_own" on public.simulados
  for delete using (auth.uid() = user_id);

create policy "simulado_erros_select_own" on public.simulado_erros
  for select using (auth.uid() = user_id);
create policy "simulado_erros_insert_own" on public.simulado_erros
  for insert with check (auth.uid() = user_id);
create policy "simulado_erros_update_own" on public.simulado_erros
  for update using (auth.uid() = user_id);
create policy "simulado_erros_delete_own" on public.simulado_erros
  for delete using (auth.uid() = user_id);

alter table public.simulado_revisoes enable row level security;
create index simulado_revisoes_user_simulado_idx on public.simulado_revisoes(user_id, simulado_id);

create policy "simulado_revisoes_select_own" on public.simulado_revisoes
  for select using (auth.uid() = user_id);
create policy "simulado_revisoes_insert_own" on public.simulado_revisoes
  for insert with check (auth.uid() = user_id);
create policy "simulado_revisoes_delete_own" on public.simulado_revisoes
  for delete using (auth.uid() = user_id);

-- ─── Raio-X: dismissal de conteúdos recorrentes ──────────
create table public.raio_x_dismissals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  materia      text not null check (materia <> ''),
  conteudo     text not null check (conteudo <> ''),
  dismissed_at timestamptz not null default now(),
  constraint raio_x_dismissals_unique unique (user_id, materia, conteudo)
);

alter table public.raio_x_dismissals enable row level security;
create index raio_x_dismissals_user_idx on public.raio_x_dismissals(user_id);

create policy "raio_x_dismissals_select_own" on public.raio_x_dismissals
  for select using (auth.uid() = user_id);
create policy "raio_x_dismissals_insert_own" on public.raio_x_dismissals
  for insert with check (auth.uid() = user_id);
create policy "raio_x_dismissals_update_own" on public.raio_x_dismissals
  for update using (auth.uid() = user_id);
create policy "raio_x_dismissals_delete_own" on public.raio_x_dismissals
  for delete using (auth.uid() = user_id);
