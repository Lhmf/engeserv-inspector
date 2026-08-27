/**
 * NR-13 Template — Cover Page (Página 1)
 * 
 * Capa profissional do Laudo Técnico NR-13.
 * Layout: identidade visual EngeServ + dados do laudo + status.
 */

import type { TechnicalReport } from '../../types';
import type { CompanyInfo } from './types';
import { NR13_COLORS } from './types';

export interface CoverData {
  report: TechnicalReport;
  company: CompanyInfo;
}

/**
 * Gera o HTML da capa do Laudo Técnico NR-13.
 */
export function renderCover(data: CoverData): string {
  const { report, company } = data;
  const { identification, equipment, client, executiveSummary } = report;

  const statusInfo = getStatusDisplay(executiveSummary.overallStatus);

  return `
    <div class="nr13-page nr13-cover" data-page="cover">
      <!-- Barra superior navy -->
      <div class="cover-brand-bar">
        <div class="cover-brand-inner">
          <div class="cover-logo-area">
            <div class="cover-logo-icon">ES</div>
            <div class="cover-logo-text">
              <span class="cover-company-name">${company.name}</span>
              <span class="cover-company-tagline">${company.tagline}</span>
            </div>
          </div>
          <div class="cover-doc-type">
            <span>DOCUMENTO TÉCNICO</span>
          </div>
        </div>
      </div>

      <!-- Conteúdo central -->
      <div class="cover-body">
        <!-- Título principal -->
        <div class="cover-title-block">
          <h1 class="cover-title">LAUDO TÉCNICO<br/>DE INSPEÇÃO</h1>
          <div class="cover-nr13-badge">NR-13</div>
        </div>

        <!-- Linha decorativa -->
        <div class="cover-divider"></div>

        <!-- Dados do laudo -->
        <div class="cover-info-grid">
          <div class="cover-info-item">
            <span class="cover-info-label">LAUDO Nº</span>
            <span class="cover-info-value cover-info-value--large">${identification.reportNumber}</span>
          </div>
          <div class="cover-info-item">
            <span class="cover-info-label">CLIENTE</span>
            <span class="cover-info-value">${client.name}</span>
          </div>
          <div class="cover-info-item">
            <span class="cover-info-label">EQUIPAMENTO</span>
            <span class="cover-info-value">${equipment.tag} — ${equipment.type.replace(/_/g, ' ')}</span>
            ${equipment.description ? `<span class="cover-info-sub">${equipment.description}</span>` : ''}
          </div>
          <div class="cover-info-item">
            <span class="cover-info-label">DATA DA INSPEÇÃO</span>
            <span class="cover-info-value">${formatDateBR(identification.inspectionDate)}</span>
          </div>
          <div class="cover-info-item">
            <span class="cover-info-label">REVISÃO</span>
            <span class="cover-info-value">v${identification.version}</span>
          </div>
          ${identification.artNumber ? `
          <div class="cover-info-item">
            <span class="cover-info-label">ART</span>
            <span class="cover-info-value">${identification.artNumber}</span>
          </div>` : ''}
        </div>

        <!-- Status do equipamento -->
        <div class="cover-status-block">
          <div class="cover-status-label">STATUS GERAL DO EQUIPAMENTO</div>
          <div class="cover-status-badge cover-status-badge--${statusInfo.color}">
            ${statusInfo.label}
          </div>
        </div>
      </div>

      <!-- Rodapé da capa -->
      <div class="cover-footer">
        <div class="cover-footer-line"></div>
        <div class="cover-footer-content">
          <span>${company.name}</span>
          <span>${company.cnpj ? `CNPJ: ${company.cnpj}` : ''}</span>
          <span>${company.address || ''}</span>
        </div>
        <div class="cover-footer-contact">
          ${company.phone ? `<span>Tel: ${company.phone}</span>` : ''}
          ${company.email ? `<span>Email: ${company.email}</span>` : ''}
          ${company.website ? `<span>${company.website}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

function getStatusDisplay(status: string): { label: string; color: string } {
  switch (status) {
    case 'INTEGRO':
      return { label: 'APROVADO', color: 'green' };
    case 'ACEITAVEL_COM_RESTRICOES':
      return { label: 'APROVADO COM RESTRIÇÕES', color: 'yellow' };
    case 'REQUER_REPARO':
      return { label: 'REQUER REPARO', color: 'red' };
    case 'CONDENADO':
      return { label: 'REPROVADO / NÃO CONFORME', color: 'red' };
    default:
      return { label: 'INDETERMINADO', color: 'gray' };
  }
}

function formatDateBR(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}
