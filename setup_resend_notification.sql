-- ====================================================================
-- Script: Configuração de Notificação de Novo Usuário via Resend (Corrigido)
-- ====================================================================
-- 
-- Instruções:
-- 1. Abra o painel do Supabase do seu projeto.
-- 2. Vá em "SQL Editor" e clique em "New query".
-- 3. Copie todo o conteúdo deste arquivo e cole lá.
-- 4. Clique em "Run" (Executar).
-- ====================================================================

-- 1. Ativar a extensão pg_net (permite requisições HTTP assíncronas do banco de dados)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Criar ou atualizar a função de disparo de e-mail (usando argumentos posicionais para ampla compatibilidade de versão)
CREATE OR REPLACE FUNCTION public.notify_new_user_via_resend()
RETURNS TRIGGER AS $$
DECLARE
  -- ==================================================================
  -- SEUS DADOS DO RESEND:
  -- ==================================================================
  resend_api_key TEXT := 're_INSIRA_SUA_API_KEY_DO_RESEND'; -- Sua API Key do Resend
  admin_email TEXT := 'SEU_EMAIL_AQUI'; -- E-mail de destino configurado pelo usuário
  -- ==================================================================
  
  email_body TEXT;
BEGIN
  -- Validação de segurança básica para evitar envios com valores padrão
  IF resend_api_key = 're_INSIRA_SUA_API_KEY_DO_RESEND' OR admin_email = 'SEU_EMAIL_AQUI' THEN
    RAISE WARNING 'Resend não configurado no banco de dados. Atualize a API Key e o E-mail.';
    RETURN NEW;
  END IF;

  -- Ignorar cadastros de equipe (tratadores). Notificar apenas novos administradores da plataforma.
  IF COALESCE(NEW.role, 'admin') = 'tratador' THEN
    RETURN NEW;
  END IF;

  -- Montagem do corpo HTML do e-mail
  email_body := '<div style="font-family: sans-serif; padding: 25px; color: #1e293b; max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">' ||
                '  <div style="text-align: center; margin-bottom: 20px;">' ||
                '    <span style="font-size: 20px; font-weight: 850; color: #2563eb; letter-spacing: 0.05em;">AVS GERENCIAMENTO</span>' ||
                '  </div>' ||
                '  <h2 style="color: #0f172a; font-size: 18px; margin-top: 0; text-align: center; font-weight: 700;">Novo Usuário Cadastrado!</h2>' ||
                '  <p style="font-size: 14px; color: #64748b; text-align: center; margin-bottom: 20px;">Um novo cadastro de usuário foi efetuado na plataforma.</p>' ||
                '  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />' ||
                '  <table style="width: 100%; font-size: 14px; border-collapse: collapse; line-height: 1.6;">' ||
                '    <tr>' ||
                '      <td style="padding: 6px 0; font-weight: bold; color: #64748b; width: 120px; border-bottom: 1px solid #f1f5f9;">Nome:</td>' ||
                '      <td style="padding: 6px 0; color: #0f172a; font-weight: 600; border-bottom: 1px solid #f1f5f9;">' || COALESCE(NEW.full_name, 'Não informado') || '</td>' ||
                '    </tr>' ||
                '    <tr>' ||
                '      <td style="padding: 6px 0; font-weight: bold; color: #64748b; border-bottom: 1px solid #f1f5f9;">E-mail:</td>' ||
                '      <td style="padding: 6px 0; color: #0f172a; font-weight: 600; border-bottom: 1px solid #f1f5f9;">' || COALESCE(NEW.email, 'Não informado') || '</td>' ||
                '    </tr>' ||
                '    <tr>' ||
                '      <td style="padding: 6px 0; font-weight: bold; color: #64748b; border-bottom: 1px solid #f1f5f9;">Criatório:</td>' ||
                '      <td style="padding: 6px 0; color: #0f172a; font-weight: 600; border-bottom: 1px solid #f1f5f9;">' || COALESCE(NEW.criatorio_name, 'Não cadastrado') || '</td>' ||
                '    </tr>' ||
                '    <tr>' ||
                '      <td style="padding: 6px 0; font-weight: bold; color: #64748b; border-bottom: 1px solid #f1f5f9;">Cargo:</td>' ||
                '      <td style="padding: 6px 0; color: #2563eb; font-weight: 700; text-transform: uppercase; font-size: 12px; border-bottom: 1px solid #f1f5f9;">' || COALESCE(NEW.role, 'admin') || '</td>' ||
                '    </tr>' ||
                '    <tr>' ||
                '      <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Cadastrado em:</td>' ||
                '      <td style="padding: 6px 0; color: #0f172a;">' || to_char(timezone('America/Sao_Paulo', now()), 'DD/MM/YYYY HH24:MI:SS') || '</td>' ||
                '    </tr>' ||
                '  </table>' ||
                '  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />' ||
                '  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">E-mail automático enviado pelo sistema de monitoramento de banco de dados.</p>' ||
                '</div>';

  -- Fazer a chamada HTTP POST assíncrona para a API do Resend usando argumentos posicionais (compatível com todas as versões de pg_net)
  PERFORM net.http_post(
    'https://api.resend.com/emails'::text,
    jsonb_build_object(
      'from', 'AVS Gerenciamento <onboarding@resend.dev>',
      'to', admin_email,
      'subject', 'AVS Gerenciamento - Novo Cadastro: ' || COALESCE(NEW.full_name, 'Usuário'),
      'html', email_body
    ),
    '{}'::jsonb,
    jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || resend_api_key
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar ou recriar o Trigger associado à tabela profiles
DROP TRIGGER IF EXISTS trigger_notify_new_user ON public.profiles;
CREATE TRIGGER trigger_notify_new_user
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_user_via_resend();
