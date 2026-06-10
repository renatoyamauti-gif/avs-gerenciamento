-- 1. Adicionar colunas para múltiplos itens, baia e origem na tabela de pedidos (orders)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS baia TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS origem_type TEXT DEFAULT 'raca';

-- 2. Recarregar o cache de esquemas do Supabase/PostgREST
NOTIFY pgrst, 'reload schema';
