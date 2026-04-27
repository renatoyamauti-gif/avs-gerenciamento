import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.1.1?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  
  if (!signature) {
    return new Response("Missing Stripe-Signature header", { status: 400 });
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  try {
    const body = await req.text();
    let event;

    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        cryptoProvider
      );
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Processa quando um pagamento é concluído com sucesso
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const clientReferenceId = session.client_reference_id;
      
      // Lógica simples: se o valor foi mais de 400 reais (40000 centavos), consideramos Anual
      let planName = 'pro';
      if (session.amount_total && session.amount_total > 40000) { 
         planName = 'anual';
      }

      if (clientReferenceId) {
        // Inicializa o cliente do Supabase com Service Role (para ter permissão de atualizar)
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        // Atualiza a tabela profiles do usuário que fez o pagamento
        const { error } = await supabase
          .from('profiles')
          .update({ plan: planName, stripe_customer_id: session.customer as string })
          .eq('id', clientReferenceId);

        if (error) {
          console.error(`Erro ao atualizar perfil do usuário: ${error.message}`);
          throw new Error('Falha ao atualizar plano do usuário');
        }
        
        console.log(`Usuário ${clientReferenceId} atualizado com sucesso para o plano ${planName}`);
      } else {
        console.log('Nenhum client_reference_id encontrado na sessão do Stripe.');
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });

  } catch (err: any) {
    console.error(`Erro processando webhook: ${err.message}`);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400 }
    );
  }
});
