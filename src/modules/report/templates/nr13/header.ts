/**
 * NR-13 Template — Header (Cabeçalho Institucional)
 * 
 * Cabeçalho de 3 zonas para as páginas de conteúdo:
 * - Zona 1: Identidade/logo EngeServ
 * - Zona 2: Título do documento e identificação principal
 * - Zona 3: Controle documental (nº laudo, revisão, data, página)
 * 
 * + Faixa técnica horizontal abaixo do cabeçalho.
 */

import type { TechnicalReport } from '../../types';
import type { CompanyInfo } from './types';

export interface HeaderData {
  report: TechnicalReport;
  company: CompanyInfo;
  pageNumber: number;
  totalPages: number;
  compact?: boolean; // Versão compacta para páginas seguintes
}

/**
 * Gera o HTML do cabeçalho institucional completo (primeira página de conteúdo).
 */
export function renderHeader(data: HeaderData): string {
  const { report, company, pageNumber, totalPages, compact } = data;
  const { identification, equipment, client } = report;

  if (compact) {
    return renderCompactHeader(data);
  }

  return `
    <div class="nr13-header">
      <!-- Zona 1: Identidade EngeServ -->
      <div class="header-zone1">
        <div class="header-logo-icon">ES</div>
        <div class="header-logo-text">
          <span class="header-company">${company.name}</span>
          <span class="header-tagline">${company.tagline}</span>
        </div>
      </div>

      <!-- Zona 2: Título do documento -->
      <div class="header-zone2">
        <div class="header-doc-title">LAUDO TÉCNICO DE INSPEÇÃO</div>
        <div class="header-doc-subtitle">
          <span class="header-nr13">NR-13</span>
          <span class="header-equip-type">${equipment.type.replace(/_/g, ' ')}</span>
        </div>
      </div>

      <!-- Zona 3: Controle documental -->
      <div class="header-zone3">
        <div class="header-ctrl-item">
          <span class="header-ctrl-label">Laudo Nº</span>
          <span class="header-ctrl-value">${identification.reportNumber}</span>
        </div>
        <div class="header-ctrl-item">
          <span class="header-ctrl-label">Revisão</span>
          <span class="header-ctrl-value">v${identification.version}</span>
        </div>
        <div class="header-ctrl-item">
          <span class="header-ctrl-label">Data</span>
          <span class="header-ctrl-value">${formatDateShort(identification.inspectionDate)}</span>
        </div>
        <div class="header-ctrl-item">
          <span class="header-ctrl-label">Página</span>
          <span class="header-ctrl-value">${pageNumber} / ${totalPages}</span>
        </div>
      </div>

      <!-- Faixa técnica horizontal -->
      <div class="header-tech-band">
        <div class="tech-band-item">
          <span class="tech-band-label">Cliente</span>
          <span class="tech-band-value">${client.name}</span>
        </div>
        <div class="tech-band-sep"></div>
        <div class="tech-band-item">
          <span class="tech-band-label">Equipamento</span>
          <span class="tech-band-value">${equipment.tag}</span>
        </div>
        <div class="tech-band-sep"></div>
        <div class="tech-band-item">
          <span class="tech-band-label">TAG</span>
          <span class="tech-band-value">${equipment.tag}</span>
        </div>
        <div class="tech-band-sep"></div>
        <div class="tech-band-item">
          <span class="tech-band-label">Data Inspeção</span>
          <span class="tech-band-value">${formatDateShort(identification.inspectionDate)}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Versão compacta do cabeçalho para páginas seguintes.
 */
function renderCompactHeader(data: HeaderData): string {
  const { report, company, pageNumber, totalPages } = data;
  const { identification } = report;

  return `
    <div class="nr13-header nr13-header--compact">
      <div class="header-compact-left">
        <div class="header-logo-icon header-logo-icon--sm">ES</div>
        <span class="header-company-sm">${company.name}</span>
      </div>
      <div class="header-compact-center">
        <span class="header-compact-title">Laudo Técnico ${identification.reportNumber}</span>
        <span class="header-compact-sub">NR-13 — v${identification.version}</span>
      </div>
      <div class="header-compact-right">
        <span class="header-page-num">${pageNumber} / ${totalPages}</span>
      </div>
    </div>
  `;
}

function formatDateShort(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
