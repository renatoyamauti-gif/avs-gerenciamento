import React, { useState, useEffect } from 'react';
import { 
  X, 
  Truck, 
  PackageCheck, 
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw, 
  MessageSquare, 
  Clock, 
  AlertCircle,
  MapPin
} from 'lucide-react';
import { correiosTrackingService, TrackingServiceResult } from '../lib/correiosTrackingService';

interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackingCode: string;
  order?: any;
  clientName?: string;
  clientPhone?: string;
  onMarkDelivered?: (order: any) => Promise<void> | void;
}

export default function TrackingModal({
  isOpen,
  onClose,
  trackingCode,
  order,
  clientName,
  clientPhone,
  onMarkDelivered
}: TrackingModalProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<TrackingServiceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [markingDelivered, setMarkingDelivered] = useState(false);

  const cleanCode = (trackingCode || '').trim().toUpperCase();

  const fetchTracking = async (code: string) => {
    if (!code) return;
    setLoading(true);
    setError(null);
    try {
      const data = await correiosTrackingService.track(code);
      if (data && data.events.length > 0) {
        setResult(data);
      } else {
        setResult({
          code,
          status: order?.status === 'Entregue' ? 'delivered' : 'in_transit',
          deliveredAt: order?.status === 'Entregue' ? order.updated_at : null,
          postedAt: order?.created_at || null,
          events: [
            {
              date: 'Correios',
              location: 'Sistema Postal',
              desc: 'Objeto em trânsito ou recém-postado. Consulte o portal oficial dos Correios para os detalhes mais recentes.',
              status: order?.status === 'Entregue' ? 'success' : 'info'
            }
          ]
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Falha ao consultar rastreio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && cleanCode) {
      fetchTracking(cleanCode);
    } else {
      setResult(null);
      setError(null);
    }
  }, [isOpen, cleanCode]);

  // Fecha com tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!cleanCode) return;
    navigator.clipboard.writeText(cleanCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmDelivery = async () => {
    if (!order || !onMarkDelivered) return;
    setMarkingDelivered(true);
    try {
      await onMarkDelivered(order);
      setResult(prev => prev ? {
        ...prev,
        status: 'delivered',
        events: [
          {
            date: 'Agora',
            location: 'Endereço do Destinatário',
            desc: 'Objeto entregue ao destinatário (Confirmado no sistema)',
            status: 'success'
          },
          ...(prev.events || [])
        ]
      } : null);
    } finally {
      setMarkingDelivered(false);
    }
  };

  const isDelivered = result?.status === 'delivered' || order?.status === 'Entregue';
  const cleanPhone = (clientPhone || '').replace(/\D/g, '');

  const whatsappMessage = isDelivered
    ? `Olá ${clientName || ''}, seu pedido consta como entregue pelos Correios (Rastreio: ${cleanCode})! Esperamos que esteja tudo perfeito. Qualquer dúvida estamos à disposição!`
    : `Olá ${clientName || ''}, seu pedido foi despachado! Você pode rastrear pelo link dos Correios: https://rastreamento.correios.com.br/app/index.php?codigo=${cleanCode} (Código: ${cleanCode})`;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              isDelivered
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                : 'bg-blue-100 text-[#2563EB] dark:bg-blue-950/60 dark:text-blue-400'
            }`}>
              {isDelivered ? <PackageCheck size={22} /> : <Truck size={22} />}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Rastreamento em Tempo Real
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-xs sm:max-w-md">
                {clientName ? `Destinatário: ${clientName}` : 'Consulta de Envio dos Correios'}
                {order?.id && ` • Pedido #${order.id.slice(0, 8)}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[calc(85vh-130px)] overflow-y-auto custom-scrollbar">
          {/* Tracking Code Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-750">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Código de Rastreio</span>
                <span className="font-mono text-lg font-black text-slate-900 dark:text-slate-100 tracking-wider">
                  {cleanCode}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-xs cursor-pointer"
                title="Copiar código de rastreio"
              >
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                isDelivered
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                  : 'bg-[#2563EB] text-white shadow-sm shadow-blue-500/20'
              }`}>
                {isDelivered ? <PackageCheck size={14} /> : <Truck size={14} />}
                {isDelivered ? 'Entregue' : (result?.status === 'posted' ? 'Postado' : 'Em Trânsito')}
              </span>

              <button
                type="button"
                onClick={() => fetchTracking(cleanCode)}
                disabled={loading}
                className="p-2 text-slate-400 hover:text-[#2563EB] hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                title="Atualizar rastreio agora"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin text-[#2563EB]' : ''} />
              </button>
            </div>
          </div>

          {/* Action Links Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
            <a
              href={`https://rastreamento.correios.com.br/app/index.php?codigo=${encodeURIComponent(cleanCode)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#FFCC00] hover:bg-[#FACC15] text-[#003B71] text-xs font-black px-3.5 py-2 rounded-xl uppercase tracking-wider transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <ExternalLink size={13} />
              Portal Correios Oficial
            </a>

            <a
              href={`https://www.linkcorreios.com.br/?id=${encodeURIComponent(cleanCode)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-[#2563EB] text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs"
            >
              <ExternalLink size={13} />
              LinkCorreios
            </a>

            {cleanPhone && (
              <a
                href={`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-3.5 py-2 rounded-xl uppercase tracking-wider transition-all shadow-xs active:scale-95"
              >
                <MessageSquare size={13} />
                WhatsApp Cliente
              </a>
            )}

            {order && order.status !== 'Entregue' && onMarkDelivered && (
              <button
                type="button"
                onClick={handleConfirmDelivery}
                disabled={markingDelivered}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-3.5 py-2 rounded-xl uppercase tracking-wider transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer ml-auto"
              >
                <PackageCheck size={13} />
                {markingDelivered ? 'Salvando...' : 'Confirmar Entrega'}
              </button>
            )}
          </div>

          {/* Timeline Section */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Histórico de Movimentações
            </h4>

            {loading ? (
              <div className="p-8 text-center text-slate-400 space-y-3">
                <RefreshCw size={28} className="animate-spin text-[#2563EB] mx-auto" />
                <p className="text-xs font-semibold">Consultando status dos Correios em tempo real...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-200 dark:border-red-900/40 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            ) : result && result.events.length > 0 ? (
              <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-6 pt-2">
                {result.events.map((event, idx) => {
                  const isLatest = idx === 0;
                  const isSuccess = event.status === 'success';

                  return (
                    <div key={idx} className="relative group">
                      {/* Timeline dot */}
                      <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 bg-white dark:bg-slate-900 transition-all ${
                        isSuccess
                          ? 'border-emerald-500 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                          : isLatest
                            ? 'border-[#2563EB] bg-[#2563EB] shadow-[0_0_10px_rgba(37,99,235,0.4)]'
                            : 'border-slate-300 dark:border-slate-700'
                      }`} />

                      <div className="space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <p className={`text-xs font-bold leading-tight ${
                            isSuccess
                              ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                              : isLatest
                                ? 'text-[#2563EB] dark:text-blue-400 font-bold'
                                : 'text-slate-800 dark:text-slate-200'
                          }`}>
                            {event.desc}
                          </p>
                          <span className="text-[10px] font-semibold text-slate-400 shrink-0 font-mono">
                            {event.date}
                          </span>
                        </div>

                        {event.location && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <MapPin size={11} className="text-slate-400 shrink-0" />
                            <span>{event.location}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl space-y-1">
                <Clock size={24} className="mx-auto text-slate-300 dark:text-slate-600 mb-1" />
                <p className="text-xs font-medium">Nenhum evento registrado ainda.</p>
                <p className="text-[10px] text-slate-400">Pode levar algumas horas após a postagem para o primeiro registro aparecer no sistema dos Correios.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
