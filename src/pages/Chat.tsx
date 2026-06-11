import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, Users, LogOut, Lock, Loader2, Info, Circle, Bot, AlertCircle, Shield, Trash2, Ban, AlertTriangle, UserCheck, X } from 'lucide-react';
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

  // Tab state: 'community' | 'moderation'
  const [chatMode, setChatMode] = useState<'community' | 'moderation'>('community');

  // Moderation state
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [modSearch, setModSearch] = useState('');
  const [warningTarget, setWarningTarget] = useState<{ id: string; name: string } | null>(null);
  const [warningInput, setWarningInput] = useState('');
  const [activeWarning, setActiveWarning] = useState<string | null>(null);

  const isSubscriber = plan === 'pro' || plan === 'trimestral' || plan === 'anual';

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
  }, [messages, chatMode]);

  async function loadProfile() {
    try {
      const data = await dbService.getProfile();
      setProfile(data);
      if (data) {
        setChatEnabled(data.chat_enabled || false);
        if (data.warning_message) {
          setActiveWarning(data.warning_message);
        }
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

  const handleDismissWarning = async () => {
    if (!profile) return;
    try {
      await dbService.warnUser(profile.id, null);
      setActiveWarning(null);
      setProfile({ ...profile, warning_message: null });
    } catch (error) {
      console.error('Erro ao dispensar advertência:', error);
    }
  };

  const loadAllProfiles = async () => {
    try {
      const data = await dbService.getProfiles();
      setAllProfiles(data);
    } catch (error) {
      console.error('Erro ao carregar perfis para moderação:', error);
    }
  };

  useEffect(() => {
    if (chatMode === 'moderation') {
      loadAllProfiles();
    }
  }, [chatMode]);

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Tem certeza de que deseja excluir esta mensagem?')) return;
    try {
      await dbService.deleteChatMessage(messageId);
      loadMessages();
    } catch (error) {
      alert('Falha ao excluir a mensagem.');
    }
  };

  const handleOpenWarning = (userId: string, name: string) => {
    setWarningTarget({ id: userId, name });
    setWarningInput('');
  };

  const handleSendWarning = async () => {
    if (!warningTarget || !warningInput.trim()) return;
    try {
      await dbService.warnUser(warningTarget.id, warningInput.trim());
      alert(`Advertência enviada com sucesso para ${warningTarget.name}!`);
      setWarningTarget(null);
      loadAllProfiles();
    } catch (error) {
      alert('Falha ao enviar advertência.');
    }
  };

  const handleToggleBlock = async (userId: string, name: string, isBlocked: boolean) => {
    const action = isBlocked ? 'desbloquear' : 'bloquear';
    if (!window.confirm(`Tem certeza de que deseja ${action} o usuário ${name}?`)) return;
    try {
      await dbService.blockUserFromChat(userId, !isBlocked);
      alert(`Usuário ${name} ${isBlocked ? 'desbloqueado' : 'bloqueado'} com sucesso!`);
      loadAllProfiles();
    } catch (error) {
      alert(`Falha ao ${action} o usuário.`);
    }
  };

  if (loading || subLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#2563EB]" size={40} />
      </div>
    );
  }

  if (profile?.chat_blocked) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="max-w-2xl mx-auto mt-10 p-8 bg-white border border-slate-100 rounded-[32px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-center"
      >
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Ban className="text-red-500" size={32} />
        </div>
        <h2 className="text-3xl font-bold text-[#1F2937] font-headline tracking-tight mb-4">Acesso Bloqueado</h2>
        <p className="text-slate-500 font-medium mb-8">
          Sua conta foi suspensa do chat por um moderador devido a comportamento inadequado. Se você acredita que isso foi um engano, entre em contato com o suporte.
        </p>
      </motion.div>
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
          O chat exclusivo da comunidade é um benefício reservado apenas para assinantes dos planos pagos (Mensal, Trimestral e Anual). Assine agora para trocar experiências com outros criadores!
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
        <h2 className="text-3xl font-bold text-[#1F2937] font-headline tracking-tight mb-4">Chat da Comunidade</h2>
        <p className="text-slate-500 font-medium mb-8">
          Bem-vindo à área de comunicação! Ative o chat para compartilhar dicas no canal da comunidade e trocar experiências com outros criadores.
        </p>
        <button 
          onClick={() => handleToggleChat(true)}
          className="inline-flex items-center justify-center gap-2 bg-[#2563EB] text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-widest shadow-md hover:bg-[#1D4ED8] hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Users size={18} /> Ativar Chat
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
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-[#EFF6FF] p-3 rounded-2xl border border-[#DBEAFE]">
            <MessageSquare size={32} className="text-[#2563EB]" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[#1F2937] font-headline tracking-tight">Comunicação e Suporte</h2>
            <p className="text-slate-500 font-medium text-sm mt-1">Conectado à comunidade de criadores.</p>
          </div>
        </div>
        <button 
          onClick={() => handleToggleChat(false)}
          className="flex items-center gap-2 bg-white text-[#EF4444] border border-[#FECACA] px-4 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-[#FEF2F2] transition-colors shadow-sm self-start sm:self-center"
        >
          <LogOut size={14} /> Sair do Chat
        </button>
      </header>

      {/* Tabs (Apenas se for moderador para gerenciar) */}
      {profile?.is_moderator && (
        <div className="flex gap-4 mb-6 bg-slate-100 p-1 rounded-2xl w-fit shrink-0">
          <button 
            onClick={() => setChatMode('community')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${chatMode === 'community' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Users size={14} />
            Comunidade
          </button>
          <button 
            onClick={() => setChatMode('moderation')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${chatMode === 'moderation' ? 'bg-white text-[#EF4444] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Shield size={14} className={chatMode === 'moderation' ? 'text-[#EF4444]' : ''} />
            Moderação
          </button>
        </div>
      )}

      {chatMode === 'community' ? (
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
            <div className="lg:hidden flex items-center gap-4 p-4 border-b border-slate-100 bg-slate-50 overflow-x-auto no-scrollbar shrink-0">
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

            {/* Messages List */}
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
                      
                      {!isMe && profile?.is_moderator && (
                        <div className="flex gap-4 mt-1.5 ml-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <button 
                            onClick={() => handleDeleteMessage(msg.id)} 
                            className="flex items-center gap-1 hover:text-red-500 transition-colors"
                            title="Excluir Mensagem"
                          >
                            <Trash2 size={10} /> Excluir
                          </button>
                          <button 
                            onClick={() => handleOpenWarning(msg.user_id, name)} 
                            className="flex items-center gap-1 hover:text-amber-500 transition-colors"
                            title="Adverter Usuário"
                          >
                            <AlertTriangle size={10} /> Adverter
                          </button>
                          <button 
                            onClick={() => handleToggleBlock(msg.user_id, name, false)} 
                            className="flex items-center gap-1 hover:text-red-600 transition-colors"
                            title="Bloquear Usuário"
                          >
                            <Ban size={10} /> Bloquear
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem na comunidade..." 
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
      ) : (
        // Moderation tab panel
        <div className="flex-1 bg-white border border-slate-100 rounded-[32px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col overflow-hidden p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
            <div>
              <h3 className="font-bold text-[#1F2937] font-headline text-lg flex items-center gap-2">
                <Shield size={20} className="text-[#EF4444]" />
                Controle de Membros do Chat
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">Gerencie o acesso, aplique advertências e controle a convivência.</p>
            </div>
            
            <input 
              type="text" 
              value={modSearch}
              onChange={(e) => setModSearch(e.target.value)}
              placeholder="Buscar por criador ou criatório..." 
              className="bg-[#F8FAFC] border border-slate-200 rounded-full px-5 py-2.5 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-[#2563EB]/10 focus:border-[#2563EB]/50 transition-all outline-none w-full sm:w-64"
            />
          </div>
          
          <div className="flex-1 overflow-y-auto border border-slate-100 rounded-2xl divide-y divide-slate-100">
            {allProfiles
              .filter(p => 
                (p.full_name?.toLowerCase().includes(modSearch.toLowerCase()) || 
                 p.criatorio_name?.toLowerCase().includes(modSearch.toLowerCase()))
              )
              .map(p => (
                <div key={p.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold font-headline uppercase">
                      {p.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#1F2937] font-headline uppercase">{p.full_name || 'Usuário'}</span>
                        {p.is_moderator && (
                          <span className="bg-[#FEF2F2] text-[#EF4444] text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Mod</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-400 mt-0.5 font-medium">
                        <span className="text-[10px] uppercase tracking-wider">{p.criatorio_name || 'Sem Criatório'}</span>
                        <span className="text-slate-200">•</span>
                        <span className="text-[10px] uppercase tracking-wider">{p.phone || 'Sem Telefone'}</span>
                      </div>
                      {p.warning_message && (
                        <div className="mt-1 bg-amber-50 border border-amber-100 px-3 py-1 rounded-lg text-[10px] text-amber-700 font-semibold flex items-center gap-1.5 w-fit">
                          <AlertTriangle size={12} /> Adv: "{p.warning_message}"
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button 
                      onClick={() => handleOpenWarning(p.id, p.full_name || 'Usuário')}
                      disabled={p.is_moderator}
                      className="flex items-center gap-1 bg-[#FEF3C7] text-[#D97706] hover:bg-[#FDE68A] disabled:opacity-50 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                    >
                      <AlertTriangle size={12} />
                      Adverter
                    </button>
                    
                    <button 
                      onClick={() => handleToggleBlock(p.id, p.full_name || 'Usuário', p.chat_blocked)}
                      disabled={p.is_moderator}
                      className={`flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        p.chat_blocked 
                          ? 'bg-[#DCFCE7] text-[#16A34A] hover:bg-[#BBF7D0]' 
                          : 'bg-[#FEE2E2] text-[#EF4444] hover:bg-[#FCA5A5]'
                      }`}
                    >
                      {p.chat_blocked ? (
                        <>
                          <UserCheck size={12} />
                          Desbloquear
                        </>
                      ) : (
                        <>
                          <Ban size={12} />
                          Bloquear
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            
            {allProfiles.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm font-semibold">
                Nenhum membro encontrado.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Warning Overlay for the user */}
      {activeWarning && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[32px] border border-amber-200 p-8 max-w-md w-full shadow-2xl text-center flex flex-col items-center gap-6"
          >
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
              <AlertTriangle size={36} />
            </div>
            <div>
              <h3 className="text-xl font-bold font-headline text-slate-800 uppercase tracking-tight mb-2">Advertência do Moderador</h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed mb-4">
                Você recebeu uma advertência formal da moderação do canal por infringir as regras do chat comunitário:
              </p>
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-xl text-left text-sm font-semibold text-amber-900 italic whitespace-pre-wrap">
                "{activeWarning}"
              </div>
            </div>
            <button 
              onClick={handleDismissWarning}
              className="w-full bg-[#2563EB] text-white py-3.5 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-[#1D4ED8] active:scale-95 transition-all shadow-md"
            >
              Compreendi e Concordo
            </button>
          </motion.div>
        </div>
      )}

      {/* Warning input modal for the moderator */}
      {warningTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl flex flex-col gap-6"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold font-headline text-slate-800 flex items-center gap-2">
                <AlertTriangle size={20} className="text-amber-500" />
                Adverter Usuário
              </h3>
              <button 
                onClick={() => setWarningTarget(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Destinatário</p>
              <p className="text-sm font-semibold text-slate-800 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">{warningTarget.name}</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Motivo da Advertência</label>
              <textarea 
                value={warningInput}
                onChange={(e) => setWarningInput(e.target.value)}
                placeholder="Ex: Por favor, evite o uso de linguagem imprópria ou ofensiva."
                rows={4}
                className="bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 font-medium focus:bg-white focus:ring-4 focus:ring-[#2563EB]/10 focus:border-[#2563EB]/50 transition-all outline-none resize-none"
              />
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setWarningTarget(null)}
                className="flex-1 bg-white border border-slate-200 text-slate-500 py-3.5 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all text-center"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSendWarning}
                disabled={!warningInput.trim()}
                className="flex-1 bg-amber-500 text-white py-3.5 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-amber-600 active:scale-95 transition-all disabled:opacity-50 text-center shadow-md shadow-amber-500/10"
              >
                Enviar Alerta
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
