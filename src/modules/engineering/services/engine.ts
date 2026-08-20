/**
 * Engineering Engine - Serviços de Aplicação
 * 
 * Orquestra os cálculos e fornece APIs de alto nível para o sistema.
 */

import type {
  OperatingConditions,
  CalculationInput,
  CalculationResult,
  EquipmentData,
  InspectionData,
  MeasurementPoint,
  CorrosionData,
  IntegrityAnalysis,
  IntegrityStatus,
  CriticalityLevel,
  SimulationInput,
  SimulationResult,
  RiskFactor,
} from '../types';
import { validateCalculationInput, validateUnitConsistency } from '../validators';
import { 
  calculators, 
  MinimumThicknessInput,
  CorrosionRateInput,
  RemainingLifeInput,
  MawpInput,
} from '../calculations';
import { ENGINE_CONFIG } from '../constants';

// ============================================================
// SERVIÇO PRINCIPAL DO MOTOR
// ============================================================

export class EngineeringEngineService {
  private calculationLog: Array<{
    calculationId: string;
    calculatedAt: Date;
    calculatedBy: string;
    formulaVersion: string;
    normativeVersion: string;
    inputs: Record<string, any>;
    results: Record<string, any>;
  }> = [];
  
  /**
   * Executa análise completa de integridade de um equipamento
   */
  async analyzeIntegrity(input: CalculationInput): Promise<IntegrityAnalysis> {
    // Validar entrada
    const validation = validateCalculationInput(input);
    const unitWarnings = validateUnitConsistency(input);
    
    if (!validation.isValid) {
      throw new Error(`Validação falhou: ${validation.errors.map(e => e.message).join('; ')}`);
    }
    
    const equipment = input.equipment;
    const inspection = input.inspection;
    const measurements = input.measurements;
    
    // Encontrar menor espessura medida
    const currentThicknessMm = measurements.length > 0
      ? Math.min(...measurements.map(m => m.thicknessMm))
      : equipment.originalThicknessMm || 0;
    
    // Preparar parâmetros
    const minThicknessMm = equipment.minThicknessMm || 0;
    const corrosionAllowanceMm = equipment.corrosionAllowanceMm || 
      (equipment.type && (require('../constants').DEFAULT_CORROSION_ALLOWANCE_MM as Record<string, number>)[equipment.type]) || 3.0;
    const jointEfficiency = equipment.jointEfficiency || 1.0;
    const safetyFactor = input.safetyFactor || 1.5;
    
    // Determinar tensão admissível do material
    const allowableStressMpa = this.getAllowableStress(equipment, input.operatingConditions);
    
    // Diâmetro interno estimado (se não tiver, usar estimativa baseada no volume)
    const insideDiameterMm = this.estimateInsideDiameter(equipment);
    
    // Preparar inputs para cálculos individuais
    const tminInput: MinimumThicknessInput = {
      designPressureBar: equipment.designPressureBar || 0,
      operatingPressureBar: equipment.operatingPressureBar,
      mawpBar: equipment.mawpBar,
      insideDiameterMm,
      jointEfficiency,
      allowableStressMpa,
      corrosionAllowanceMm,
      designCode: this.mapDesignCode(equipment.designCode),
    };
    
    // 1. Espessura mínima
    const minimumThicknessResult = calculators.minimumThickness.calculate(tminInput);
    
    // 2. Taxa de corrosão (se houver inspeção anterior)
    let corrosionRateResult: CalculationResult<any> | null = null;
    if (input.previousMinThicknessMm && input.previousInspectionDate) {
      const yearsDiff = (new Date().getTime() - new Date(input.previousInspectionDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      const crInput: CorrosionRateInput = {
        currentThicknessMm,
        previousThicknessMm: input.previousMinThicknessMm,
        timeIntervalYears: yearsDiff,
      };
      corrosionRateResult = calculators.corrosionRate.calculate(crInput);
    }
    
    // 3. Vida útil remanescente
    let remainingLifeResult: CalculationResult<any> | null = null;
    if (corrosionRateResult && corrosionRateResult.value && corrosionRateResult.value.corrosionRateMmPerYear > 0) {
      const rlInput: RemainingLifeInput = {
        currentThicknessMm,
        minimumThicknessMm: minimumThicknessResult.value?.minimumThicknessMm || minThicknessMm,
        corrosionRateMmPerYear: corrosionRateResult.value.corrosionRateMmPerYear,
        safetyMarginMm: 1.0, // Margem de 1mm
      };
      remainingLifeResult = calculators.remainingLife.calculate(rlInput);
    } else if (currentThicknessMm > minThicknessMm) {
      // Sem taxa de corrosão, usar margem simples
      remainingLifeResult = calculators.remainingLife.calculate({
        currentThicknessMm,
        minimumThicknessMm: minimumThicknessResult.value?.minimumThicknessMm || minThicknessMm,
        corrosionRateMmPerYear: 0,
      });
    }
    
    // 4. PMTA
    let mawpResult: CalculationResult<any> | null = null;
    if (insideDiameterMm > 0 && allowableStressMpa > 0) {
      const mawpInput: MawpInput = {
        currentThicknessMm,
        insideDiameterMm,
        jointEfficiency,
        allowableStressMpa,
        corrosionAllowanceMm,
        designCode: this.mapDesignCode(equipment.designCode),
      };
      mawpResult = calculators.mawp.calculate(mawpInput);
    }
    
    // 5. Determinar status geral
    const { overallStatus, overallCriticality, recommendations, riskFactors } = this.determineOverallStatus({
      minimumThickness: minimumThicknessResult,
      corrosionRate: corrosionRateResult,
      remainingLife: remainingLifeResult,
      mawp: mawpResult,
      currentThicknessMm,
      minThicknessMm,
      equipment,
    });
    
    // Próxima inspeção recomendada
    let nextInspectionDate: Date | undefined;
    if (remainingLifeResult && remainingLifeResult.value && remainingLifeResult.value.recommendedInspectionIntervalMonths) {
      nextInspectionDate = new Date();
      nextInspectionDate.setMonth(nextInspectionDate.getMonth() + remainingLifeResult.value.recommendedInspectionIntervalMonths);
    }
    
    // Compilar análise
    const analysis: IntegrityAnalysis = {
      equipmentId: equipment.id,
      inspectionId: inspection.id,
      analyzedAt: new Date(),
      analyzedBy: 'system', // Será preenchido pelo caller com o user ID
      minimumThickness: minimumThicknessResult as any,
      corrosionRate: corrosionRateResult as any,
      remainingLife: remainingLifeResult as any,
      mawp: mawpResult as any,
      nextInspectionDate: nextInspectionDate ? { value: nextInspectionDate } as any : undefined,
      overallStatus,
      overallCriticality,
      recommendations,
      riskFactors,
      formulaVersions: {
        minimumThickness: minimumThicknessResult.metadata.formulaVersion,
        corrosionRate: corrosionRateResult?.metadata.formulaVersion || 'N/A',
        remainingLife: remainingLifeResult?.metadata.formulaVersion || 'N/A',
        mawp: mawpResult?.metadata.formulaVersion || 'N/A',
      },
      normativeReferences: [
        'ASME BPVC VIII-1 2021',
        'API 570 2016',
        'API 510 2020',
        'NR-13 2023',
      ].filter((ref, idx, arr) => arr.indexOf(ref) === idx),
    };
    
    // Log do cálculo
    this.logCalculation({
      calculationId: `integrity-${Date.now()}`,
      calculatedAt: new Date(),
      calculatedBy: 'system',
      formulaVersion: '1.0.0',
      normativeVersion: 'ASME 2021 / NR-13 2023',
      inputs: {
        equipmentId: equipment.id,
        inspectionId: inspection.id,
        measurementsCount: measurements.length,
        hasPreviousData: !!input.previousMinThicknessMm,
      },
      results: {
        minimumThickness: minimumThicknessResult.value,
        corrosionRate: corrosionRateResult?.value,
        remainingLife: remainingLifeResult?.value,
        mawp: mawpResult?.value,
        overallStatus,
        overallCriticality,
      },
    });
    
    return analysis;
  }
  
  /**
   * Simula cenários futuros
   */
  async simulate(input: SimulationInput): Promise<SimulationResult> {
    // Usar calculadora de vida útil para projeção
    const { currentThicknessMm, minimumThicknessMm, corrosionRateMmPerYear } = this.extractSimulationParams(input);
    
    if (corrosionRateMmPerYear <= 0) {
      return {
        scenario: input.scenario,
        projectedThicknessMm: currentThicknessMm,
        projectedDate: new Date(Date.now() + (input.projectionYears || 5) * 365 * 24 * 60 * 60 * 1000),
        willReachMinThickness: false,
        remainingLifeYears: 999,
        recommendedInspectionIntervalMonths: 60,
        warnings: ['Taxa de corrosão zero - projeção não aplicável'],
      };
    }
    
    const projectionYears = input.projectionYears || 5;
    const assumedRate = input.assumedCorrosionRateMmPerYear || corrosionRateMmPerYear;
    const projectedThicknessMm = currentThicknessMm - (assumedRate * projectionYears);
    const willReachMinThickness = projectedThicknessMm <= minimumThicknessMm;
    const estimatedDateMinThickness = willReachMinThickness
      ? new Date(Date.now() + ((currentThicknessMm - minimumThicknessMm) / assumedRate) * 365 * 24 * 60 * 60 * 1000)
      : undefined;
    
    return {
      scenario: input.scenario,
      projectedThicknessMm: Math.round(projectedThicknessMm * 100) / 100,
      projectedDate: new Date(Date.now() + projectionYears * 365 * 24 * 60 * 60 * 1000),
      willReachMinThickness,
      estimatedDateMinThickness,
      remainingLifeYears: Math.round((currentThicknessMm - minimumThicknessMm) / assumedRate * 10) / 10,
      recommendedInspectionIntervalMonths: Math.min(Math.max(Math.round((currentThicknessMm - minimumThicknessMm) / assumedRate * 6), 6), 60),
      warnings: [
        `Simulação baseada em taxa de corrosão assumida: ${assumedRate.toFixed(3)} mm/ano`,
        willReachMinThickness ? 'ATENÇÃO: Equipamento atingirá espessura mínima no período projetado' : '',
      ].filter(Boolean),
    };
  }
  
  /**
   * Obtém log de cálculos
   */
  getCalculationLog() {
    return [...this.calculationLog].sort((a, b) => b.calculatedAt.getTime() - a.calculatedAt.getTime());
  }
  
  /**
   * Limpa log
   */
  clearLog() {
    this.calculationLog = [];
  }
  
  // ============================================================
  // MÉTODOS PRIVADOS
  // ============================================================
  
  private logCalculation(logEntry: typeof this.calculationLog[0]) {
    this.calculationLog.push(logEntry);
    // Manter apenas últimos 1000 logs
    if (this.calculationLog.length > 1000) {
      this.calculationLog = this.calculationLog.slice(-1000);
    }
  }
  
  private getAllowableStress(equipment: EquipmentData, operatingConditions?: OperatingConditions): number {
      // Tentar obter do material especificado
      if (equipment.bodyMaterial) {
        // Normalizar o material: "SA-516 Gr.70" -> "SA-516_GR70"
        // Manter o traço em SA-516, converter espaço e ponto
        const normalizedMaterial = equipment.bodyMaterial
          .replace(/\s+/g, '_')  // espaços -> _
          .replace(/\./g, '')    // remove pontos
          .replace(/GR_/g, 'GR') // corrige GR_ para GR
          .toUpperCase();
      
        const materialRef = (require('../constants').MATERIAL_REFERENCES as Record<string, any>)[normalizedMaterial];
      
        if (materialRef && operatingConditions?.designTempC) {
          // Interpolar tensão admissível pela temperatura
          const temps = Object.keys(materialRef.allowableStressByTempMpa).map(Number).sort((a, b) => a - b);
          const temp = operatingConditions.designTempC;
          let stress = materialRef.allowableStressByTempMpa[temps[0]];
          for (const t of temps) {
            if (temp <= t) {
              stress = materialRef.allowableStressByTempMpa[t];
              break;
            }
          }
          return stress;
        }
        // Retornar valor a temperatura ambiente se não tiver temperatura
        const temps = Object.keys(materialRef.allowableStressByTempMpa).map(Number).sort((a, b) => a - b);
        return materialRef.allowableStressByTempMpa[temps[0]];
      }
      // Default conservador para aço carbono
      return 138; // MPa (SA-516 Gr.70 a 50°C)
    }
  
  private estimateInsideDiameter(equipment: EquipmentData): number {
    if (equipment.volumeLiters && equipment.volumeLiters > 0) {
      // Estimar diâmetro assumindo cilindro com L/D = 3 (típico)
      // V = π * (D/2)² * L = π * D³ / 4 * 3 = 3π * D³ / 4
      // D = (4V / 3π)^(1/3)
      const volumeM3 = equipment.volumeLiters / 1000;
      const diameterM = Math.pow((4 * volumeM3) / (3 * Math.PI), 1/3);
      return Math.round(diameterM * 1000); // mm
    }
    // Default conservador
    return 1000; // 1 metro
  }
  
  private mapDesignCode(designCode?: string): 'ASME_VIII_DIV1' | 'ASME_VIII_DIV2' | 'API_650' | 'OTHER' {
    if (!designCode) return 'ASME_VIII_DIV1';
    const code = designCode.toUpperCase();
    if (code.includes('VIII') && code.includes('DIV.1')) return 'ASME_VIII_DIV1';
    if (code.includes('VIII') && code.includes('DIV.2')) return 'ASME_VIII_DIV2';
    if (code.includes('API 650') || code.includes('API650')) return 'API_650';
    return 'OTHER';
  }
  
  private determineOverallStatus(params: {
    minimumThickness: CalculationResult<any>;
    corrosionRate: CalculationResult<any> | null;
    remainingLife: CalculationResult<any> | null;
    mawp: CalculationResult<any> | null;
    currentThicknessMm: number;
    minThicknessMm: number;
    equipment: EquipmentData;
  }): {
    overallStatus: IntegrityStatus;
    overallCriticality: CriticalityLevel;
    recommendations: string[];
    riskFactors: RiskFactor[];
  } {
    const recommendations: string[] = [];
    const riskFactors: RiskFactor[] = [];
    let overallCriticality: CriticalityLevel = 'LOW';
    let overallStatus: IntegrityStatus = 'INTEGRO';
    
    const { minimumThickness, corrosionRate, remainingLife, mawp, currentThicknessMm, minThicknessMm } = params;
    
    // Verificar espessura atual vs mínima
    if (currentThicknessMm <= minThicknessMm) {
      overallStatus = 'CONDENADO';
      overallCriticality = 'CRITICAL';
      riskFactors.push({
        factor: 'Espessura abaixo do mínimo',
        description: `Espessura atual (${currentThicknessMm} mm) <= mínima (${minThicknessMm} mm)`,
        severity: 'CRITICAL',
        mitigation: 'Retirar de serviço imediatamente para reparo ou substituição',
      });
      recommendations.push('EQUIPAMENTO FORA DE SERVIÇO - Espessura abaixo do mínimo admissível');
    }
    
    // Verificar margem de espessura
    const marginPercent = ((currentThicknessMm - minThicknessMm) / minThicknessMm) * 100;
    if (marginPercent <= 10) {
      overallStatus = overallStatus === 'INTEGRO' ? 'REQUER_REPARO' : overallStatus;
      overallCriticality = 'CRITICAL';
      riskFactors.push({
        factor: 'Margem de espessura crítica',
        description: `Margem de apenas ${marginPercent.toFixed(1)}% acima do mínimo`,
        severity: 'CRITICAL',
        mitigation: 'Planejar reparo/substituição urgente; reduzir intervalo de inspeção',
      });
      recommendations.push('Margem de espessura crítica (< 10%) - Requer ação imediata');
    } else if (marginPercent <= 20) {
      overallStatus = overallStatus === 'INTEGRO' ? 'ACEITAVEL_COM_RESTRICOES' : overallStatus;
      overallCriticality = overallCriticality === 'LOW' ? 'HIGH' : overallCriticality;
      riskFactors.push({
        factor: 'Margem de espessura reduzida',
        description: `Margem de ${marginPercent.toFixed(1)}% acima do mínimo`,
        severity: 'HIGH',
        mitigation: 'Monitorar de perto; reduzir intervalo de inspeção para 6-12 meses',
      });
      recommendations.push('Margem de espessura reduzida (10-20%) - Aumentar frequência de inspeção');
    }
    
    // Verificar taxa de corrosão
    if (corrosionRate && corrosionRate.value && corrosionRate.value.corrosionRateMmPerYear > 0) {
      const rate = corrosionRate.value.corrosionRateMmPerYear;
      if (rate > 5) {
        overallCriticality = 'CRITICAL';
        riskFactors.push({
          factor: 'Taxa de corrosão muito alta',
          description: `${rate.toFixed(3)} mm/ano`,
          severity: 'CRITICAL',
          mitigation: 'Investigar causa raiz; considerar proteção catódica, inibidores ou substituição de material',
        });
        recommendations.push('Taxa de corrosão crítica - Investigar e mitigar causa raiz');
      } else if (rate > 1) {
        overallCriticality = overallCriticality === 'LOW' ? 'HIGH' : overallCriticality;
        riskFactors.push({
          factor: 'Taxa de corrosão elevada',
          description: `${rate.toFixed(3)} mm/ano`,
          severity: 'HIGH',
          mitigation: 'Monitorar tendência; avaliar proteção anticorrosiva',
        });
        recommendations.push('Taxa de corrosão elevada - Avaliar medidas de proteção');
      }
    }
    
    // Verificar vida útil
    if (remainingLife && remainingLife.value && remainingLife.value.remainingLifeYears < 999) {
      const life = remainingLife.value.remainingLifeYears;
      if (life < 1) {
        overallStatus = 'REQUER_REPARO';
        overallCriticality = 'CRITICAL';
        recommendations.push('Vida útil inferior a 1 ano - Planejar substituição/reparo urgente');
      } else if (life < 3) {
        overallStatus = overallStatus === 'INTEGRO' ? 'ACEITAVEL_COM_RESTRICOES' : overallStatus;
        overallCriticality = overallCriticality === 'LOW' ? 'HIGH' : overallCriticality;
        recommendations.push(`Vida útil curta (${life.toFixed(1)} anos) - Planejar substituição`);
      }
    }
    
    // Verificar PMTA vs pressão de operação
    if (mawp && mawp.value && params.equipment.operatingPressureBar) {
      const mawpBar = mawp.value.mawpBar;
      const opPressure = params.equipment.operatingPressureBar;
      if (mawpBar < opPressure) {
        overallStatus = 'CONDENADO';
        overallCriticality = 'CRITICAL';
        riskFactors.push({
          factor: 'PMTA abaixo da pressão de operação',
          description: `PMTA calculada (${mawpBar.toFixed(1)} bar) < Pressão de operação (${opPressure} bar)`,
          severity: 'CRITICAL',
          mitigation: 'Reduzir pressão de operação imediatamente ou retirar de serviço',
        });
        recommendations.push('ALERTA CRÍTICO: PMTA abaixo da pressão de operação - Reduzir pressão imediatamente');
      } else if (mawpBar < opPressure * 1.1) {
        overallCriticality = overallCriticality === 'LOW' ? 'MEDIUM' : overallCriticality;
        riskFactors.push({
          factor: 'PMTA próxima da pressão de operação',
          description: `PMTA (${mawpBar.toFixed(1)} bar) / Pressão op. (${opPressure} bar) = ${(mawpBar/opPressure).toFixed(2)}`,
          severity: 'MEDIUM',
          mitigation: 'Monitorar pressão; não aumentar pressão de operação',
        });
        recommendations.push('PMTA próxima da pressão de operação - Não aumentar carga');
      }
    }
    
    // Recomendações padrão se tudo OK
    if (overallStatus === 'INTEGRO') {
      recommendations.push('Equipamento íntegro - Continuar inspeções periódicas conforme cronograma');
      recommendations.push('Manter registros de medições para cálculo de taxa de corrosão');
    }
    
    return { overallStatus, overallCriticality, recommendations, riskFactors };
  }
  
  private extractSimulationParams(input: SimulationInput): {
    currentThicknessMm: number;
    minimumThicknessMm: number;
    corrosionRateMmPerYear: number;
  } {
    const measurements = input.measurements;
    const currentThicknessMm = measurements.length > 0
      ? Math.min(...measurements.map(m => m.thicknessMm))
      : input.equipment.originalThicknessMm || 0;
    
    const minimumThicknessMm = input.equipment.minThicknessMm || 0;
    
    let corrosionRateMmPerYear = 0;
    if (input.corrosionRateMmPerYear) {
      corrosionRateMmPerYear = input.corrosionRateMmPerYear;
    } else if (input.previousMinThicknessMm && input.previousInspectionDate) {
      const yearsDiff = (new Date().getTime() - new Date(input.previousInspectionDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      corrosionRateMmPerYear = (input.previousMinThicknessMm - currentThicknessMm) / yearsDiff;
    }
    
    return { currentThicknessMm, minimumThicknessMm, corrosionRateMmPerYear };
  }
}

// Instância singleton
export const engineeringEngine = new EngineeringEngineService();