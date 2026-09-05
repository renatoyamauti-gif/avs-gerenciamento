import { supabase } from './supabaseClient';

export interface FirebaseErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string | null;
    email: string | null;
  }
}

export function handleSupabaseError(error: any, operation: FirebaseErrorInfo['operationType'], path: string | null): never {
  const rawMsg = error?.message || 'Erro desconhecido';
  const errorInfo: FirebaseErrorInfo = {
    error: rawMsg,
    operationType: operation,
    path: path,
    authInfo: {
      userId: null,
      email: null
    }
  };
  
  console.error('Supabase Error:', errorInfo, error);

  let userFriendlyMsg = rawMsg;
  if (rawMsg.includes('row-level security policy') || error?.code === '42501') {
    userFriendlyMsg = `Permissão negada pela política de segurança (RLS) para a tabela "${path || ''}".`;
  }

  throw new Error(userFriendlyMsg);
}
