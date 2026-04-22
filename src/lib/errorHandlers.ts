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
  const auth = supabase.auth.getUser();
  const errorInfo: FirebaseErrorInfo = {
    error: error?.message || 'Erro desconhecido',
    operationType: operation,
    path: path,
    authInfo: {
      userId: null,
      email: null
    }
  };
  
  console.error('Supabase Error:', errorInfo);
  throw new Error(JSON.stringify(errorInfo));
}
