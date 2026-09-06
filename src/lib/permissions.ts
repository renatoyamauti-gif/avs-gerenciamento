/**
 * Sistema de Permissões de Acesso por Módulo (AVS Gerenciamento)
 */

export type ModuleKey = 
  | 'birds'
  | 'breeding'
  | 'maternity'
  | 'eggs'
  | 'ration'
  | 'shipping'
  | 'finance'
  | 'chat';

const PATH_TO_MODULE: Record<string, ModuleKey> = {
  '/birds': 'birds',
  '/breeding': 'breeding',
  '/maternity': 'maternity',
  '/eggs': 'eggs',
  '/shipping': 'shipping',
  '/products': 'shipping',
  '/ration': 'ration',
  '/finance': 'finance',
  '/chat': 'chat'
};

/**
 * Valida se um usuário tem permissão para acessar determinado módulo ou rota.
 * 
 * - Administradores / Donos de criatório (role !== 'tratador') possuem acesso total.
 * - Tratadores (role === 'tratador') só acessam os módulos explicitamente autorizados em profile.permissions.
 *   - /settings e /subscription são estritamente bloqueados para tratadores.
 *   - / (Painel de Controle) é acessível, mas seus cards e gráficos são filtrados pelos módulos permitidos.
 */
export function hasPermission(profile: any, moduleOrPath: string): boolean {
  if (!profile) return false;

  const role = profile.role || 'admin';
  
  // Administradores e proprietários têm acesso irrestrito
  if (role !== 'tratador') {
    return true;
  }

  // Tratadores nunca podem acessar Configurações nem Assinatura
  if (
    moduleOrPath === 'settings' || 
    moduleOrPath === '/settings' || 
    moduleOrPath === 'subscription' || 
    moduleOrPath === '/subscription'
  ) {
    return false;
  }

  // Painel inicial (Dashboard) é permitido, pois seus componentes internos são filtrados
  if (moduleOrPath === '/' || moduleOrPath === 'dashboard') {
    return true;
  }

  // Mapeia caminho de rota para a chave do módulo correspondente
  let moduleKey = moduleOrPath;
  if (PATH_TO_MODULE[moduleOrPath]) {
    moduleKey = PATH_TO_MODULE[moduleOrPath];
  } else if (moduleOrPath.startsWith('/')) {
    const rootPath = '/' + moduleOrPath.split('/')[1];
    if (PATH_TO_MODULE[rootPath]) {
      moduleKey = PATH_TO_MODULE[rootPath];
    }
  }

  // Deserializa caso as permissões tenham chegado como JSON em formato string
  let permissions = profile.permissions;
  if (typeof permissions === 'string') {
    try {
      permissions = JSON.parse(permissions);
    } catch {
      permissions = null;
    }
  }

  if (!permissions) {
    return false;
  }

  // Suporte tanto para objeto { eggs: true } quanto array ['eggs']
  if (Array.isArray(permissions)) {
    return permissions.includes(moduleKey);
  }

  return !!permissions[moduleKey];
}
