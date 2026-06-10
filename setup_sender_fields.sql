-- Adicionar colunas do Melhor Envio e Dados do Remetente à tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS melhor_envio_token TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS origin_postal_code TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS melhor_envio_sandbox BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sender_name TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sender_cpf TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sender_phone TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sender_email TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sender_address TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sender_number TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sender_district TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sender_city TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sender_state TEXT DEFAULT '';
