-- Script SQL para configurar o sistema de moderação do Chat.
-- Execute este script no SQL Editor do seu painel do Supabase.

-- 1. Adiciona coluna para identificar se o usuário é moderador
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_moderator BOOLEAN DEFAULT false;

-- 2. Adiciona coluna para bloquear o usuário do chat
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS chat_blocked BOOLEAN DEFAULT false;

-- 3. Adiciona coluna para armazenar mensagens de advertência ativas
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS warning_message TEXT DEFAULT null;

-- 4. EXEMPLO: Definir um usuário específico como moderador para testes
-- Substitua o ID pelo ID do seu usuário de teste que pode ser visto no painel de Auth.
-- UPDATE profiles SET is_moderator = true WHERE id = 'SEU_USER_ID_AQUI';
