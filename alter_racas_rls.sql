-- ==============================================================================
-- CORREÇÃO DEFINITIVA DE POLÍTICA RLS PARA A TABELA 'racas'
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

-- 2. Garante a coluna de ajuste de estoque de ovos
ALTER TABLE public.racas ADD COLUMN IF NOT EXISTS egg_stock_adjustment INTEGER DEFAULT 0;

-- 3. Habilita RLS na tabela 'racas'
ALTER TABLE public.racas ENABLE ROW LEVEL SECURITY;

-- 4. Remove políticas anteriores conflitantes
DROP POLICY IF EXISTS "Users can manage their own racas" ON public.racas;
DROP POLICY IF EXISTS "Allow select racas" ON public.racas;
DROP POLICY IF EXISTS "Allow insert racas" ON public.racas;
DROP POLICY IF EXISTS "Allow update racas" ON public.racas;
DROP POLICY IF EXISTS "Allow delete racas" ON public.racas;
DROP POLICY IF EXISTS "Allow authenticated users to manage racas" ON public.racas;

-- 5. Criação da política permissiva e segura para todos os usuários autenticados
-- Permite que donos e membros de equipe (tratadores) salvem e consultem raças sem bloqueio
CREATE POLICY "Allow authenticated users to manage racas" ON public.racas
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Recarregar o cache de schema do PostgREST
NOTIFY pgrst, 'reload schema';
