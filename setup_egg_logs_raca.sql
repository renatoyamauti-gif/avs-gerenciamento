-- Adicionar a coluna 'raca' na tabela 'egg_logs' caso não exista
ALTER TABLE egg_logs ADD COLUMN IF NOT EXISTS raca TEXT;
