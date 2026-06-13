-- Script para adicionar colunas de associação de ovos na tabela de produtos
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS egg_raca TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS egg_baia TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eggs_per_unit INTEGER DEFAULT 0;

-- Recarregar o cache de esquemas do Supabase/PostgREST
NOTIFY pgrst, 'reload schema';
