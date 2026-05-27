import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, Users, LogOut, Lock, Loader2, Info, Circle } from 'lucide-react';
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
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isSubscriber = plan === 'pro' || plan === 'anual';

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (chatEnabled && isSubscriber && profile) {
      loadMessages();
      
      const messageChannel = supabase.channel('supabase_realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, payload => {
          loadMessages();
        })
        .subscribe();

      const presenceChannel = supabase.channel('chat_presence', {
        config: { presence: { key: profile.id } }
      });

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          const users = Object.values(state).map((presenceArray: any) => presenceArray[0]);
          
          // Remove duplicates if any user has multiple connections, keeping one per user_id
          const uniqueUsers = Array.from(new Map(users.map(u => [u.user_id, u])).values());
          setOnlineUsers(uniqueUsers);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({
              user_id: profile.id,
              name: profile.full_name?.split(' ')[0] || 'Criador',
              criatorio: profile.criatorio_name || 'Sem Criatório'
            });
          }
        });

      return () => {
        supabase.removeChannel(messageChannel);
        supabase.removeChannel(presenceChannel);
      };
    }
  }, [chatEnabled, isSubscriber, profile]);

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

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* Left Column: Online Users Sidebar */}
        <div className="hidden lg:flex w-72 bg-white border border-slate-100 rounded-[32px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex-col overflow-hidden shrink-0">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-[#1F2937] font-headline uppercase tracking-widest text-sm flex items-center gap-2">
              <Users size={16} className="text-[#2563EB]" />
              Online Agora
            </h3>
            <span className="bg-[#DCFCE7] text-[#16A34A] text-[10px] font-black px-2.5 py-1 rounded-full">
              {onlineUsers.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {onlineUsers.map((user) => (
              <div key={user.user_id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                <div className="relative">
                  <div className="w-10 h-10 bg-[#EFF6FF] rounded-full flex items-center justify-center text-[#2563EB] font-bold text-sm font-headline">
                    {user.name.charAt(0)}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#10B981] border-2 border-white rounded-full"></div>
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold font-headline uppercase truncate text-[#1F2937]">
                    {user.user_id === profile?.id ? `${user.name} (Você)` : user.name}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider truncate">
                    {user.criatorio}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Messages Area */}
        <div className="flex-1 bg-white border border-slate-100 rounded-[32px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col overflow-hidden">
        
        {/* Mobile Online Users (Horizontal Scroll) */}
        <div className="lg:hidden flex items-center gap-4 p-4 border-b border-slate-100 bg-slate-50 overflow-x-auto no-scrollbar">
          <div className="flex flex-col items-center shrink-0">
            <div className="w-12 h-12 bg-[#DCFCE7] rounded-full flex items-center justify-center text-[#16A34A] font-bold shadow-sm">
              <Users size={20} />
            </div>
            <span className="text-[10px] font-bold mt-1 text-slate-500 uppercase tracking-widest">{onlineUsers.length} Online</span>
          </div>
          {onlineUsers.map((user) => (
            <div key={user.user_id} className="flex flex-col items-center shrink-0 relative">
              <div className="w-12 h-12 bg-[#EFF6FF] border border-[#DBEAFE] rounded-full flex items-center justify-center text-[#2563EB] font-bold text-lg font-headline shadow-sm">
                {user.name.charAt(0)}
              </div>
              <div className="absolute bottom-[18px] right-0 w-3.5 h-3.5 bg-[#10B981] border-2 border-white rounded-full"></div>
              <span className="text-[10px] font-bold text-slate-600 mt-1 uppercase max-w-[60px] truncate">
                {user.user_id === profile?.id ? 'Você' : user.name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <MessageSquare size={48} className="mb-4 opacity-50" />
              <p className="font-medium text-sm">Nenhuma mensagem ainda.</p>
              <p className="text-xs mt-1">Seja o primeiro a mandar um oi!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.user_id === profile?.id;
              
              // O Supabase pode retornar 'profiles' como array dependendo da chave estrangeira
              const profileData = Array.isArray(msg.profiles) ? msg.profiles[0] : msg.profiles;
              const name = profileData?.full_name?.split(' ')[0] || 'Criador';
              const criatorio = profileData?.criatorio_name || 'Sem Criatório';

              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3 ${isMe ? 'bg-[#2563EB] text-white rounded-tr-none' : 'bg-white border border-slate-100 shadow-sm text-[#1F2937] rounded-tl-none'}`}>
                    <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'justify-end' : ''}`}>
                      <span className="text-xs font-bold font-headline uppercase">{name}</span>
                      <span className="text-[10px] opacity-60 truncate max-w-[120px] uppercase tracking-wider">{criatorio}</span>
                    </div>
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
      </div>
    </motion.div>
  );
}
