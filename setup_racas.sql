-- 1. Renomear a coluna 'species' para 'raca' na tabela 'birds' (se ainda existir species)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'birds' AND column_name = 'species'
  ) THEN
    ALTER TABLE birds RENAME COLUMN species TO raca;
  END IF;
END $$;

-- 2. Renomear a coluna 'species' para 'raca' na tabela 'maternity' (se ainda existir species)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'maternity' AND column_name = 'species'
  ) THEN
    ALTER TABLE maternity RENAME COLUMN species TO raca;
  END IF;
END $$;

-- 3. Criar a tabela 'racas' para gerenciar o cadastro de raças
CREATE TABLE IF NOT EXISTS public.racas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  egg_stock_adjustment INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 4. Habilitar RLS (Row Level Security) na tabela 'racas'
ALTER TABLE public.racas ENABLE ROW LEVEL SECURITY;

-- 5. Criar política de segurança RLS estrita por criatório/equipe
DROP POLICY IF EXISTS "Users can manage their own racas" ON public.racas;
DROP POLICY IF EXISTS "Allow authenticated users to manage racas" ON public.racas;

CREATE OR REPLACE FUNCTION public.get_effective_user_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (SELECT parent_user_id FROM public.profiles WHERE id = auth.uid()),
    auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "Users can manage their own racas" ON public.racas
  FOR ALL
  USING (user_id = public.get_effective_user_id())
  WITH CHECK (user_id = public.get_effective_user_id());

-- 6. Recarregar o cache de schema do PostgREST
NOTIFY pgrst, 'reload schema';
