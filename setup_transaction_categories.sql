-- Criar a tabela 'transaction_categories' para gerenciar as categorias do financeiro
CREATE TABLE IF NOT EXISTS transaction_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Entrada', 'Saída')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  UNIQUE (user_id, name, type)
);

-- Habilitar RLS (Row Level Security) na tabela
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;

-- Criar política de segurança RLS para a tabela
DROP POLICY IF EXISTS "Users can manage their own transaction categories" ON transaction_categories;
CREATE POLICY "Users can manage their own transaction categories"
ON transaction_categories FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
