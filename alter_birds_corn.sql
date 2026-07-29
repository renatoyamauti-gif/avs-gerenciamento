-- Migration: Adicionar colunas de milho na tabela de aves
ALTER TABLE public.birds ADD COLUMN IF NOT EXISTS corn_daily_grams NUMERIC DEFAULT 0;
ALTER TABLE public.birds ADD COLUMN IF NOT EXISTS corn_price_per_kg NUMERIC DEFAULT 0;

-- Recarregar o cache de esquemas do Supabase/PostgREST
NOTIFY pgrst, 'reload schema';
