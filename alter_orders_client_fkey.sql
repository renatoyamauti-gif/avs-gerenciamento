-- 1. Garantir que a tabela orders possua chave estrangeira para clients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_client_id_fkey'
  ) THEN
    ALTER TABLE orders
    ADD CONSTRAINT orders_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Recarregar o cache de esquemas do Supabase/PostgREST
NOTIFY pgrst, 'reload schema';
