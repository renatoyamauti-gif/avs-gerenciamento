-- Adicionar a coluna 'condition' na tabela 'egg_logs' caso não exista
ALTER TABLE egg_logs ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'Normal';
