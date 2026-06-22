-- 1. Otimizar a função SQL para obter o ID do usuário efetivo (dono)
-- Ela agora prioriza a leitura do claim do JWT na memória (auth.jwt()), evitando consultas à tabela 'profiles' em consultas normais do app.
-- Além disso, foi marcada como STABLE para que o PostgreSQL a execute apenas uma vez por consulta em vez de uma vez por linha.
CREATE OR REPLACE FUNCTION public.get_effective_user_id()
RETURNS UUID AS $$
DECLARE
  jwt_parent_id TEXT;
BEGIN
  -- Tenta obter o parent_user_id do JWT claims (rápido e em memória)
  jwt_parent_id := auth.jwt() -> 'user_metadata' ->> 'parent_user_id';
  IF jwt_parent_id IS NOT NULL AND jwt_parent_id <> '' THEN
    RETURN jwt_parent_id::UUID;
  END IF;
  
  -- Fallback seguro: consulta física (para scripts, triggers ou service_role)
  RETURN COALESCE(
    (SELECT parent_user_id FROM public.profiles WHERE id = auth.uid()),
    auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- 2. Otimizar a função de verificação de acesso ao perfil (check_profile_access)
-- Também lê o JWT para evitar consultas recursivas na tabela 'profiles', prevenindo lentidão extrema e recursão infinita de políticas.
-- Marcada como STABLE para cache de consulta.
CREATE OR REPLACE FUNCTION public.check_profile_access(target_profile_id UUID, target_parent_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_parent TEXT;
BEGIN
  -- 1. Se o perfil de destino for o próprio usuário logado, permite imediatamente
  IF target_profile_id = auth.uid() THEN
    RETURN TRUE;
  END IF;
  
  -- 2. Se o perfil de destino for um filho do usuário logado (dono), permite
  IF target_parent_id = auth.uid() THEN
    RETURN TRUE;
  END IF;
  
  -- 3. Tenta obter o parent_user_id do usuário logado através do JWT (rápido e sem recursão)
  current_user_parent := auth.jwt() -> 'user_metadata' ->> 'parent_user_id';
  
  -- 4. Se o usuário logado for filho (tratador), permite ver o pai (dono) ou colegas de equipe (mesmo pai)
  IF current_user_parent IS NOT NULL AND current_user_parent <> '' THEN
    IF target_profile_id = current_user_parent::UUID OR target_parent_id = current_user_parent::UUID THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  -- 5. Fallback seguro: consulta a tabela profiles física se o JWT não contiver as informações
  BEGIN
    SELECT parent_user_id INTO current_user_parent
    FROM public.profiles
    WHERE id = auth.uid();
    
    IF current_user_parent IS NOT NULL THEN
      IF target_profile_id = current_user_parent::UUID OR target_parent_id = current_user_parent::UUID THEN
        RETURN TRUE;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Previne erro de recursão no fallback
    RETURN FALSE;
  END;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Notificar o PostgREST para recarregar o schema cache
NOTIFY pgrst, 'reload schema';
