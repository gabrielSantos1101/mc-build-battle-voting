-- ============================================================
-- Migration: nome do jogador (nome real) em competitors
-- Coluna nullable de propósito: registros já cadastrados
-- continuam válidos sem o nome preenchido.
-- ============================================================

alter table public.competitors add column if not exists player_name text null;

comment on column public.competitors.player_name is
  'Nome real do jogador (usado só para identificação no admin e no relatório exportado). Opcional.';
