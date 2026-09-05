-- ==============================================================================
-- CORREÇÃO DEFINITIVA DE ISOLAMENTO E RLS PARA A TABELA 'racas'
-- Execute este script no SQL Editor do seu painel Supabase
-- ==============================================================================

-- 1. Garante que a tabela 'racas' exista com as colunas necessárias
CREATE TABLE IF NOT EXISTS public.racas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  egg_stock_adjustment INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.racas ADD COLUMN IF NOT EXISTS egg_stock_adjustment INTEGER DEFAULT 0;

-- 2. Habilita RLS na tabela 'racas'
ALTER TABLE public.racas ENABLE ROW LEVEL SECURITY;

-- 3. Remove políticas anteriores que permitiam acesso amplo ou causavam conflito
DROP POLICY IF EXISTS "Allow authenticated users to manage racas" ON public.racas;
DROP POLICY IF EXISTS "Users can manage their own racas" ON public.racas;
DROP POLICY IF EXISTS "Allow select racas" ON public.racas;
DROP POLICY IF EXISTS "Allow insert racas" ON public.racas;
DROP POLICY IF EXISTS "Allow update racas" ON public.racas;
DROP POLICY IF EXISTS "Allow delete racas" ON public.racas;

-- 4. Garante a função de segurança get_effective_user_id
CREATE OR REPLACE FUNCTION public.get_effective_user_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (SELECT parent_user_id FROM public.profiles WHERE id = auth.uid()),
    auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 5. Criação da política RLS com ISOLAMENTO TOTAL por criatório/usuário
-- Cada criatório/usuário só tem acesso às suas próprias raças
CREATE POLICY "Users can manage their own racas" ON public.racas
  FOR ALL
  USING (user_id = public.get_effective_user_id())
  WITH CHECK (user_id = public.get_effective_user_id());

-- 6. Recarregar o cache de schema do PostgREST
NOTIFY pgrst, 'reload schema';
