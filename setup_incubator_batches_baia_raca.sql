-- Adiciona colunas para armazenar detalhes de baias e raças em lotes de incubação
ALTER TABLE incubator_batches ADD COLUMN IF NOT EXISTS baia_details JSONB DEFAULT '{}'::jsonb;
ALTER TABLE incubator_batches ADD COLUMN IF NOT EXISTS raca_details JSONB DEFAULT '{}'::jsonb;
