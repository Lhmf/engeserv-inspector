/**
 * Engineering Integration Service
 * 
 * Camada de integração entre Engineering Studio (UI) e Engineering Engine
 * Responsável por: carregar casos, montar inputs, validar, executar cálculos, formatar resultados
 */

import type {
  EquipmentData,
  InspectionData,
  MeasurementPoint,
  CalculationInput,
  CalculationResult,
  IntegrityAnalysis,
  SimulationInput,
  SimulationResult,
  ValidationResult,
  MaterialData,
  OperatingConditions,
} from '../types';
import type {
  EngineeringCase,
  IntegrationInput,
  IntegrationResult,
  FormattedCalculationResult,
  FormattedIntegrityAnalysis,
  FormattedSimulationResult,
  CalculationType,
} from './types';
import { engineeringEngine, EngineeringEngineService } from '../services/engine';
import { buildCalculationInput } from '../index';
import { validateCalculationInput, validateUnitConsistency } from '../validators';

// Simple UUID generator to avoid external dependency
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============================================================
// CASOS PREDEFINIDOS (baseados em docs/examples/)
// ============================================================

const PREDEFINED_CASES: Record<string, EngineeringCase> = {
  'V-101': {
    id: 'V-101',
    client: 'Petrobras',
    equipment: 'Vaso de Pressão',
    tag: 'V-101',
    status: 'APROVADO',
    lastInspection: '2024-03-15',
    corrosionRate: 0.133,
    remainingLife: 37.6,
    mawp: 22.38,
    equipmentData: {
      id: 'V-101',
      tag: 'V-101',
      type: 'VASO_DE_PRESSAO',
      designPressureBar: 20,
      originalThicknessMm: 12,
      minThicknessMm: 5.5,
      designCode: 'ASME VIII-1',
      bodyMaterial: 'SA-516 Gr.70',
      jointEfficiency: 1.0,
      corrosionAllowanceMm: 3.0,
      operatingPressureBar: 20,
      operatingTempC: 50,
      volumeLiters: 5000,
    },
    material: {
      name: 'SA-516 Gr.70',
      specification: 'ASME SA-516',
      grade: '70',
      allowableStressMpa: 138,
      minYieldStrengthMpa: 260,
      minTensileStrengthMpa: 485,
    },
  },
  'V-401': {
    id: 'V-401',
    client: 'Braskem',
    equipment: 'Vaso de Pressão',
    tag: 'V-401',
    status: 'REJEITADO',
    lastInspection: '2024-02-20',
    corrosionRate: 0.45,
    remainingLife: 2.1,
    mawp: 4.13,
    equipmentData: {
      id: 'V-401',
      tag: 'V-401',
      type: 'VASO_DE_PRESSAO',
      designPressureBar: 10,
      originalThicknessMm: 10,
      minThicknessMm: 5.5,
      designCode: 'ASME VIII-1',
      bodyMaterial: 'SA-516 Gr.70',
      jointEfficiency: 1.0,
      corrosionAllowanceMm: 3.0,
      operatingPressureBar: 10,
      operatingTempC: 80,
      volumeLiters: 3000,
    },
    material: {
      name: 'SA-516 Gr.70',
      specification: 'ASME SA-516',
      grade: '70',
      allowableStressMpa: 138,
      minYieldStrengthMpa: 260,
      minTensileStrengthMpa: 485,
    },
  },
  'T-205': {
    id: 'T-205',
    client: 'Raízen',
    equipment: 'Tanque de Armazenamento',
    tag: 'T-205',
    status: 'EM_VALIDACAO',
    lastInspection: '2024-04-10',
    corrosionRate: 0.089,
    remainingLife: 45.2,
    mawp: null,
    equipmentData: {
      id: 'T-205',
      tag: 'T-205',
      type: 'TANQUE',
      designPressureBar: 1.03, // ~15 psi
      originalThicknessMm: 12,
      minThicknessMm: 4.5,
      designCode: 'API 650',
      bodyMaterial: 'SA-36',
      jointEfficiency: 0.85,
      corrosionAllowanceMm: 3.0,
      operatingPressureBar: 0.1,
      operatingTempC: 40,
      volumeLiters: 50000,
    },
    material: {
      name: 'SA-36',
      specification: 'ASME SA-36',
      grade: '36',
      allowableStressMpa: 110,
      minYieldStrengthMpa: 250,
      minTensileStrengthMpa: 400,
    },
  },
  'C-312': {
    id: 'C-312',
    client: 'Petrobras',
    equipment: 'Caldeira',
    tag: 'C-312',
    status: 'PLACEHOLDER',
    lastInspection: '2023-11-05',
    corrosionRate: null,
    remainingLife: null,
    mawp: null,
    equipmentData: {
      id: 'C-312',
      tag: 'C-312',
      type: 'CALDEIRA',
      designPressureBar: 15,
      originalThicknessMm: 16,
      minThicknessMm: 7.2,
      designCode: 'ASME I',
      bodyMaterial: 'SA-516 Gr.70',
      jointEfficiency: 1.0,
      corrosionAllowanceMm: 3.0,
      operatingPressureBar: 13,
      operatingTempC: 200,
      volumeLiters: 2000,
    },
    material: {
      name: 'SA-516 Gr.70',
      specification: 'ASME SA-516',
      grade: '70',
      allowableStressMpa: 138,
      minYieldStrengthMpa: 260,
      minTensileStrengthMpa: 485,
    },
  },
};

// ============================================================
// SERVIÇO DE INTEGRAÇÃO
// ============================================================

export class EngineeringIntegrationService {
  private engine: EngineeringEngineService;
  private calculationHistory: Map<string, any[]> = new Map();

  constructor(engine?: EngineeringEngineService) {
    this.engine = engine || engineeringEngine;
  }

  // ============================================================
  // MÉTODOS PÚBLICOS PRINCIPAIS
  // ============================================================

  /**
   * Carrega um caso de engenharia pelo ID
   */
  loadCase(caseId: string): EngineeringCase | null {
    return PREDEFINED_CASES[caseId] || null;
  }

  /**
   * Lista todos os casos disponíveis
   */
  getAllCases(): EngineeringCase[] {
    return Object.values(PREDEFINED_CASES);
  }

  /**
   * Constrói CalculationInput a partir do caso selecionado
   */
  buildCalculationInput(caseId: string, customParams?: Partial<CalculationInput>): IntegrationResult<CalculationInput> {
      const startTime = Date.now();
      const calculationId = `calc-${generateId().slice(0, 8)}`;

      try {
        const engineeringCase = this.loadCase(caseId);
        if (!engineeringCase) {
          return this.createErrorResult(calculationId, caseId, 'Caso não encontrado', startTime);
        }

      const equipment = engineeringCase.equipmentData!;
      const inspection: InspectionData = {
        id: `insp-${caseId}`,
        equipmentId: caseId,
        inspectorId: 'engineer',
        status: 'APROVADA',
        startedAt: new Date(engineeringCase.lastInspection),
        completedAt: new Date(engineeringCase.lastInspection),
        type: 'PERIODICA',
        measurements: [],
      };

      // Gerar medições simuladas baseadas no caso
      const measurements = this.generateMockMeasurements(equipment, engineeringCase);

      // Construir input base
      const baseInput = buildCalculationInput(equipment, inspection, measurements, {
        previousInspectionDate: engineeringCase.corrosionRate ? new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) : undefined,
        previousMinThicknessMm: engineeringCase.corrosionRate 
          ? (equipment.originalThicknessMm || 0) - (engineeringCase.corrosionRate * 1) // 1 ano atrás
          : undefined,
        material: engineeringCase.material,
        operatingConditions: engineeringCase.operatingConditions,
      });

      // Aplicar parâmetros customizados se fornecidos
      const finalInput: CalculationInput = {
        ...baseInput,
        ...customParams,
      };

      return {
        success: true,
        data: finalInput,
        metadata: {
          calculationId,
          caseId,
          calculationType: 'BUILD_INPUT',
          calculatedAt: new Date(),
          calculatedBy: 'system',
          formulaVersion: '1.0.0',
          normativeVersion: 'ASME 2021 / NR-13 2023',
          executionTimeMs: Date.now() - startTime,
          isPlaceholder: true,
        },
      };
    } catch (error) {
      return this.createErrorResult(calculationId, caseId, error instanceof Error ? error.message : 'Erro desconhecido', startTime);
    }
  }

  /**
   * Valida o input de cálculo
   */
  validateInput(input: CalculationInput): ValidationResult {
    const validation = validateCalculationInput(input);
    const unitWarnings = validateUnitConsistency(input);
    
    return {
      ...validation,
      warnings: [...validation.warnings, ...unitWarnings],
    };
  }

  /**
     * Executa cálculo específico baseado no tipo
     */
    async runCalculation(input: IntegrationInput): Promise<IntegrationResult<FormattedIntegrityAnalysis | FormattedCalculationResult | FormattedSimulationResult>> {
      const startTime = Date.now();
      const calculationId = `calc-${generateId().slice(0, 8)}`;

      try {
        // Construir input completo
        const inputResult = this.buildCalculationInput(input.caseId, input.customParams);
      if (!inputResult.success || !inputResult.data) {
        return this.createErrorResult(calculationId, input.caseId, inputResult.error || 'Falha ao construir input', startTime);
      }

      const calcInput = inputResult.data;

      // Validar
      const validation = this.validateInput(calcInput);
      if (!validation.isValid) {
        return this.createErrorResult(calculationId, input.caseId, `Validação falhou: ${validation.errors.map(e => e.message).join('; ')}`, startTime);
      }

      let result: any;

      switch (input.calculationType) {
        case 'FULL_INTEGRITY':
          result = await this.engine.analyzeIntegrity(calcInput);
          return this.formatIntegrityAnalysis(calculationId, input.caseId, result, startTime, validation.warnings.map(w => w.message));

        case 'SIMULATION':
                  const simInput: SimulationInput = {
                    ...calcInput,
                    scenario: (input.customParams as any)?.scenario || 'CURRENT_CONDITIONS',
                    projectionYears: (input.customParams as any)?.projectionYears,
                    assumedCorrosionRateMmPerYear: (input.customParams as any)?.assumedCorrosionRateMmPerYear,
                  };
                  result = await this.engine.simulate(simInput);
                  return this.formatSimulationResult(calculationId, input.caseId, result, startTime, validation.warnings.map(w => w.message));

        case 'MINIMUM_THICKNESS':
        case 'CORROSION_RATE':
        case 'REMAINING_LIFE':
        case 'MAWP':
          // Para cálculos individuais, executar análise completa e extrair o resultado específico
          const fullAnalysis = await this.engine.analyzeIntegrity(calcInput);
          const specificResult = this.extractSpecificCalculation(fullAnalysis, input.calculationType);
          return this.formatSingleCalculation(calculationId, input.caseId, input.calculationType, specificResult, startTime, validation.warnings.map(w => w.message));

        default:
          return this.createErrorResult(calculationId, input.caseId, `Tipo de cálculo não suportado: ${input.calculationType}`, startTime);
      }
    } catch (error) {
      return this.createErrorResult(calculationId, input.caseId, error instanceof Error ? error.message : 'Erro desconhecido', startTime);
    }
  }

  /**
   * Executa simulação
   */
  async runSimulation(input: IntegrationInput): Promise<IntegrationResult<FormattedSimulationResult>> {
    const result = await this.runCalculation({ ...input, calculationType: 'SIMULATION' });
    return result as IntegrationResult<FormattedSimulationResult>;
  }

  /**
   * Formata resultado bruto do Engine para exibição na UI
   */
  formatResult(rawResult: any, calculationType: CalculationType): FormattedCalculationResult {
    // Implementação genérica - será sobrescrita pelos métodos específicos
    return {
      id: generateId(),
      label: calculationType,
      value: rawResult.value?.toString() || '—',
      unit: rawResult.unit || '',
      status: rawResult.status || 'SUCCESS',
      criticality: rawResult.criticality || 'NOT_ASSESSED',
      reliability: rawResult.reliability || 'THEORETICAL',
      explanation: rawResult.explanation || 'Resultado do cálculo',
      normativeReference: rawResult.normativeReference || 'NR-13 / ASME',
      observations: rawResult.observations || [],
      rawValue: rawResult.value,
    };
  }

  /**
   * Obtém histórico de cálculos para um caso
   */
  getCalculationHistory(caseId: string): any[] {
    return this.calculationHistory.get(caseId) || [];
  }

  /**
   * Adiciona entrada ao histórico
   */
  addToHistory(entry: any): void {
    const history = this.calculationHistory.get(entry.caseId) || [];
    history.unshift(entry);
    this.calculationHistory.set(entry.caseId, history.slice(0, 50)); // Manter últimos 50
  }

  // ============================================================
  // MÉTODOS PRIVADOS DE FORMATAÇÃO
  // ============================================================

  private formatIntegrityAnalysis(
    calculationId: string,
    caseId: string,
    analysis: IntegrityAnalysis,
    startTime: number,
    warnings: string[]
  ): IntegrationResult<FormattedIntegrityAnalysis> {
    const formattedCalculations: FormattedCalculationResult[] = [];

    // Espessura Mínima
    if (analysis.minimumThickness) {
      formattedCalculations.push(this.formatCalculationResult(analysis.minimumThickness, 'Espessura Mínima Admissível'));
    }

    // Taxa de Corrosão
    if (analysis.corrosionRate) {
      formattedCalculations.push(this.formatCalculationResult(analysis.corrosionRate, 'Taxa de Corrosão'));
    }

    // Vida Útil
    if (analysis.remainingLife) {
      formattedCalculations.push(this.formatCalculationResult(analysis.remainingLife, 'Vida Útil Remanescente'));
    }

    // PMTA
    if (analysis.mawp) {
      formattedCalculations.push(this.formatCalculationResult(analysis.mawp, 'PMTA (Máx. Pressão Trab. Admissível)'));
    }

    const formatted: FormattedIntegrityAnalysis = {
      equipmentId: analysis.equipmentId,
      inspectionId: analysis.inspectionId,
      overallStatus: analysis.overallStatus,
      overallCriticality: analysis.overallCriticality,
      recommendations: analysis.recommendations,
      riskFactors: analysis.riskFactors.map(rf => ({
        factor: rf.factor,
        description: rf.description,
        severity: rf.severity,
        mitigation: rf.mitigation,
      })),
      calculations: formattedCalculations,
      formulaVersions: analysis.formulaVersions,
      normativeReferences: analysis.normativeReferences,
      analyzedAt: analysis.analyzedAt,
    };

    // Adicionar ao histórico
    this.addToHistory({
      id: calculationId,
      caseId,
      calculationType: 'FULL_INTEGRITY',
      executedAt: new Date(),
      executedBy: 'system',
      resultSummary: `${analysis.overallStatus} - ${analysis.overallCriticality}`,
      status: 'SUCCESS',
      formulaVersion: analysis.formulaVersions.minimumThickness || '1.0.0',
    });

    return {
      success: true,
      data: formatted,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: {
        calculationId,
        caseId,
        calculationType: 'FULL_INTEGRITY',
        calculatedAt: new Date(),
        calculatedBy: 'system',
        formulaVersion: analysis.formulaVersions.minimumThickness || '1.0.0',
        normativeVersion: 'ASME 2021 / NR-13 2023',
        executionTimeMs: Date.now() - startTime,
        isPlaceholder: true,
      },
    };
  }

  private formatSimulationResult(
    calculationId: string,
    caseId: string,
    simResult: SimulationResult,
    startTime: number,
    warnings: string[]
  ): IntegrationResult<FormattedSimulationResult> {
    const formatted: FormattedSimulationResult = {
      scenario: simResult.scenario,
      projectedThicknessMm: simResult.projectedThicknessMm,
      projectedDate: simResult.projectedDate,
      willReachMinThickness: simResult.willReachMinThickness,
      estimatedDateMinThickness: simResult.estimatedDateMinThickness,
      remainingLifeYears: simResult.remainingLifeYears,
      recommendedInspectionIntervalMonths: simResult.recommendedInspectionIntervalMonths,
      warnings: simResult.warnings,
    };

    this.addToHistory({
      id: calculationId,
      caseId,
      calculationType: 'SIMULATION',
      executedAt: new Date(),
      executedBy: 'system',
      resultSummary: `Simulação ${simResult.scenario}: ${simResult.remainingLifeYears} anos vida útil`,
      status: 'SUCCESS',
      formulaVersion: '1.0.0',
    });

    return {
      success: true,
      data: formatted,
      warnings: [...warnings, ...simResult.warnings],
      metadata: {
        calculationId,
        caseId,
        calculationType: 'SIMULATION',
        calculatedAt: new Date(),
        calculatedBy: 'system',
        formulaVersion: '1.0.0',
        normativeVersion: 'API 570/510',
        executionTimeMs: Date.now() - startTime,
        isPlaceholder: true,
      },
    };
  }

  private formatSingleCalculation(
    calculationId: string,
    caseId: string,
    calcType: CalculationType,
    result: CalculationResult<any>,
    startTime: number,
    warnings: string[]
  ): IntegrationResult<FormattedCalculationResult> {
    const formatted = this.formatCalculationResult(result, this.getCalculationLabel(calcType));
    
    this.addToHistory({
      id: calculationId,
      caseId,
      calculationType: calcType,
      executedAt: new Date(),
      executedBy: 'system',
      resultSummary: `${formatted.label}: ${formatted.value} ${formatted.unit}`,
      status: formatted.status === 'ERROR' ? 'ERROR' : 'SUCCESS',
      formulaVersion: result.metadata?.formulaVersion || '1.0.0',
    });

    return {
      success: true,
      data: formatted,
      warnings,
      metadata: {
        calculationId,
        caseId,
        calculationType: calcType,
        calculatedAt: new Date(),
        calculatedBy: 'system',
        formulaVersion: result.metadata?.formulaVersion || '1.0.0',
        normativeVersion: 'ASME / API / NR-13',
        executionTimeMs: Date.now() - startTime,
        isPlaceholder: true,
      },
    };
  }

  private formatCalculationResult(result: CalculationResult<any>, label: string): FormattedCalculationResult {
    // Extrair valor numérico para exibição
    let displayValue = '—';
    if (result.value !== null && result.value !== undefined) {
      if (typeof result.value === 'object') {
        // Para objetos complexos (ex: MinimumThicknessResult), pegar o campo principal
        displayValue = result.value.minimumThicknessMm?.toFixed(2) 
          || result.value.corrosionRateMmPerYear?.toFixed(3)
          || result.value.remainingLifeYears?.toFixed(1)
          || result.value.mawpBar?.toFixed(2)
          || JSON.stringify(result.value);
      } else {
        displayValue = typeof result.value === 'number' ? result.value.toFixed(2) : String(result.value);
      }
    }

    return {
      id: result.metadata?.calculationId || generateId(),
      label,
      value: displayValue,
      unit: result.unit || '',
      status: result.status,
      criticality: result.criticality,
      reliability: result.reliability,
      explanation: result.explanation,
      normativeReference: result.normativeReference,
      observations: result.observations,
      rawValue: result.value,
    };
  }

  private extractSpecificCalculation(analysis: IntegrityAnalysis, calcType: CalculationType): CalculationResult<any> {
    switch (calcType) {
      case 'MINIMUM_THICKNESS':
        return analysis.minimumThickness as any;
      case 'CORROSION_RATE':
        return analysis.corrosionRate as any;
      case 'REMAINING_LIFE':
        return analysis.remainingLife as any;
      case 'MAWP':
        return analysis.mawp as any;
      default:
        return analysis.minimumThickness as any;
    }
  }

  private getCalculationLabel(calcType: CalculationType): string {
    switch (calcType) {
      case 'MINIMUM_THICKNESS': return 'Espessura Mínima Admissível';
      case 'CORROSION_RATE': return 'Taxa de Corrosão';
      case 'REMAINING_LIFE': return 'Vida Útil Remanescente';
      case 'MAWP': return 'PMTA';
      default: return calcType;
    }
  }

  private generateMockMeasurements(equipment: EquipmentData, engineeringCase: EngineeringCase): MeasurementPoint[] {
    const baseThickness = equipment.originalThicknessMm || 10;
    const minThickness = equipment.minThicknessMm || 5;
    const corrosionRate = engineeringCase.corrosionRate || 0;
    
    // Gerar 8 pontos de medição simulados
    const points = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'];
    const yearDiff = corrosionRate > 0 ? 1 : 0; // Anos desde inspeção anterior
    
    return points.map((point, i) => {
      // Variar levemente ao redor da espessura base, com desgaste por corrosão
      const variation = (Math.random() - 0.5) * 1.5; // ±0.75mm
      const wear = corrosionRate * yearDiff;
      const thickness = Math.max(minThickness - 0.5, baseThickness - wear + variation);
      
      return {
        id: `meas-${equipment.id}-${point}`,
        inspectionId: `insp-${equipment.id}`,
        point,
        thicknessMm: Math.round(thickness * 100) / 100,
        angleDeg: i * 45,
        notes: i === 2 ? 'Ponto de menor espessura' : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });
  }

  private createErrorResult(
    calculationId: string,
    caseId: string,
    error: string,
    startTime: number
  ): IntegrationResult<never> {
    return {
      success: false,
      error,
      metadata: {
        calculationId,
        caseId,
        calculationType: 'ERROR',
        calculatedAt: new Date(),
        calculatedBy: 'system',
        formulaVersion: 'N/A',
        normativeVersion: 'N/A',
        executionTimeMs: Date.now() - startTime,
        isPlaceholder: true,
      },
    };
  }
}

// ============================================================
// INSTÂNCIA SINGLETON
// ============================================================

export const engineeringIntegration = new EngineeringIntegrationService();