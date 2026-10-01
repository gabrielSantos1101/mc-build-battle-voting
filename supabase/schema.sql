-- ============================================================
-- Build Battle: Halloween Edition - Schema Supabase
-- Cole e execute este SQL no "SQL Editor" do seu painel Supabase
-- ============================================================

-- 1. Tabela de Rodadas de votação
create table if not exists public.rounds (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Tema: Halloween Build Battle',
  status text not null default 'draft', -- draft | active | paused | finished
  show_live_results boolean not null default true,
  countdown_seconds integer null,
  starts_at timestamptz null, -- Timestamp exato de início da votação
  ends_at timestamptz null, -- Timestamp exato de encerramento da rodada
  created_at timestamptz not null default now()
);

-- Garantir colunas de tempo caso a tabela já exista
alter table public.rounds add column if not exists starts_at timestamptz null;
alter table public.rounds add column if not exists ends_at timestamptz null;

-- 2. Tabela de Competidores da rodada
create table if not exists public.competitors (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds(id) on delete cascade,
  player_nick text not null,
  image_url text not null,
  -- Temas: 'jack-pumpkin' | 'warden-sculk' | 'pale-garden' | 'wither' | 'ender-dragon'
  frame_theme text not null default 'jack-pumpkin',
  created_at timestamptz not null default now()
);

-- 3. Tabela de Votos (1 voto por device_id por rodada garantido pelo banco + IP tracking)
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds(id) on delete cascade,
  competitor_id uuid not null references public.competitors(id) on delete cascade,
  device_id text not null,
  ip text not null,
  country text,
  region text,
  city text,
  created_at timestamptz not null default now(),
  constraint unique_vote_per_device_round unique (round_id, device_id),
  constraint unique_vote_per_ip_round unique (round_id, ip)
);

-- Garantir colunas de IP caso a tabela já exista
alter table public.votes add column if not exists ip text;
alter table public.votes add column if not exists country text;
alter table public.votes add column if not exists region text;
alter table public.votes add column if not exists city text;

-- Adicionar constraint única para IP por rodada (se não existir)
do $$
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'unique_vote_per_ip_round' 
    and conrelid = 'public.votes'::regclass
  ) then
    alter table public.votes add constraint unique_vote_per_ip_round unique (round_id, ip);
  end if;
end $$;

-- ============================================================
-- Habilitar Realtime nas tabelas
-- ============================================================
alter publication supabase_realtime add table public.rounds;
alter publication supabase_realtime add table public.competitors;
alter publication supabase_realtime add table public.votes;

-- ============================================================
-- Storage: Criar Bucket público 'builds' para as fotos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('builds', 'builds', true)
on conflict (id) do update set public = true;

-- ============================================================
-- Políticas de Acesso (RLS) - Permite o app operar com a anon key
-- ============================================================
alter table public.rounds enable row level security;
alter table public.competitors enable row level security;
alter table public.votes enable row level security;

-- Rounds: leitura e escrita permitidas
create policy "Acesso livre rounds" on public.rounds for all using (true) with check (true);

-- Competitors: leitura e escrita permitidas
create policy "Acesso livre competitors" on public.competitors for all using (true) with check (true);

-- Votes: leitura e inserção/deleção permitidas (a constraint UNIQUE impede votos duplicados)
create policy "Acesso livre votes" on public.votes for all using (true) with check (true);

-- Storage (Bucket 'builds'): leitura e upload livres
create policy "Leitura pública storage builds" on storage.objects for select using (bucket_id = 'builds');
create policy "Upload público storage builds" on storage.objects for insert with check (bucket_id = 'builds');
create policy "Update público storage builds" on storage.objects for update using (bucket_id = 'builds');
create policy "Delete público storage builds" on storage.objects for delete using (bucket_id = 'builds');
