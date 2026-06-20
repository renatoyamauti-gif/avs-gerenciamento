-- Migration: Adicionar coluna de complemento na tabela de clientes
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS complemento TEXT;

-- Recarregar o cache de esquemas do Supabase/PostgREST
NOTIFY pgrst, 'reload schema';
