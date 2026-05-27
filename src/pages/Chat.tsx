import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, Users, LogOut, Lock, Loader2, Info } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { dbService } from '../lib/dbService';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: {
    full_name: string;
    criatorio_name: string;
  };
}

export default function Chat() {
  const { plan, loading: subLoading } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [chatEnabled, setChatEnabled] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isSubscriber = plan === 'pro' || plan === 'anual';

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (chatEnabled && isSubscriber) {
      loadMessages();
      const channel = supabase.channel('supabase_realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, payload => {
          const newMsg = payload.new as ChatMessage;
          // Buscamos o perfil da mensagem que acabou de chegar, ou já carregamos todos os dados?
          // Como o payload.new não traz o join de profiles, precisamos buscar manualmente ou adicionar à lista e buscar depois.
          // Uma abordagem simples: recarregar as mensagens para garantir a ordem e os joins (não ideal para alta escala, mas funcional).
          loadMessages();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [chatEnabled, isSubscriber]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadProfile() {
    try {
      const data = await dbService.getProfile();
      setProfile(data);
      if (data) {
        setChatEnabled(data.chat_enabled || false);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages() {
    try {
      const data = await dbService.getChatMessages(100);
      setMessages(data as any);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  }

  async function handleToggleChat(enabled: boolean) {
    setLoading(true);
    try {
      await dbService.updateChatStatus(enabled);
      setChatEnabled(enabled);
      if (profile) {
        setProfile({ ...profile, chat_enabled: enabled });
      }
    } catch (error) {
      console.error('Erro ao atualizar status do chat:', error);
      alert('Falha ao atualizar status do chat. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await dbService.sendChatMessage(newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setSending(false);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  if (loading || subLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#2563EB]" size={40} />
      </div>
    );
  }

  if (!isSubscriber) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="max-w-2xl mx-auto mt-10 p-8 bg-white border border-slate-100 rounded-[32px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-center"
      >
        <div className="w-20 h-20 bg-[#FEF2F2] rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="text-[#EF4444]" size={32} />
        </div>
        <h2 className="text-3xl font-bold text-[#1F2937] font-headline tracking-tight mb-4">Acesso Restrito</h2>
        <p className="text-slate-500 font-medium mb-8">
          O chat exclusivo é um benefício reservado apenas para assinantes dos planos PRO e ANUAL. Assine agora para trocar experiências com outros criadores!
        </p>
        <Link 
          to="/subscription"
          className="inline-flex items-center justify-center gap-2 bg-[#2563EB] text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-widest shadow-md hover:bg-[#1D4ED8] hover:scale-[1.02] active:scale-95 transition-all"
        >
          Ver Planos de Assinatura
        </Link>
      </motion.div>
    );
  }

  if (!chatEnabled) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="max-w-2xl mx-auto mt-10 p-8 bg-white border border-slate-100 rounded-[32px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-center"
      >
        <div className="w-20 h-20 bg-[#EFF6FF] rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageSquare className="text-[#2563EB]" size={32} />
        </div>
        <h2 className="text-3xl font-bold text-[#1F2937] font-headline tracking-tight mb-4">Chat dos Criadores</h2>
        <p className="text-slate-500 font-medium mb-8">
          Bem-vindo à área de networking! Entre no chat para compartilhar dicas, tirar dúvidas e conversar com outros criadores de aves de todo o Brasil.
        </p>
        <button 
          onClick={() => handleToggleChat(true)}
          className="inline-flex items-center justify-center gap-2 bg-[#2563EB] text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-widest shadow-md hover:bg-[#1D4ED8] hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Users size={18} /> Entrar no Chat
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-160px)]"
    >
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-[#EFF6FF] p-3 rounded-2xl border border-[#DBEAFE]">
            <MessageSquare size={32} className="text-[#2563EB]" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[#1F2937] font-headline tracking-tight">Chat</h2>
            <p className="text-slate-500 font-medium text-sm mt-1">Conectado com outros criadores.</p>
          </div>
        </div>
        <button 
          onClick={() => handleToggleChat(false)}
          className="flex items-center gap-2 bg-white text-[#EF4444] border border-[#FECACA] px-4 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-[#FEF2F2] transition-colors shadow-sm"
        >
          <LogOut size={14} /> Sair do Chat
        </button>
      </header>

      <div className="flex-1 bg-white border border-slate-100 rounded-[32px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col overflow-hidden">
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <MessageSquare size={48} className="mb-4 opacity-50" />
              <p className="font-medium text-sm">Nenhuma mensagem ainda.</p>
              <p className="text-xs mt-1">Seja o primeiro a mandar um oi!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.user_id === profile?.id;
              const name = msg.profiles?.full_name?.split(' ')[0] || 'Criador';
              const criatorio = msg.profiles?.criatorio_name || 'Sem Criatório';

              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3 ${isMe ? 'bg-[#2563EB] text-white rounded-tr-none' : 'bg-white border border-slate-100 shadow-sm text-[#1F2937] rounded-tl-none'}`}>
                    {!isMe && (
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xs font-bold font-headline uppercase">{name}</span>
                        <span className="text-[10px] opacity-60 truncate max-w-[120px] uppercase tracking-wider">{criatorio}</span>
                      </div>
                    )}
                    <p className={`text-sm ${isMe ? 'text-white/95' : 'text-slate-700'}`}>{msg.message}</p>
                    <span className={`text-[10px] mt-2 block text-right font-medium ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..." 
              className="flex-1 bg-[#F8FAFC] border border-slate-200 rounded-full px-6 py-4 text-[#1F2937] font-medium focus:bg-white focus:ring-4 focus:ring-[#2563EB]/10 focus:border-[#2563EB]/50 transition-all outline-none"
            />
            <button 
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="w-14 h-14 bg-[#2563EB] text-white rounded-full flex items-center justify-center hover:bg-[#1D4ED8] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-md shrink-0"
            >
              {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-1" />}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
