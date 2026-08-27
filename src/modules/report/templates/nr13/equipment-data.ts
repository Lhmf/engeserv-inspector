/**
 * NR-13 Template — Equipment Data (Dados Técnicos)
 * 
 * Tabelas organizadas com dados técnicos do equipamento:
 * Fabricante, modelo, N/S, ano, TAG, categoria NR-13,
 * pressões, temperaturas, volume, fluido, material, etc.
 */

import type { TechnicalReport } from '../../types';

export interface EquipmentDataProps {
  report: TechnicalReport;
}

/**
 * Renderiza a seção de dados técnicos do equipamento em tabelas.
 */
export function renderEquipmentData(data: EquipmentDataProps): string {
  const { equipment } = data.report;

  return `
    <div class="nr13-section nr13-equipment-data">
      <h2 class="section-title">
        <span class="section-number">2</span>
        DADOS TÉCNICOS DO EQUIPAMENTO
      </h2>

      <!-- Tabela: Identificação -->
      <div class="eq-table-group">
        <h3 class="eq-table-title">Identificação</h3>
        <table class="eq-table">
          <tbody>
            <tr>
              <td class="eq-label">TAG</td>
              <td class="eq-value">${equipment.tag || '—'}</td>
              <td class="eq-label">Tipo</td>
              <td class="eq-value">${formatType(equipment.type)}</td>
            </tr>
            <tr>
              <td class="eq-label">Descrição</td>
              <td class="eq-value eq-value--wide" colspan="3">${equipment.description || '—'}</td>
            </tr>
            <tr>
              <td class="eq-label">Fabricante</td>
              <td class="eq-value">${equipment.manufacturer || '—'}</td>
              <td class="eq-label">Ano Fabricação</td>
              <td class="eq-value">${equipment.manufactureYear || '—'}</td>
            </tr>
            <tr>
              <td class="eq-label">Nº Série</td>
              <td class="eq-value">${equipment.serialNumber || '—'}</td>
              <td class="eq-label">Código de Projeto</td>
              <td class="eq-value">${equipment.designCode || '—'}</td>
            </tr>
            <tr>
              <td class="eq-label">Categoria NR-13</td>
              <td class="eq-value">${equipment.nr13Category || '—'}</td>
              <td class="eq-label">Grupo de Risco</td>
              <td class="eq-value">${equipment.riskGroup || '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tabela: Pressões e Temperaturas -->
      <div class="eq-table-group">
        <h3 class="eq-table-title">Pressões e Temperaturas</h3>
        <table class="eq-table">
          <tbody>
            <tr>
              <td class="eq-label">Pressão de Projeto</td>
              <td class="eq-value">${equipment.designPressureBar ? `${equipment.designPressureBar} bar` : '—'}</td>
              <td class="eq-label">Temperatura de Projeto</td>
              <td class="eq-value">${equipment.designTemperatureC ? `${equipment.designTemperatureC} °C` : '—'}</td>
            </tr>
            <tr>
              <td class="eq-label">Pressão de Operação</td>
              <td class="eq-value">${equipment.operatingPressureBar ? `${equipment.operatingPressureBar} bar` : '—'}</td>
              <td class="eq-label">Temperatura de Operação</td>
              <td class="eq-value">${equipment.operatingTemperatureC ? `${equipment.operatingTemperatureC} °C` : '—'}</td>
            </tr>
            <tr>
              <td class="eq-label">PMTA (MAWP)</td>
              <td class="eq-value">${equipment.mawpBar ? `${equipment.mawpBar} bar` : '—'}</td>
              <td class="eq-label">PTH (Hidrostática)</td>
              <td class="eq-value">${equipment.hydroTestPressureBar ? `${equipment.hydroTestPressureBar} bar` : '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tabela: Material e Dimensões -->
      <div class="eq-table-group">
        <h3 class="eq-table-title">Material e Dimensões</h3>
        <table class="eq-table">
          <tbody>
            <tr>
              <td class="eq-label">Material do Casco</td>
              <td class="eq-value">${equipment.bodyMaterial || '—'}</td>
              <td class="eq-label">Material da Tampa</td>
              <td class="eq-value">${equipment.headMaterial || '—'}</td>
            </tr>
            <tr>
              <td class="eq-label">Tipo de Tampa</td>
              <td class="eq-value">${equipment.headType || '—'}</td>
              <td class="eq-label">Eficiência de Solda</td>
              <td class="eq-value">${equipment.jointEfficiency ? `${(equipment.jointEfficiency * 100).toFixed(0)}%` : '—'}</td>
            </tr>
            <tr>
              <td class="eq-label">Espessura Original</td>
              <td class="eq-value">${equipment.originalThicknessMm ? `${equipment.originalThicknessMm} mm` : '—'}</td>
              <td class="eq-label">Espessura Mínima</td>
              <td class="eq-value">${equipment.minThicknessMm ? `${equipment.minThicknessMm} mm` : '—'}</td>
            </tr>
            <tr>
              <td class="eq-label">Sobra de Corrosão</td>
              <td class="eq-value">${equipment.corrosionAllowanceMm ? `${equipment.corrosionAllowanceMm} mm` : '—'}</td>
              <td class="eq-label">Volume</td>
              <td class="eq-value">${equipment.volumeLiters ? `${equipment.volumeLiters} L` : '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tabela: Fluidos e Classificação -->
      <div class="eq-table-group">
        <h3 class="eq-table-title">Fluidos e Classificação</h3>
        <table class="eq-table">
          <tbody>
            <tr>
              <td class="eq-label">Fluido</td>
              <td class="eq-value">${equipment.fluidType || '—'}</td>
              <td class="eq-label">Classe do Fluido</td>
              <td class="eq-value">${equipment.fluidClass || '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function formatType(type: string): string {
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
