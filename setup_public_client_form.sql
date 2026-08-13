-- 1. Adicionar coluna shipping_terms na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shipping_terms TEXT DEFAULT '';

-- 2. Adicionar colunas de aceite de termos na tabela de clientes
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ DEFAULT null;

-- 3. Criar função segura (SECURITY DEFINER) para retornar dados públicos do criatório sem expor informações sensíveis
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id UUID)
RETURNS TABLE (
  id UUID,
  criatorio_name TEXT,
  shipping_terms TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.criatorio_name, p.shipping_terms
  FROM public.profiles p
  WHERE p.id = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Habilitar política de inserção pública na tabela de clientes com validação do criador
DROP POLICY IF EXISTS "Allow public insert of clients" ON public.clients;
CREATE POLICY "Allow public insert of clients" ON public.clients FOR INSERT
  WITH CHECK (
    user_id IS NOT NULL AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = clients.user_id)
  );
