/**
 * NR-13 Template — Footer (Rodapé Padronizado)
 * 
 * Rodapé padronizado em todas as páginas:
 * - Nome da empresa
 * - Identificação do documento
 * - Número da página
 * - Total de páginas
 * - Revisão do documento
 */

import type { TechnicalReport } from '../../types';
import type { CompanyInfo } from './types';

export interface FooterData {
  report: TechnicalReport;
  company: CompanyInfo;
  pageNumber: number;
  totalPages: number;
}

/**
 * Renderiza o rodapé padronizado.
 */
export function renderFooter(data: FooterData): string {
  const { report, company, pageNumber, totalPages } = data;
  const { identification } = report;

  return `
    <div class="nr13-footer">
      <div class="footer-line"></div>
      <div class="footer-content">
        <div class="footer-left">
          <span class="footer-company">${company.name}</span>
          <span class="footer-sep">|</span>
          <span class="footer-doc">${identification.reportNumber} — v${identification.version}</span>
        </div>
        <div class="footer-right">
          <span class="footer-page">Página ${pageNumber} de ${totalPages}</span>
          ${identification.status ? `
          <span class="footer-sep">|</span>
          <span class="footer-status">${identification.status}</span>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}
