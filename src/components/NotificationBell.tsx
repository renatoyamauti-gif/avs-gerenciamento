import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, PackageCheck, ExternalLink, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { notificationService, AppNotification } from '../lib/notificationService';

interface NotificationBellProps {
  isMobile?: boolean;
}

export default function NotificationBell({ isMobile = false }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => notificationService.getNotifications());
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleUpdate = () => {
      setNotifications(notificationService.getNotifications());
    };

    window.addEventListener('avs_notifications_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('avs_notifications_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Fecha o popover ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
  };

  const handleClearAll = () => {
    notificationService.clearAll();
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={handleToggle}
        className={`relative p-2 rounded-full transition-colors cursor-pointer touch-manipulation active:scale-95 flex items-center justify-center ${
          isMobile 
            ? 'text-white hover:bg-white/10' 
            : 'text-slate-400 hover:text-[#2563EB] dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        aria-label="Abrir notificações"
        title="Notificações e Alertas de Entrega"
      >
        <Bell className={isMobile ? 'size-5' : 'size-5'} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-[#EF4444] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm animate-pulse border-2 border-white dark:border-slate-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className={`absolute z-[100] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden ${
            isMobile 
              ? 'fixed inset-x-4 top-20 max-w-sm mx-auto' 
              : 'right-0 top-12 w-80 sm:w-96'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#F8FAFC] dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <PackageCheck size={16} className="text-[#2563EB] dark:text-blue-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-[#1F2937] dark:text-slate-100">
                Notificações ({notifications.length})
              </h4>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  title="Marcar todas como lidas"
                >
                  Marcar lidas
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors cursor-pointer"
                  title="Limpar todas as notificações"
                >
                  <Trash2 size={13} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded transition-colors cursor-pointer sm:hidden"
                aria-label="Fechar"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Lista de Notificações */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 space-y-2">
                <Bell size={24} className="mx-auto text-slate-300 dark:text-slate-600 opacity-60" />
                <p className="text-xs font-medium">Nenhum aviso no momento.</p>
                <p className="text-[10px] text-slate-400">Você será avisado aqui assim que um pedido for entregue!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id}
                  onClick={() => notificationService.markAsRead(n.id)}
                  className={`p-3.5 transition-colors flex items-start gap-3 cursor-pointer ${
                    !n.read 
                      ? 'bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    n.type === 'delivery' 
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                  }`}>
                    <PackageCheck size={16} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-[#1F2937] dark:text-slate-100 truncate">
                        {n.title}
                      </p>
                      <span className="text-[9px] font-semibold text-slate-400 shrink-0">
                        {formatTime(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {n.message}
                    </p>

                    {n.trackingCode && (
                      <div className="mt-2 flex items-center gap-2">
                        <Link
                          to="/remessas"
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <span>Ver em Remessas</span>
                          <ExternalLink size={10} />
                        </Link>
                      </div>
                    )}
                  </div>

                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
