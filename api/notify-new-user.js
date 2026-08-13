/**
 * Vercel Serverless Function: notify-new-user
 * 
 * Este endpoint recebe um webhook do Supabase toda vez que um novo registro 
 * é inserido na tabela 'profiles' (novos usuários/tratadores cadastrados) e 
 * envia um e-mail de notificação para o administrador através do Resend.
 */

export default async function handler(req, res) {
  // Apenas permitir requisições POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;
  const webhookSecret = process.env.WEBHOOK_SECRET;

  // Validação das variáveis de ambiente críticas
  if (!resendApiKey || !adminEmail) {
    console.error('Erro de Configuração: Variáveis RESEND_API_KEY ou ADMIN_EMAIL não configuradas.');
    return res.status(500).json({ error: 'Configuração do servidor incompleta.' });
  }

  // Validação de Segurança (se a secret estiver configurada na Vercel)
  if (webhookSecret) {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${webhookSecret}`) {
      console.warn('Tentativa de acesso não autorizada ao webhook.');
      return res.status(401).json({ error: 'Não autorizado. Token de webhook inválido.' });
    }
  } else {
    console.warn('Aviso: WEBHOOK_SECRET não está configurado. O endpoint está desprotegido.');
  }

  try {
    const payload = req.body;
    
    // Log do payload recebido para facilitar depuração no painel da Vercel
    console.log('Webhook do Supabase recebido:', JSON.stringify(payload, null, 2));

    const { type, table, record } = payload;

    // Verificar se o evento é uma inserção na tabela profiles
    if (type !== 'INSERT' || table !== 'profiles') {
      return res.status(400).json({ error: 'Payload inválido. Esperado INSERT na tabela profiles.' });
    }

    const { full_name, email, criatorio_name, role, created_at } = record;

    // Formatando a data para exibição
    const dataCadastro = created_at 
      ? new Date(created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) 
      : new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    // Definindo o assunto de acordo com o cargo (admin ou tratador)
    const labelCargo = role === 'tratador' ? 'Tratador (Equipe)' : 'Administrador (Dono)';
    const subject = `AVS Gerenciamento - Novo Cadastro: ${full_name || 'Usuário'}`;

    // Construção do corpo do e-mail com layout limpo e profissional
    const emailBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 30px; color: #1e293b; max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 25px;">
          <span style="font-size: 24px; font-weight: 800; letter-spacing: 0.05em; color: #2563eb;">AVS<span style="color: #64748b; font-weight: 400; margin-left: 5px;">GERENCIAMENTO</span></span>
        </div>
        
        <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 10px; text-align: center;">Novo Usuário Registrado!</h2>
        <p style="font-size: 14px; color: #64748b; text-align: center; margin-bottom: 25px; line-height: 1.5;">
          Um novo cadastro foi efetuado no sistema e sincronizado com o banco de dados.
        </p>
        
        <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 16px; padding: 20px; margin-bottom: 25px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #64748b; width: 140px; border-bottom: 1px solid #f1f5f9;">Nome:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600; border-bottom: 1px solid #f1f5f9;">${full_name || 'Não informado'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #64748b; border-bottom: 1px solid #f1f5f9;">E-mail:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600; border-bottom: 1px solid #f1f5f9;">${email || 'Não informado'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #64748b; border-bottom: 1px solid #f1f5f9;">Criatório:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600; border-bottom: 1px solid #f1f5f9;">${criatorio_name || 'Não cadastrado'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #64748b; border-bottom: 1px solid #f1f5f9;">Tipo de Conta:</td>
              <td style="padding: 8px 0; color: #2563eb; font-weight: 700; border-bottom: 1px solid #f1f5f9; text-transform: uppercase; font-size: 12px;">${labelCargo}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Cadastrado em:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${dataCadastro}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; font-size: 11px; color: #94a3b8; border-t: 1px solid #e2e8f0; padding-top: 20px; margin-top: 25px;">
          Este é um e-mail de notificação de segurança do sistema AVS Gerenciamento.
        </div>
      </div>
    `;

    // Disparar o e-mail usando a API oficial do Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'AVS Gerenciamento <onboarding@resend.dev>', // Usado o remetente de teste padrão do Resend
        to: adminEmail,
        subject: subject,
        html: emailBody
      })
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Erro retornado pela API do Resend:', resendData);
      return res.status(resendResponse.status).json({
        error: 'Erro ao enviar e-mail via Resend.',
        details: resendData
      });
    }

    console.log('Notificação enviada com sucesso pelo Resend:', resendData.id);
    return res.status(200).json({ success: true, message: 'Notificação enviada.', id: resendData.id });

  } catch (error) {
    console.error('Erro na execução do Webhook:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.', message: error.message });
  }
}
