import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, AlertCircle, Loader2, Sparkles, ArrowRight } from 'lucide-react';

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password'>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'forgot_password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
        alert('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
        setMode('login');
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('As senhas não coincidem.');
        }
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Confirme seu e-mail para completar o cadastro!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      let errorMsg = err.message || 'Ocorreu um erro inesperado.';
      if (errorMsg.toLowerCase().includes('rate limit')) {
        errorMsg = 'Muitas tentativas. Por favor, aguarde cerca de 1 hora para tentar novamente ou verifique sua caixa de entrada/spam.';
      } else if (errorMsg.includes('Invalid login credentials')) {
        errorMsg = 'E-mail ou senha inválidos.';
      } else if (errorMsg.includes('User already registered')) {
        errorMsg = 'Este e-mail já está cadastrado.';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#0f172a] text-slate-100 font-body selection:bg-primary/30">
      
      {/* Lado Esquerdo - Visual Clean e Direto (Oculto em mobile) */}
      <div className="hidden lg:flex w-1/2 bg-[#1e293b] flex-col justify-between p-16 border-r border-slate-800 relative overflow-hidden">
        {/* Fundo bem limpo, com apenas um leve glow para não distrair */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white mb-16">
            <div className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20">
              <Sparkles size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight">AVS System</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight mb-6">
              Gerencie seu plantel com <span className="text-primary">clareza e precisão.</span>
            </h1>
            <p className="text-slate-300 text-lg max-w-lg leading-relaxed">
              O ecossistema completo para o criador moderno. Controle financeiro, genética e chocadeiras em uma interface limpa, rápida e sem distrações.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 flex flex-col gap-2">
          <div className="h-1 w-12 bg-primary rounded-full mb-4" />
          <p className="text-slate-400 font-medium">© {new Date().getFullYear()} AVS Sistema de Gerenciamento</p>
        </div>
      </div>

      {/* Lado Direito - Formulário Clean e Legível */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-[#0f172a]">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[420px]"
        >
          {/* Header Form */}
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
              {mode === 'login' ? 'Acessar Conta' : mode === 'register' ? 'Criar Conta' : 'Recuperar Acesso'}
            </h2>
            <p className="text-slate-300 text-base">
              {mode === 'login' ? 'Digite suas credenciais para continuar.' : mode === 'register' ? 'Preencha os dados abaixo para começar.' : 'Enviaremos instruções para o seu e-mail.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {/* E-mail */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-200 ml-1">
                Endereço de E-mail
              </label>
              <div className="relative">
                <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-xl pl-12 pr-4 py-4 text-white text-base focus:bg-[#283548] focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none placeholder:text-slate-500 shadow-sm"
                />
              </div>
            </div>

            {/* Senha */}
            <AnimatePresence mode="popLayout">
              {mode !== 'forgot_password' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between ml-1">
                    <label htmlFor="password" className="block text-sm font-medium text-slate-200">
                      Senha
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => { setMode('forgot_password'); setError(null); }}
                        className="text-sm font-medium text-primary hover:text-blue-400 transition-colors"
                      >
                        Esqueceu a senha?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="password"
                      required={mode !== 'forgot_password'}
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#1e293b] border border-slate-700 rounded-xl pl-12 pr-4 py-4 text-white text-base focus:bg-[#283548] focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none placeholder:text-slate-500 shadow-sm"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Confirmar Senha */}
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2 overflow-hidden pt-1"
                >
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-200 ml-1">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="confirmPassword"
                      required={mode === 'register'}
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#1e293b] border border-slate-700 rounded-xl pl-12 pr-4 py-4 text-white text-base focus:bg-[#283548] focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none placeholder:text-slate-500 shadow-sm"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mensagem de Erro */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 text-red-400 text-sm font-medium"
                >
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botão de Ação Primária */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white text-base font-semibold py-4 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 mt-8"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={22} />
              ) : mode === 'login' ? (
                <>Entrar no Sistema <ArrowRight size={20} /></>
              ) : mode === 'register' ? (
                <>Criar minha conta <ArrowRight size={20} /></>
              ) : (
                <>Enviar link por e-mail <Mail size={20} /></>
              )}
            </button>
          </form>

          {/* Rodapé do Formulário / Troca de Modo */}
          <div className="mt-8 text-center">
            <p className="text-base text-slate-300">
              {mode === 'login' ? 'Ainda não tem uma conta?' : mode === 'register' ? 'Já possui uma conta?' : 'Lembrou sua senha?'}
              {' '}
              <button
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
                className="text-primary font-semibold hover:text-blue-400 transition-colors underline-offset-4 hover:underline"
              >
                {mode === 'login' ? 'Cadastre-se aqui' : 'Faça login'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
