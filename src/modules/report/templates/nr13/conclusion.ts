/**
 * NR-13 Template — Conclusion (Conclusão e Recomendações)
 * 
 * Página 5: Conclusão técnica, recomendações e próximo item.
 * Conectado diretamente ao TechnicalReport — não gera texto fora do domínio.
 */

import type { TechnicalReport } from '../../types';

export interface ConclusionProps {
  report: TechnicalReport;
}

/**
 * Renderiza a seção de conclusão técnica e recomendações.
 */
export function renderConclusion(data: ConclusionProps): string {
  const { report } = data;
  const { technicalConclusion, recommendations } = report;

  return `
    <div class="nr13-section nr13-conclusion">
      <h2 class="section-title">
        <span class="section-number">10</span>
        CONCLUSÃO TÉCNICA
      </h2>

      <!-- Conclusão principal -->
      <div class="conclusion-block">
        <div class="conclusion-label">Conclusão:</div>
        <div class="conclusion-text">${technicalConclusion.justification || 'Conclusão não disponível.'}</div>
      </div>

      ${technicalConclusion.complianceStatement ? `
      <div class="conclusion-compliance">
        <div class="conclusion-label">Declaração de Conformidade:</div>
        <div class="conclusion-text conclusion-text--compliance">${technicalConclusion.complianceStatement}</div>
      </div>
      ` : ''}

      ${technicalConclusion.restrictions && technicalConclusion.restrictions.length > 0 ? `
      <div class="conclusion-restrictions">
        <div class="conclusion-label">Restrições de Operação:</div>
        <ul class="conclusion-restrictions-list">
          ${technicalConclusion.restrictions.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      ${technicalConclusion.riskFactors && technicalConclusion.riskFactors.length > 0 ? `
      <div class="conclusion-risks">
        <div class="conclusion-label">Fatores de Risco:</div>
        <table class="risks-table">
          <thead>
            <tr>
              <th>Fator</th>
              <th>Descrição</th>
              <th>Severidade</th>
              <th> Mitigação</th>
            </tr>
          </thead>
          <tbody>
            ${technicalConclusion.riskFactors.map(rf => `
              <tr>
                <td class="risk-cell">${rf.factor}</td>
                <td class="risk-cell">${rf.description}</td>
                <td class="risk-cell">
                  <span class="severity-badge severity-badge--${rf.severity.toLowerCase()}">${rf.severity}</span>
                </td>
                <td class="risk-cell">${rf.mitigation || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
    </div>
  `;
}

/**
 * Renderiza a seção de recomendações.
 */
export function renderRecommendations(data: ConclusionProps): string {
  const { report } = data;
  const { recommendations: recs } = report;

  const allSections = [
    { title: 'Ações Imediatas (Críticas)', items: recs.immediate, color: 'red' },
    { title: 'Curto Prazo (até 6 meses)', items: recs.shortTerm, color: 'orange' },
    { title: 'Médio Prazo (6-18 meses)', items: recs.mediumTerm, color: 'blue' },
    { title: 'Longo Prazo (18+ meses)', items: recs.longTerm, color: 'gray' },
  ];

  const hasAny = allSections.some(s => s.items.length > 0);

  return `
    <div class="nr13-section nr13-recommendations">
      <h2 class="section-title">
        <span class="section-number">9</span>
        RECOMENDAÇÕES
      </h2>

      ${!hasAny ? '<p class="no-data">Nenhuma recomendação registrada.</p>' : ''}

      ${allSections.filter(s => s.items.length > 0).map(section => `
        <div class="rec-section">
          <h3 class="rec-section-title rec-section-title--${section.color}">${section.title}</h3>
          <ul class="rec-list">
            ${section.items.map(rec => `
              <li class="rec-item">
                <span class="rec-priority priority-badge priority-badge--${rec.priority.toLowerCase()}">${rec.priority}</span>
                <span class="rec-description">${rec.description}</span>
                ${rec.referencedStandard ? `<span class="rec-ref">(${rec.referencedStandard})</span>` : ''}
              </li>
            `).join('')}
          </ul>
        </div>
      `).join('')}

      <!-- Próxima inspeção -->
      <div class="rec-next-inspection">
        <h3 class="rec-section-title rec-section-title--navy">Próxima Inspeção</h3>
        <div class="next-insp-details">
          <div class="next-insp-row">
            <span class="next-insp-label">Data Recomendada:</span>
            <span class="next-insp-value">${formatDateBR(recs.inspection.nextInspectionDate)}</span>
          </div>
          <div class="next-insp-row">
            <span class="next-insp-label">Intervalo:</span>
            <span class="next-insp-value">${recs.inspection.intervalMonths} meses</span>
          </div>
          <div class="next-insp-row">
            <span class="next-insp-label">Tipo:</span>
            <span class="next-insp-value">${recs.inspection.type}</span>
          </div>
          <div class="next-insp-row">
            <span class="next-insp-label">Escopo:</span>
            <span class="next-insp-value">${recs.inspection.scope.join('; ')}</span>
          </div>
          <div class="next-insp-row">
            <span class="next-insp-label">Critérios:</span>
            <span class="next-insp-value">${recs.inspection.criteria}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function formatDateBR(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}
