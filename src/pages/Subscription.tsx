import React from 'react';
import { Check, Zap, Shield, Star, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';

const plans = [
  {
    name: 'Iniciante',
    description: 'Para pequenos criadores começando no gerenciamento.',
    price: 'Grátis',
    period: '/para sempre',
    features: [
      'Gestão de até 5 aves',
      'Controle básico de chocadeiras',
      'Registro simples de finanças',
      'Suporte comunitário'
    ],
    buttonText: 'Plano Atual',
    isPopular: false,
    icon: <Star size={24} className="text-[#94a3b8]" />,
    gradient: 'from-[#334155] to-[#1e293b]',
    link: '#',
  },
  {
    name: 'Completo Mensal',
    description: 'Para criadores experientes que precisam de ferramentas avançadas.',
    price: 'R$ 39,99',
    period: '/mês',
    features: [
      'Aves ilimitadas',
      'Múltiplas chocadeiras e lotes',
      'Análises financeiras avançadas',
      'Alertas de eclosão via e-mail',
      'Custos de alimentação',
      'Exportação de relatórios'
    ],
    buttonText: 'Assine Mensal',
    isPopular: true,
    icon: <Zap size={24} className="text-[#eab308]" />,
    gradient: 'from-[#eab308]/20 to-[#eab308]/5',
    border: 'border-[#eab308]/50',
    link: 'https://buy.stripe.com/14A14m5g1feJac5c3t4Rq00',
  },
  {
    name: 'Completo Anual',
    description: 'Plano Anual com 20% de desconto.',
    originalPrice: 'R$ 479,88',
    price: 'R$ 383,99',
    period: '/ano',
    features: [
      'Aves ilimitadas',
      'Múltiplas chocadeiras e lotes',
      'Análises financeiras avançadas',
      'Alertas de eclosão via e-mail',
      'Custos de alimentação',
      'Exportação de relatórios'
    ],
    buttonText: 'Assine Anual',
    isPopular: false,
    icon: <Shield size={24} className="text-[#3b82f6]" />,
    gradient: 'from-[#3b82f6]/20 to-[#3b82f6]/5',
    border: 'border-[#3b82f6]/30',
    link: 'https://buy.stripe.com/6oU28q4bX8Ql9815F54Rq01',
  }
];

export default function Subscription() {
  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/20 text-[#3b82f6] text-[10px] font-black uppercase tracking-widest mb-6"
        >
          <CreditCard size={14} />
          Assinaturas e Pagamentos
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl font-black text-white font-headline tracking-tighter italic uppercase mb-6"
        >
          Evolua seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-[#eab308]">Criatório</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-[#94a3b8] max-w-2xl mx-auto text-sm sm:text-base font-semibold"
        >
          Escolha o plano ideal para gerenciar suas aves, finanças e chocadeiras com a máxima eficiência. Cancele quando quiser.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className={`
              relative flex flex-col p-8 rounded-[32px] bg-[#1e293b] 
              border transition-all duration-300 hover:-translate-y-2
              ${plan.border ? plan.border : 'border-[#334155]'}
              ${plan.isPopular ? 'shadow-2xl shadow-[#eab308]/10' : 'shadow-lg'}
            `}
          >
            {plan.isPopular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="bg-gradient-to-r from-[#eab308] to-[#f59e0b] text-[#1e293b] text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                  Mais Popular
                </div>
              </div>
            )}

            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-6`}>
              {plan.icon}
            </div>

            <h3 className="text-2xl font-black text-white font-headline tracking-tighter italic uppercase mb-2">
              {plan.name}
            </h3>

            <p className="text-[#94a3b8] text-xs font-semibold mb-6 h-8">
              {plan.description}
            </p>

            <div className="flex items-baseline gap-1 mb-8">
              {plan.originalPrice && (
                <span className="text-[#f43f5e] text-sm font-bold line-through mr-1">
                  {plan.originalPrice}
                </span>
              )}
              <span className="text-4xl font-black text-white font-headline tracking-tighter italic">
                {plan.price}
              </span>
              <span className="text-[#94a3b8] text-xs font-bold uppercase tracking-widest">
                {plan.period}
              </span>
            </div>

            <a
              href={plan.link}
              target={plan.link !== '#' ? "_blank" : undefined}
              rel="noopener noreferrer"
              className={`
                w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest text-center transition-all duration-300 mb-8
                ${plan.isPopular
                  ? 'bg-gradient-to-r from-[#eab308] to-[#f59e0b] text-[#1e293b] hover:shadow-[0_0_20px_rgba(234,179,8,0.4)]'
                  : plan.name === 'Completo Anual'
                    ? 'bg-[#3b82f6] text-white hover:bg-[#2563eb] hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]'
                    : 'bg-[#334155] text-white hover:bg-[#475569]'
                }
              `}
            >
              {plan.buttonText}
            </a>

            <div className="space-y-4 flex-1">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-0.5 rounded-full p-0.5 ${plan.isPopular ? 'bg-[#eab308]/20 text-[#eab308]' : 'bg-[#3b82f6]/20 text-[#3b82f6]'}`}>
                    <Check size={12} strokeWidth={4} />
                  </div>
                  <span className="text-[#cbd5e1] text-xs font-semibold">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-16 text-center text-[#94a3b8] text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
      >
        <Lock size={14} />
        Pagamento seguro processado por <span className="text-white">Stripe</span>
      </motion.div>
    </div>
  );
}

// Pequeno ícone extra
function Lock({ size = 24, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );
}
