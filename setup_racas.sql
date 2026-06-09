-- 1. Renomear a coluna 'species' para 'raca' na tabela 'birds'
ALTER TABLE birds RENAME COLUMN species TO raca;

-- 2. Renomear a coluna 'species' para 'raca' na tabela 'maternity'
ALTER TABLE maternity RENAME COLUMN species TO raca;

-- 3. Criar a tabela 'racas' para gerenciar o cadastro de raças
CREATE TABLE IF NOT EXISTS racas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 4. Habilitar RLS (Row Level Security) na tabela 'racas'
ALTER TABLE racas ENABLE ROW LEVEL SECURITY;

-- 5. Criar política de segurança RLS para a tabela 'racas'
CREATE POLICY "Users can manage their own racas"
ON racas FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
