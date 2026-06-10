-- Adicionar colunas para suporte a Pedidos por Baia ou Raça
ALTER TABLE orders ADD COLUMN IF NOT EXISTS baia TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS origem_type TEXT DEFAULT 'raca';
