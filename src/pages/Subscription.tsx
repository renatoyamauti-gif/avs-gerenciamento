import React, { useState, useEffect } from 'react';
import { Check, Zap, Shield, Star, CreditCard, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabaseClient';
import { useSubscription } from '../hooks/useSubscription';

const plans = [
  {
    id: 'free',
    name: 'Teste Grátis',
    description: '30 dias de teste grátis com acesso total a todas as ferramentas.',
    price: 'Grátis',
    period: '/30 dias',
    features: [
      'Aves ilimitadas',
      'Múltiplas chocadeiras e lotes',
      'Análises financeiras avançadas',
      'Alertas de eclosão via e-mail',
      'Custos de alimentação',
      'Exportação de relatórios',
      'Módulo de Remessas (Melhor Envio)'
    ],
    buttonText: 'Plano Atual',
    isPopular: false,
    icon: <Star size={24} className="text-slate-400" />,
    gradient: 'from-slate-100 to-slate-50',
    link: '#',
  },
  {
    id: 'pro',
    name: 'Completo Mensal',
    description: 'Para criadores experientes que precisam de ferramentas avançadas.',
    originalPrice: 'R$ 59,99',
    price: 'R$ 39,99',
    period: '/mês',
    features: [
      'Aves ilimitadas',
      'Múltiplas chocadeiras e lotes',
      'Análises financeiras avançadas',
      'Alertas de eclosão via e-mail',
      'Custos de alimentação',
      'Exportação de relatórios',
      'Módulo de Remessas (Melhor Envio)',
      'Chat Exclusivo'
    ],
    buttonText: 'Assine Mensal',
    isPopular: true,
    icon: <Zap size={24} className="text-[#F59E0B]" />,
    gradient: 'from-[#FEF3C7] to-[#FFFBEB]',
    border: 'border-[#FCD34D]',
    link: 'https://buy.stripe.com/14A14m5g1feJac5c3t4Rq00',
  },
  {
    id: 'trimestral',
    name: 'Completo Trimestral',
    description: 'Plano Trimestral com 44% de desconto.',
    originalPrice: 'R$ 179,97',
    price: 'R$ 99,99',
    period: '/trimestre',
    features: [
      'Aves ilimitadas',
      'Múltiplas chocadeiras e lotes',
      'Análises financeiras avançadas',
      'Alertas de eclosão via e-mail',
      'Custos de alimentação',
      'Exportação de relatórios',
      'Módulo de Remessas (Melhor Envio)',
      'Chat Exclusivo'
    ],
    buttonText: 'Assine Trimestral',
    isPopular: false,
    icon: <Shield size={24} className="text-[#16A34A]" />,
    gradient: 'from-[#DCFCE7] to-[#F0FDF4]',
    border: 'border-[#BBF7D0]',
    link: 'https://buy.stripe.com/aFa8wOgYJd6BgAt6J94Rq03',
  },
  {
    id: 'anual',
    name: 'Completo Anual',
    description: 'Plano Anual com 44% de desconto.',
    originalPrice: 'R$ 719,88',
    price: 'R$ 399,99',
    period: '/ano',
    features: [
      'Aves ilimitadas',
      'Múltiplas chocadeiras e lotes',
      'Análises financeiras avançadas',
      'Alertas de eclosão via e-mail',
      'Custos de alimentação',
      'Exportação de relatórios',
      'Módulo de Remessas (Melhor Envio)',
      'Chat Exclusivo'
    ],
    buttonText: 'Assine Anual',
    isPopular: false,
    icon: <Shield size={24} className="text-[#2563EB]" />,
    gradient: 'from-[#DBEAFE] to-[#EFF6FF]',
    border: 'border-[#BFDBFE]',
    link: 'https://buy.stripe.com/6oU28q4bX8Ql9815F54Rq01',
  }
];

export default function Subscription() {
  const [userId, setUserId] = useState<string | null>(null);
  const { plan: currentPlan, isTrialExpired } = useSubscription();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
      }
    });
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] text-xs font-bold uppercase tracking-widest mb-6"
        >
          <CreditCard size={14} />
          Assinaturas e Pagamentos
        </motion.div>

        {currentPlan === 'free' && isTrialExpired && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border-2 border-red-200 text-red-700 p-6 rounded-3xl mb-12 shadow-sm max-w-3xl mx-auto flex flex-col items-center gap-4"
          >
            <Lock size={32} className="text-red-500 mb-1" />
            <div className="text-center">
              <h2 className="text-2xl font-black font-headline tracking-tighter uppercase mb-2">Seu período de teste acabou!</h2>
              <p className="font-medium text-sm text-red-600/80">
                O acesso ao sistema foi bloqueado. Assine um dos planos abaixo para continuar usando o AVS Gerenciamento e não perder seus dados.
              </p>
            </div>
            <button 
              onClick={() => supabase.auth.signOut()}
              className="mt-2 px-6 py-2 bg-white text-red-600 rounded-full text-xs font-bold uppercase tracking-widest border border-red-200 hover:bg-red-100 transition-colors shadow-sm"
            >
              Sair da Conta
            </button>
          </motion.div>
        )}

        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl font-black text-[#1F2937] font-headline tracking-tighter mb-4"
        >
          Evolua seu <span className="text-[#2563EB]">Criatório</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-500 max-w-2xl mx-auto text-sm sm:text-base font-medium"
        >
          Escolha o plano ideal para gerenciar suas aves, finanças e chocadeiras com a máxima eficiência. Cancele quando quiser.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
        {plans.map((plan, index) => {
          const isCurrentPlan = plan.id === currentPlan;
          
          return (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className={`
              relative flex flex-col p-8 rounded-[32px] bg-white
              border transition-all duration-300 hover:-translate-y-2
              ${plan.border ? plan.border : 'border-slate-100'}
              ${plan.isPopular ? 'shadow-2xl shadow-[#F59E0B]/10' : 'shadow-[0_2px_10px_rgba(0,0,0,0.02)]'}
            `}
          >
            {plan.isPopular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="bg-[#F59E0B] text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md">
                  Mais Popular
                </div>
              </div>
            )}

            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-6 shadow-sm border border-white`}>
              {plan.icon}
            </div>

            <h3 className="text-2xl font-bold text-[#1F2937] font-headline tracking-tight mb-2">
              {plan.name}
            </h3>

            <p className="text-slate-500 text-xs font-medium mb-6 h-8">
              {plan.description}
            </p>

            <div className="flex items-baseline gap-1 mb-8">
              {plan.originalPrice && (
                <span className="text-[#EF4444] text-xs font-bold line-through mr-1">
                  {plan.originalPrice}
                </span>
              )}
              <span className="text-4xl font-black text-[#1F2937] font-headline tracking-tighter">
                {plan.price}
              </span>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                {plan.period}
              </span>
            </div>

            <a
              href={isCurrentPlan ? '#' : plan.link !== '#' && userId ? `${plan.link}?client_reference_id=${userId}` : plan.link}
              target={isCurrentPlan || plan.link === '#' ? undefined : "_blank"}
              rel="noopener noreferrer"
              onClick={(e) => { if (isCurrentPlan) e.preventDefault(); }}
              className={`
                w-full py-4 rounded-2xl text-sm font-bold uppercase tracking-widest text-center transition-all duration-300 mb-8 block shadow-sm hover:scale-[1.02] active:scale-95
                ${isCurrentPlan
                  ? 'bg-[#DCFCE7] text-[#16A34A] cursor-default'
                  : plan.isPopular
                    ? 'bg-[#F59E0B] text-white hover:bg-[#D97706]'
                    : plan.name === 'Completo Anual' || plan.name === 'Completo Trimestral'
                      ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-600 border border-slate-200'
                }
              `}
            >
              {isCurrentPlan ? 'Plano Atual' : plan.buttonText}
            </a>

            <div className="space-y-4 flex-1">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-0.5 rounded-full p-1 ${plan.isPopular ? 'bg-[#FEF3C7] text-[#F59E0B]' : 'bg-[#EFF6FF] text-[#2563EB]'}`}>
                    <Check size={12} strokeWidth={4} />
                  </div>
                  <span className="text-slate-600 text-xs font-bold">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )})}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-16 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
      >
        <Lock size={14} />
        Pagamento seguro processado por <span className="text-[#2563EB]">Stripe</span>
      </motion.div>

      {currentPlan !== 'free' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-12 flex flex-col items-center justify-center gap-4 border-t border-slate-100 pt-8"
        >
          <p className="text-slate-500 text-xs font-medium">Deseja gerenciar ou cancelar sua assinatura atual?</p>
          <a
            href="https://billing.stripe.com/p/login/test_8wM4iqc7ZcUh7M4288" // Substitua pelo link real do seu portal de clientes do Stripe
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white border border-slate-200 text-slate-500 font-bold text-sm uppercase tracking-widest transition-all hover:bg-slate-50 hover:text-[#EF4444]"
          >
            Cancelar Assinatura
          </a>
        </motion.div>
      )}
    </div>
  );
}


