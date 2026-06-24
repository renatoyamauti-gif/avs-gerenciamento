-- SQL para adicionar suporte a ajuste manual de estoque
-- Execute este script no SQL Editor do seu painel Supabase.

-- 1. Adicionar a coluna egg_stock_adjustment na tabela 'racas'
ALTER TABLE public.racas ADD COLUMN IF NOT EXISTS egg_stock_adjustment INTEGER DEFAULT 0;

-- 2. Adicionar a coluna egg_stock_adjustment na tabela 'baias'
ALTER TABLE public.baias ADD COLUMN IF NOT EXISTS egg_stock_adjustment INTEGER DEFAULT 0;

-- 3. Notificar o PostgREST para recarregar o cache do schema
NOTIFY pgrst, 'reload schema';
