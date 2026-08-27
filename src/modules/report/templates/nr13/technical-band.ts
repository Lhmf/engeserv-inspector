/**
 * NR-13 Template — Technical Band (Faixa Técnica Horizontal)
 * 
 * Faixa técnica horizontal abaixo do cabeçalho,
 * exibindo informações resumidas do equipamento.
 */

import type { TechnicalReport } from '../../types';

export interface TechnicalBandProps {
  report: TechnicalReport;
}

/**
 * Renderiza a faixa técnica horizontal com informações do equipamento.
 */
export function renderTechnicalBand(data: TechnicalBandProps): string {
  const { report } = data;
  const { identification, equipment, client } = report;

  return `
    <div class="nr13-section nr13-technical-band">
      <div class="header-tech-band">
        <div class="tech-band-item">
          <span class="tech-band-label">Cliente</span>
          <span class="tech-band-value">${client.name}</span>
        </div>
        <div class="tech-band-sep"></div>
        <div class="tech-band-item">
          <span class="tech-band-label">Equipamento</span>
          <span class="tech-band-value">${equipment.tag} — ${formatType(equipment.type)}</span>
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

function formatType(type: string): string {
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function formatDateShort(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
