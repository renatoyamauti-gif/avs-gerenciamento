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

export class ErrorBoundary extends Component<Props, State> {
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
      showDetails: false,
      isReloading: false
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary captured error:', error, errorInfo);
    this.setState({ errorInfo });

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
    this.setState({ isReloading: true });
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
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/?v=' + Date.now();
  };

  public render() {
    if (this.state.hasError) {
      const { error, errorInfo, isChunkError, showDetails, isReloading } = this.state;

      return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-200">
            {/* Icon */}
            <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-md ${
              isChunkError 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800' 
                : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800'
            }`}>
              {isChunkError ? (
                <RefreshCw size={32} className={isReloading ? 'animate-spin' : ''} />
              ) : (
                <AlertTriangle size={32} />
              )}
            </div>

            {/* Title & Description */}
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 font-headline uppercase tracking-tight mb-3">
              {isChunkError ? 'Atualização do Sistema' : 'Algo deu errado'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed font-medium">
              {isChunkError 
                ? 'Uma versão mais recente do sistema foi carregada. Clique no botão abaixo para recarregar com as atualizações mais recentes.'
                : 'Ocorreu um erro temporário ao renderizar esta página. Clique em recarregar ou volte para o painel principal.'
              }
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <button
                type="button"
                onClick={this.handleHardReload}
                disabled={isReloading}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-70"
              >
                <RefreshCw size={16} className={isReloading ? 'animate-spin' : ''} />
                {isReloading ? 'Atualizando...' : 'Recarregar Aplicativo'}
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
              >
                <Home size={16} />
                Início
              </button>
            </div>

            {/* Technical details accordion */}
            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-4">
              <button
                type="button"
                onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
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

    return this.props.children;
  }
}

export default ErrorBoundary;
