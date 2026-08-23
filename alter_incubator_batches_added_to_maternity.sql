-- Script SQL para adicionar coluna added_to_maternity na tabela incubator_batches
ALTER TABLE incubator_batches ADD COLUMN IF NOT EXISTS added_to_maternity BOOLEAN DEFAULT FALSE;
