/**
 * NR-13 Template — Measurements Table (Tabela de Medições Dinâmica)
 * 
 * Tabela dinâmica de medições ultrassônicas.
 * Suporta qualquer quantidade de linhas.
 * Colunas: Ponto, Localização, Espessura, Condição.
 */

import type { TechnicalReport } from '../../types';
import type { MeasurementPoint } from '@/modules/engineering/types';

export interface MeasurementsProps {
  measurements: MeasurementPoint[];
  minThicknessMm?: number;
  originalThicknessMm?: number;
}

/**
 * Renderiza a tabela de medições dinâmica.
 */
export function renderMeasurements(data: MeasurementsProps): string {
  const { measurements, minThicknessMm, originalThicknessMm } = data;

  if (!measurements || measurements.length === 0) {
    return `
      <div class="nr13-section nr13-measurements">
        <h2 class="section-title">
          <span class="section-number">6</span>
          MEDIÇÕES TÉCNICAS
        </h2>
        <p class="no-data">Nenhuma medição registrada para esta inspeção.</p>
      </div>
    `;
  }

  const rows = measurements.map((m, idx) => {
    const condition = getCondition(m.thicknessMm, minThicknessMm);
    return `
      <tr class="meas-row meas-row--${condition.class}">
        <td class="meas-cell">${m.point}</td>
        <td class="meas-cell">${m.notes || '—'}</td>
        <td class="meas-cell meas-cell--number">${m.thicknessMm.toFixed(2)}</td>
        <td class="meas-cell">
          <span class="condition-badge condition-badge--${condition.class}">${condition.label}</span>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div class="nr13-section nr13-measurements">
      <h2 class="section-title">
        <span class="section-number">6</span>
        MEDIÇÕES TÉCNICAS
      </h2>

      <table class="meas-table">
        <thead>
          <tr>
            <th class="meas-th">Ponto</th>
            <th class="meas-th">Localização / Observação</th>
            <th class="meas-th">Espessura (mm)</th>
            <th class="meas-th">Condição</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <!-- Legenda -->
      <div class="meas-legend">
        <span class="legend-item">
          <span class="condition-badge condition-badge--ok">OK</span>
          Espessura ≥ 110% do mínimo
        </span>
        <span class="legend-item">
          <span class="condition-badge condition-badge--attention">ATENÇÃO</span>
          Entre 100% e 110% do mínimo
        </span>
        <span class="legend-item">
          <span class="condition-badge condition-badge--critical">CRÍTICO</span>
          Abaixo do mínimo
        </span>
      </div>

      ${minThicknessMm ? `
      <div class="meas-ref">
        Espessura mínima admissível: <strong>${minThicknessMm} mm</strong>
        ${originalThicknessMm ? ` | Espessura original: <strong>${originalThicknessMm} mm</strong>` : ''}
      </div>
      ` : ''}
    </div>
  `;
}

function getCondition(thickness: number, minThickness?: number): { label: string; class: string } {
  if (!minThickness || minThickness === 0) {
    return { label: 'OK', class: 'ok' };
  }
  const threshold = minThickness * 1.1;
  if (thickness < minThickness) return { label: 'CRÍTICO', class: 'critical' };
  if (thickness < threshold) return { label: 'ATENÇÃO', class: 'attention' };
  return { label: 'OK', class: 'ok' };
}
