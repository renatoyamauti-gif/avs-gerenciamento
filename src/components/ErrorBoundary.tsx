import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, Home, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isChunkError: boolean;
  showDetails: boolean;
  isReloading: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
  }

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isChunkError: false,
    showDetails: false,
    isReloading: false
  };

  public static getDerivedStateFromError(error: Error): State {
    const errorMsg = String(error?.message || '');
    const errorName = String(error?.name || '');
    const fullError = `${errorName} ${errorMsg}`.toLowerCase();
    
    // Check if error is related to dynamic imports, chunk hash mismatch, or Vite build rotation
    const isChunk = 
      errorName === 'ChunkLoadError' ||
      fullError.includes('failed to fetch dynamically imported module') ||
      fullError.includes('importing a module script failed') ||
      fullError.includes('loading chunk') ||
      fullError.includes('load failed') ||
      fullError.includes('failed to load') ||
      fullError.includes('dynamically imported') ||
      fullError.includes("unexpected token '<'") ||
      fullError.includes('is not a valid javascript mime type');

    return {
      hasError: true,
      error,
      errorInfo: null,
      isChunkError: isChunk,
      showDetails: true,
      isReloading: false
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary captured error:', error, errorInfo);
    (this as any).setState({ errorInfo });

    // Auto-reload once if it's a chunk error and we haven't already attempted an auto-reload
    const autoReloadKey = 'avs_auto_chunk_reload';
    const lastAttempt = sessionStorage.getItem(autoReloadKey);
    const isChunk = this.state.isChunkError;

    if (isChunk && !lastAttempt) {
      sessionStorage.setItem(autoReloadKey, 'true');
      this.handleHardReload();
    }
  }

  private handleHardReload = async () => {
    (this as any).setState({ isReloading: true });
    try {
      try {
        sessionStorage.clear();
      } catch {}

      // Clear CacheStorage
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(key => caches.delete(key)));
      }
      
      // Unregister Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
    } catch (e) {
      console.warn('Error clearing caches:', e);
    } finally {
      const url = new URL(window.location.origin + window.location.pathname);
      url.searchParams.set('v', String(Date.now()));
      window.location.href = url.toString();
    }
  };

  private handleGoHome = () => {
    try {
      sessionStorage.clear();
    } catch {}
    (this as any).setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/?v=' + Date.now();
  };

  public render() {
    if (this.state.hasError) {
      const { error, errorInfo, isChunkError, showDetails, isReloading } = this.state;

      return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-8 rounded-3xl max-w-lg w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-950/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100 dark:border-red-900/50">
              <AlertTriangle className="text-red-500" size={32} />
            </div>

            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              {isChunkError ? 'Nova versão do sistema disponível!' : 'Algo inesperado aconteceu'}
            </h2>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              {isChunkError 
                ? 'Uma atualização foi publicada. Clique no botão abaixo para atualizar o aplicativo para a versão mais recente.' 
                : 'Ocorreu uma falha ao renderizar esta parte da página. Tente recarregar para resolver o problema.'}
            </p>

            <div className="space-y-3">
              <button 
                onClick={this.handleHardReload}
                disabled={isReloading}
                className="w-full py-3.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-2xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <RefreshCw size={18} className={isReloading ? 'animate-spin' : ''} />
                <span>{isReloading ? 'Atualizando sistema...' : 'Recarregar e Atualizar Agora'}</span>
              </button>

              <button 
                onClick={this.handleGoHome}
                disabled={isReloading}
                className="w-full py-3.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <Home size={18} />
                <span>Voltar para o Início</span>
              </button>
            </div>

            <button
              type="button"
              onClick={this.handleHardReload}
              className="w-full mt-2 py-2.5 text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 uppercase tracking-widest cursor-pointer border border-dashed border-slate-200 dark:border-slate-700 rounded-xl"
            >
              🧹 Limpar Cache Local e Reiniciar
            </button>

            {/* Technical details accordion */}
            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-4">
              <button
                type="button"
                onClick={() => (this as any).setState((prev: State) => ({ showDetails: !prev.showDetails }))}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 uppercase tracking-wider transition-colors cursor-pointer"
              >
                <span>{showDetails ? 'Ocultar detalhes técnicos' : 'Ver detalhes técnicos'}</span>
                {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showDetails && (
                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-left font-mono text-[11px] text-red-600 dark:text-red-400 overflow-x-auto max-h-48 select-all border border-slate-200 dark:border-slate-800">
                  <p className="font-bold mb-1">{error?.name}: {error?.message}</p>
                  {errorInfo?.componentStack && (
                    <pre className="text-[10px] text-slate-500 dark:text-slate-500 whitespace-pre-wrap mt-2">
                      {errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default ErrorBoundary;
