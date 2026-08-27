/**
 * NR-13 Template — Status Summary (Status Geral e Resultados Técnicos)
 * 
 * Página 3: Área de destaque visual para o resultado da inspeção,
 * indicadores técnicos e tabela de medições.
 */

import type { TechnicalReport } from '../../types';

export interface StatusSummaryProps {
  report: TechnicalReport;
}

/**
 * Renderiza a seção de status geral e resultados técnicos.
 */
export function renderStatusSummary(data: StatusSummaryProps): string {
  const { report } = data;
  const { executiveSummary, inspectionData, engineeringResults, equipment } = report;

  const statusInfo = getStatusDisplay(executiveSummary.overallStatus);
  const stats = inspectionData.measurementStats;

  return `
    <div class="nr13-section nr13-status-summary">
      <h2 class="section-title">
        <span class="section-number">3</span>
        STATUS GERAL E RESULTADOS TÉCNICOS
      </h2>

      <!-- Destaque do status -->
      <div class="status-highlight status-highlight--${statusInfo.color}">
        <div class="status-highlight-icon">${statusInfo.icon}</div>
        <div class="status-highlight-content">
          <div class="status-highlight-label">RESULTADO DA INSPEÇÃO</div>
          <div class="status-highlight-value">${statusInfo.label}</div>
          <div class="status-highlight-detail">${getConclusionText(executiveSummary.overallStatus)}</div>
        </div>
        <div class="status-highlight-criticality">
          <span class="criticality-badge criticality-badge--${executiveSummary.criticalityLevel.toLowerCase()}">
            ${executiveSummary.criticalityLevel}
          </span>
        </div>
      </div>

      <!-- Indicadores técnicos -->
      <div class="status-indicators">
        <h3 class="subsection-title">Indicadores Técnicos</h3>
        <div class="indicators-grid">
          ${renderIndicator('Espessura Nominal', equipment.originalThicknessMm, 'mm')}
          ${renderIndicator('Espessura Mínima Req.', equipment.minThicknessMm, 'mm')}
          ${renderIndicator('Menor Espessura Encontrada', stats.minThicknessMm, 'mm')}
          ${renderIndicator('Espessura Média', stats.avgThicknessMm, 'mm')}
          ${renderIndicator('Maior Espessura', stats.maxThicknessMm, 'mm')}
          ${renderIndicatorCalc(engineeringResults.calculations, 'calc-cr-001', 'Taxa de Corrosão')}
          ${renderIndicatorCalc(engineeringResults.calculations, 'calc-rl-001', 'Vida Útil Remanescente')}
          ${renderIndicatorCalc(engineeringResults.calculations, 'calc-mawp-001', 'PMTA Calculada')}
        </div>
      </div>

      <!-- Resumo das medições -->
      <div class="status-measurement-summary">
        <h3 class="subsection-title">Resumo das Medições</h3>
        <div class="measurement-summary-grid">
          <div class="summary-card">
            <div class="summary-card-value">${stats.count}</div>
            <div class="summary-card-label">Pontos Medidos</div>
          </div>
          <div class="summary-card ${stats.belowMinCount > 0 ? 'summary-card--danger' : 'summary-card--success'}">
            <div class="summary-card-value">${stats.belowMinCount}</div>
            <div class="summary-card-label">Abaixo do Mínimo</div>
          </div>
          <div class="summary-card">
            <div class="summary-card-value">${stats.belowMinPercentage.toFixed(1)}%</div>
            <div class="summary-card-label">% Abaixo do Mínimo</div>
          </div>
          <div class="summary-card">
            <div class="summary-card-value">${equipment.minThicknessMm ? ((stats.minThicknessMm - equipment.minThicknessMm) / equipment.minThicknessMm * 100).toFixed(1) : '—'}%</div>
            <div class="summary-card-label">Margem sobre Mínimo</div>
          </div>
        </div>
      </div>

      <!-- Próxima inspeção -->
      <div class="status-next-inspection">
        <h3 class="subsection-title">Próxima Inspeção Recomendada</h3>
        <div class="next-inspection-info">
          <div class="next-insp-item">
            <span class="next-insp-label">Data Recomendada:</span>
            <span class="next-insp-value">${formatDateBR(report.nextInspection.recommendedDate)}</span>
          </div>
          <div class="next-insp-item">
            <span class="next-insp-label">Intervalo Máximo:</span>
            <span class="next-insp-value">${report.nextInspection.maxIntervalMonths} meses</span>
          </div>
          <div class="next-insp-item">
            <span class="next-insp-label">Tipo:</span>
            <span class="next-insp-value">${report.nextInspection.type}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderIndicator(label: string, value: number | undefined, unit: string): string {
  return `
    <div class="indicator-card">
      <div class="indicator-label">${label}</div>
      <div class="indicator-value">${value !== undefined ? `${value} ${unit}` : '—'}</div>
    </div>
  `;
}

function renderIndicatorCalc(calculations: any[], calcId: string, label: string): string {
  const calc = calculations.find(c => c.id === calcId);
  if (!calc) {
    return renderIndicator(label, undefined, '');
  }
  return `
    <div class="indicator-card">
      <div class="indicator-label">${label}</div>
      <div class="indicator-value">${calc.value} ${calc.unit}</div>
    </div>
  `;
}

function getStatusDisplay(status: string): { label: string; color: string; icon: string } {
  switch (status) {
    case 'INTEGRO':
      return { label: 'APROVADO', color: 'green', icon: '✓' };
    case 'ACEITAVEL_COM_RESTRICOES':
      return { label: 'APROVADO COM RESTRIÇÕES', color: 'yellow', icon: '⚠' };
    case 'REQUER_REPARO':
      return { label: 'REQUER REPARO', color: 'red', icon: '✗' };
    case 'CONDENADO':
      return { label: 'REPROVADO / NÃO CONFORME', color: 'red', icon: '✗' };
    default:
      return { label: 'INDETERMINADO', color: 'gray', icon: '?' };
  }
}

function getConclusionText(status: string): string {
  switch (status) {
    case 'INTEGRO':
      return 'Equipamento apto para operação nas condições atuais.';
    case 'ACEITAVEL_COM_RESTRICOES':
      return 'Equipamento apto com monitoramento reforçado.';
    case 'REQUER_REPARO':
      return 'Equipamento requer reparo antes de retorno à operação.';
    case 'CONDENADO':
      return 'Equipamento fora de serviço permanentemente.';
    default:
      return 'Dados insuficientes para conclusão definitiva.';
  }
}

function formatDateBR(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}
