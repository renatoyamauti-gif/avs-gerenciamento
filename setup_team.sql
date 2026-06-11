-- 1. Adicionar colunas de equipe à tabela de perfis (profiles)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS parent_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'tratador'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"birds": true, "breeding": true, "maternity": true, "eggs": true, "ration": true, "shipping": false, "finance": false, "chat": true}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Criar função SQL para obter o ID do usuário efetivo (dono)
CREATE OR REPLACE FUNCTION public.get_effective_user_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (SELECT parent_user_id FROM public.profiles WHERE id = auth.uid()),
    auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Criar função SQL para verificar o acesso ao perfil sem recursão infinita
CREATE OR REPLACE FUNCTION public.check_profile_access(target_profile_id UUID, target_parent_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_parent UUID;
BEGIN
  -- 1. Se o perfil de destino for o próprio usuário logado, permite
  IF target_profile_id = auth.uid() THEN
    RETURN TRUE;
  END IF;
  
  -- 2. Se o perfil de destino for um filho do usuário logado (dono), permite
  IF target_parent_id = auth.uid() THEN
    RETURN TRUE;
  END IF;
  
  -- 3. Obter o parent_user_id do usuário logado
  SELECT parent_user_id INTO current_user_parent
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- 4. Se o usuário logado for filho, permite ver o pai (dono) ou outros filhos do mesmo pai (colegas de equipe)
  IF current_user_parent IS NOT NULL AND (target_profile_id = current_user_parent OR target_parent_id = current_user_parent) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Habilitar RLS e configurar políticas para todas as tabelas transacionais

-- Tabela: birds
ALTER TABLE birds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own birds" ON birds;
CREATE POLICY "Users can manage their own birds" ON birds FOR ALL 
  USING (user_id = public.get_effective_user_id()) 
  WITH CHECK (user_id = public.get_effective_user_id());

-- Tabela: bird_history
ALTER TABLE bird_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own bird_history" ON bird_history;
CREATE POLICY "Users can manage their own bird_history" ON bird_history FOR ALL 
  USING (user_id = public.get_effective_user_id()) 
  WITH CHECK (user_id = public.get_effective_user_id());

-- Tabela: baia_history
ALTER TABLE baia_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own baia_history" ON baia_history;
CREATE POLICY "Users can manage their own baia_history" ON baia_history FOR ALL 
  USING (user_id = public.get_effective_user_id()) 
  WITH CHECK (user_id = public.get_effective_user_id());

-- Tabela: baias
ALTER TABLE baias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own baias" ON baias;
CREATE POLICY "Users can manage their own baias" ON baias FOR ALL 
  USING (user_id = public.get_effective_user_id()) 
  WITH CHECK (user_id = public.get_effective_user_id());

-- Tabela: racas
ALTER TABLE racas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own racas" ON racas;
CREATE POLICY "Users can manage their own racas" ON racas FOR ALL 
  USING (user_id = public.get_effective_user_id()) 
  WITH CHECK (user_id = public.get_effective_user_id());

-- Tabela: transaction_categories
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own transaction categories" ON transaction_categories;
CREATE POLICY "Users can manage their own transaction categories" ON transaction_categories FOR ALL 
  USING (user_id = public.get_effective_user_id()) 
  WITH CHECK (user_id = public.get_effective_user_id());

-- Tabela: rations
ALTER TABLE rations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own rations" ON rations;
CREATE POLICY "Users can manage their own rations" ON rations FOR ALL 
  USING (user_id = public.get_effective_user_id()) 
  WITH CHECK (user_id = public.get_effective_user_id());

-- Tabela: ingredients
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own ingredients" ON ingredients;
CREATE POLICY "Users can manage their own ingredients" ON ingredients FOR ALL 
  USING (user_id = public.get_effective_user_id()) 
  WITH CHECK (user_id = public.get_effective_user_id());

-- Tabela: transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own transactions" ON transactions;
CREATE POLICY "Users can manage their own transactions" ON transactions FOR ALL 
  USING (user_id = public.get_effective_user_id()) 
  WITH CHECK (user_id = public.get_effective_user_id());

-- Tabela: egg_logs
ALTER TABLE egg_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own egg_logs" ON egg_logs;
CREATE POLICY "Users can manage their own egg_logs" ON egg_logs FOR ALL 
  USING (user_id = public.get_effective_user_id()) 
  WITH CHECK (user_id = public.get_effective_user_id());

-- Tabela: incubators
ALTER TABLE incubators ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own incubators" ON incubators;
CREATE POLICY "Users can manage their own incubators" ON incubators FOR ALL 
  USING (user_id = public.get_effective_user_id()) 
  WITH CHECK (user_id = public.get_effective_user_id());

-- Tabela: incubator_batches
ALTER TABLE incubator_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own incubator_batches" ON incubator_batches;
CREATE POLICY "Users can manage their own incubator_batches" ON incubator_batches FOR ALL 
  USING (user_id = public.get_effective_user_id()) 
  WITH CHECK (user_id = public.get_effective_user_id());

-- Tabela: maternity
ALTER TABLE maternity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own maternity" ON maternity;
CREATE POLICY "Users can manage their own maternity" ON maternity FOR ALL 
  USING (user_id = public.get_effective_user_id()) 
  WITH CHECK (user_id = public.get_effective_user_id());

-- Tabela: maternity_history
ALTER TABLE maternity_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own maternity_history" ON maternity_history;
CREATE POLICY "Users can manage their own maternity_history" ON maternity_history FOR ALL 
  USING (user_id = public.get_effective_user_id()) 
  WITH CHECK (user_id = public.get_effective_user_id());


-- Tabela: clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own clients" ON clients;
CREATE POLICY "Users can manage their own clients" ON clients FOR ALL 
  USING (user_id = public.get_effective_user_id()) 
  WITH CHECK (user_id = public.get_effective_user_id());

-- Tabela: orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own orders" ON orders;
CREATE POLICY "Users can manage their own orders" ON orders FOR ALL 
  USING (user_id = public.get_effective_user_id()) 
  WITH CHECK (user_id = public.get_effective_user_id());

-- 4. Recriar RLS para profiles permitindo acesso de leitura/gravação na equipe
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Allow select profiles within team" ON profiles;
DROP POLICY IF EXISTS "Allow update profiles within team" ON profiles;
DROP POLICY IF EXISTS "Allow insert profiles" ON profiles;

CREATE POLICY "Allow select profiles within team" ON profiles FOR SELECT
  USING (public.check_profile_access(id, parent_user_id));

CREATE POLICY "Allow update profiles within team" ON profiles FOR UPDATE
  USING (public.check_profile_access(id, parent_user_id));

CREATE POLICY "Allow insert profiles" ON profiles FOR INSERT
  WITH CHECK (public.check_profile_access(id, parent_user_id));

CREATE POLICY "Allow delete profiles within team" ON profiles FOR DELETE
  USING (public.check_profile_access(id, parent_user_id));
