import { supabase } from './supabaseClient';
import { dbService } from './dbService';

let isSigningOutProgress = false;

/**
 * Executa o encerramento de sessão de forma precisa, ultra-rápida e segura.
 * - Despacha eventos instantâneos para a interface desabilitar botões e mostrar feedback visual imediato.
 * - Limpa caches locais e tokens do Supabase sem travar na rede.
 * - Utiliza Promise.race com timeout defensivo para garantir saída mesmo com internet instável.
 */
export async function performSignOut(): Promise<void> {
  if (isSigningOutProgress) return;
  isSigningOutProgress = true;

  try {
    // 1. Notifica a UI instantaneamente para travar cliques e mostrar 'Saindo...'
    window.dispatchEvent(new CustomEvent('avs_auth_signing_out'));

    // 2. Limpa caches locais do sistema
    try {
      dbService.clearCache(true);
    } catch (err) {
      console.warn('Aviso ao limpar dbService cache:', err);
    }

    // 3. Remove imediatamente tokens do Supabase e do usuário do localStorage
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('sb-') || 
          key.includes('supabase.auth.token') || 
          key === 'avs_cached_profile' ||
          key === 'supabase.auth.token'
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Aviso ao limpar tokens de autenticação do localStorage:', e);
    }

    // 4. Dispara o signOut no Supabase com timeout de segurança (máximo 600ms)
    // Se a conexão estiver lenta no celular, não bloqueia o usuário
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((resolve) => setTimeout(resolve, 600))
      ]);
    } catch (err) {
      console.warn('Supabase signOut timeout/erro controlado:', err);
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {}
    }

    // 5. Notifica o término da sessão para desmontar o estado
    window.dispatchEvent(new CustomEvent('avs_auth_signed_out'));
  } finally {
    isSigningOutProgress = false;
  }
}
