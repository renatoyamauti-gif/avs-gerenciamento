/**
 * Funções de validação e formatação (máscaras) para documentos e dados brasileiros
 */

/**
 * Validação de CPF utilizando o algoritmo oficial dos dígitos verificadores (Módulo 11)
 */
export function isValidCPF(cpf: string): boolean {
  if (!cpf) return false;
  const clean = cpf.replace(/\D/g, '');

  if (clean.length !== 11) return false;

  // Rejeita sequências com todos os dígitos iguais (ex: 000.000.000-00, 111.111.111-11, etc.)
  if (/^(\d)\1{10}$/.test(clean)) return false;

  // Primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let rest = 11 - (sum % 11);
  const digit1 = rest === 10 || rest === 11 ? 0 : rest;

  if (digit1 !== parseInt(clean.charAt(9), 10)) return false;

  // Segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  rest = 11 - (sum % 11);
  const digit2 = rest === 10 || rest === 11 ? 0 : rest;

  return digit2 === parseInt(clean.charAt(10), 10);
}

/**
 * Validação de CNPJ utilizando o algoritmo oficial dos dígitos verificadores (Módulo 11)
 */
export function isValidCNPJ(cnpj: string): boolean {
  if (!cnpj) return false;
  const clean = cnpj.replace(/\D/g, '');

  if (clean.length !== 14) return false;

  // Rejeita sequências com todos os dígitos iguais
  if (/^(\d)\1{13}$/.test(clean)) return false;

  // Primeiro dígito
  let length = clean.length - 2;
  let numbers = clean.substring(0, length);
  const digits = clean.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0), 10)) return false;

  // Segundo dígito
  length = length + 1;
  numbers = clean.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1), 10);
}

/**
 * Validação flexível de CPF ou CNPJ
 */
export function isValidCpfOrCnpj(value: string): boolean {
  const clean = String(value || '').replace(/\D/g, '');
  if (clean.length === 11) {
    return isValidCPF(clean);
  }
  if (clean.length === 14) {
    return isValidCNPJ(clean);
  }
  return false;
}

/**
 * Validação de formato de CEP (8 dígitos numéricos)
 */
export function isValidCepFormat(cep: string): boolean {
  const clean = String(cep || '').replace(/\D/g, '');
  return clean.length === 8;
}

/**
 * Validação de telefone (com DDD, 10 ou 11 dígitos)
 */
export function isValidPhone(phone: string): boolean {
  const clean = String(phone || '').replace(/\D/g, '');
  return clean.length >= 10 && clean.length <= 11;
}

/**
 * Máscara dinâmica progressiva para CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00)
 */
export function maskCpfCnpj(value: string): string {
  const clean = String(value || '').replace(/\D/g, '').slice(0, 14);

  if (clean.length <= 11) {
    // CPF
    let masked = clean;
    if (clean.length > 3) masked = clean.slice(0, 3) + '.' + clean.slice(3);
    if (clean.length > 6) masked = clean.slice(0, 3) + '.' + clean.slice(3, 6) + '.' + clean.slice(6);
    if (clean.length > 9) masked = clean.slice(0, 3) + '.' + clean.slice(3, 6) + '.' + clean.slice(6, 9) + '-' + clean.slice(9);
    return masked;
  }

  // CNPJ
  let masked = clean.slice(0, 2) + '.' + clean.slice(2);
  if (clean.length > 5) masked = clean.slice(0, 2) + '.' + clean.slice(2, 5) + '.' + clean.slice(5);
  if (clean.length > 8) masked = clean.slice(0, 2) + '.' + clean.slice(2, 5) + '.' + clean.slice(5, 8) + '/' + clean.slice(8);
  if (clean.length > 12) masked = clean.slice(0, 2) + '.' + clean.slice(2, 5) + '.' + clean.slice(5, 8) + '/' + clean.slice(8, 12) + '-' + clean.slice(12);
  return masked;
}

/**
 * Máscara progressiva para CEP (00000-000)
 */
export function maskCep(value: string): string {
  const clean = String(value || '').replace(/\D/g, '').slice(0, 8);
  if (clean.length > 5) {
    return clean.slice(0, 5) + '-' + clean.slice(5);
  }
  return clean;
}

/**
 * Máscara progressiva para Telefone com DDD ((00) 00000-0000 ou (00) 0000-0000)
 */
export function maskPhone(value: string): string {
  const clean = String(value || '').replace(/\D/g, '').slice(0, 11);

  if (clean.length <= 2) {
    return clean.length > 0 ? `(${clean}` : '';
  }
  if (clean.length <= 6) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
  }
  if (clean.length <= 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
}

/**
 * Interface do retorno do ViaCEP
 */
export interface CepResult {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  complemento?: string;
  erro?: boolean;
}

/**
 * Consulta de CEP na API pública ViaCEP
 */
export async function lookupViaCep(cep: string): Promise<{ success: boolean; data?: CepResult; error?: string }> {
  const clean = String(cep || '').replace(/\D/g, '');
  if (clean.length !== 8) {
    return { success: false, error: 'CEP deve conter 8 dígitos numéricos.' };
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (!response.ok) {
      throw new Error(`Serviço de CEP indisponível (${response.status})`);
    }

    const data: CepResult = await response.json();
    if (data.erro) {
      return { success: false, error: 'CEP não encontrado na base postal dos Correios.' };
    }

    return { success: true, data };
  } catch (err: any) {
    return { 
      success: false, 
      error: err.message || 'Erro ao consultar o serviço de CEP. Verifique sua conexão.' 
    };
  }
}
