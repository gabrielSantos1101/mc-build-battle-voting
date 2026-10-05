-- ============================================================
-- Migration: competitors.skin_url estava no schema.sql mas nunca
-- foi aplicada no projeto hospedado (drift entre repo e banco).
-- Sem essa coluna o insert de competidor, o update no modal de
-- edição e o botão "Popular Skins" (.is('skin_url', null)) falham
-- com "column skin_url of relation competitors does not exist".
-- Idempotente: seguro rodar em bancos onde a coluna já existe.
-- ============================================================

alter table public.competitors add column if not exists skin_url text;

comment on column public.competitors.skin_url is
  'URL da skin do Minecraft (PNG do Mojang). Preenchida pela edge function get-skin.';
