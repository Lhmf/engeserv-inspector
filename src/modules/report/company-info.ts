/**
 * Report Module — Resolução dos dados institucionais da empresa emitente
 *
 * Substitui o uso de MOCK_COMPANY no caminho de produção. Os dados reais
 * da empresa emitente são lidos de variáveis de ambiente de configuração.
 * Quando não estiverem configurados, `resolveCompanyInfo` retorna null e
 * the chamador deve bloquear a emissão definitiva.
 */

import type { CompanyInfo } from './templates/nr13/types';

export interface CompanyEnvInput {
  REPORT_COMPANY_NAME?: string;
  REPORT_COMPANY_TAGLINE?: string;
  REPORT_COMPANY_CNPJ?: string;
  REPORT_COMPANY_ADDRESS?: string;
  REPORT_COMPANY_PHONE?: string;
  REPORT_COMPANY_EMAIL?: string;
  REPORT_COMPANY_WEBSITE?: string;
}

/**
 * Dados necessários para emitir um laudo definitivo: nome + CNPJ reais.
 */
export function isDefinitiveCompanyInfo(
  company: CompanyInfo | null | undefined
): company is CompanyInfo {
  if (!company) return false;
  if (!company.name || company.name.trim().length === 0) return false;
  if (company.isDemoPlaceholder) return false;
  if (!company.cnpj || company.cnpj.trim().length === 0) return false;
  return true;
}

/**
 * Resolve os dados da empresa emitente a partir do ambiente.
 * Retorna null quando os dados mínimos (nome e CNPJ) não estão
 * configurados — a emissão definitiva deve então ser bloqueada.
 */
export function resolveCompanyInfoFromEnv(
  env: CompanyEnvInput | undefined = typeof process !== 'undefined'
    ? (process.env as unknown as CompanyEnvInput)
    : {}
): CompanyInfo | null {
  const name = env.REPORT_COMPANY_NAME?.trim();
  const cnpj = env.REPORT_COMPANY_CNPJ?.trim();
  if (!name || !cnpj) return null;

  return {
    name,
    tagline: env.REPORT_COMPANY_TAGLINE?.trim() || 'Inspeção Técnica de Equipamentos',
    cnpj,
    address: env.REPORT_COMPANY_ADDRESS?.trim() || undefined,
    phone: env.REPORT_COMPANY_PHONE?.trim() || undefined,
    email: env.REPORT_COMPANY_EMAIL?.trim() || undefined,
    website: env.REPORT_COMPANY_WEBSITE?.trim() || undefined,
  };
}

/**
 * Empresa fictícia de demonstração para documentos marcados como
 * DEMONSTRAÇÃO. Nunca usada em nenhum laudo definitivo.
 */
export const DEMO_COMPANY_INFO: CompanyInfo = {
  name: 'EMPRESA DEMONSTRAÇÃO',
  tagline: 'DEMONSTRAÇÃO - NÃO VÁLIDO PARA USO TÉCNICO',
  isDemoPlaceholder: true,
};
