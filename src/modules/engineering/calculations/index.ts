/**
 * Engineering Engine - Cálculos Fundamentais (Interfaces)
 * 
 * Define as interfaces para todos os cálculos do motor.
 * IMPLEMENTAÇÕES REAIS DEVEM SER VALIDADAS COM ENGENHEIRO RESPONSÁVEL.
 * Este arquivo contém apenas a estrutura - NÃO implementa fórmulas definitivas.
 */

import type {
  CalculationInput,
  CalculationResult,
  CorrosionData,
  EquipmentData,
  InspectionData,
  MeasurementPoint,
  OperatingConditions,
  SimulationInput,
  SimulationResult,
  IntegrityAnalysis,
  IntegrityStatus,
  RiskFactor,
  CriticalityLevel,
  ValidationResult,
} from '../types';
import { validateCalculationInput, validateUnitConsistency } from '../validators';

// ============================================================
// INTERFACE BASE PARA TODOS OS CÁLCULOS
// ============================================================

export interface ICalculator<TInput, TOutput> {
  /** Executa o cálculo */
  calculate(input: TInput): CalculationResult<TOutput>;
  
  /** Valida as entradas antes do cálculo */
  validate(input: TInput): ValidationResult;
  
  /** Simula cenários */
  simulate?(input: SimulationInput): SimulationResult;
  
  /** Gera análise textual */
  generateAnalysis?(result: CalculationResult<TOutput>): string;
}

// ============================================================
// CÁLCULO 1: ESPESURA MÍNIMA ADMISSÍVEL (t_min)
// ============================================================

export interface MinimumThicknessInput {
  // Pressões
  designPressureBar: number;
  operatingPressureBar?: number;
  mawpBar?: number;
  
  // Geometria
  insideDiameterMm: number;           // Diâmetro interno (mm)
  jointEfficiency: number;            // Eficiência de junta (E)
  
  // Material
  allowableStressMpa: number;         // Tensão admissível do material (MPa) à temperatura de projeto
  
  // Sobre-espessura
  corrosionAllowanceMm: number;       // Ca - sobre-espessura de corrosão (mm)
  
  // Código de projeto
  designCode: 'ASME_VIII_DIV1' | 'ASME_VIII_DIV2' | 'API_650' | 'NR13' | 'OTHER';
  
  // Parâmetros específicos por código
  // ASME VIII-1: t = (P * R) / (S * E - 0.6 * P) + Ca
  // ASME VIII-2: mais complexo, requer análise por elementos finitos
  // API 650: t = (P * D) / (2 * S * E) + Ca (para tanques atmosféricos)
  // NR-13: segue ASME VIII-1 para vasos, API 650 para tanques
}

export interface MinimumThicknessResult {
  minimumThicknessMm: number;         // t_min calculado
  nominalThicknessMm: number;         // t_nominal = t_min + tolerância de fabricação
  components: {
    pressureComponentMm: number;      // Componente de pressão
    corrosionAllowanceMm: number;     // Ca
    totalMm: number;
  };
  formulaUsed: string;                // Fórmula utilizada
  codeReference: string;              // Referência do código (ex: "ASME VIII-1 UG-27")
  assumptions: string[];              // Suposições feitas
}

/**
 * Calcula espessura mínima admissível
 * 
 * FÓRMULAS DE REFERÊNCIA (NÃO IMPLEMENTADAS - PLACEHOLDERS):
 * 
 * ASME VIII-1 (Casco cilíndrico sob pressão interna):
 * t = (P * R) / (S * E - 0.6 * P) + Ca
 * Onde:
 * - P = pressão de projeto (MPa)
 * - R = raio interno (mm)
 * - S = tensão admissível (MPa)
 * - E = eficiência de junta
 * - Ca = sobre-espessura de corrosão
 * 
 * ASME VIII-1 (Tampo elipsoidal):
 * t = (P * D) / (2 * S * E - 0.2 * P) + Ca
 * 
 * API 650 (Tanque atmosférico - chapa de fundo/anéis):
 * t = (P * D) / (2 * S * E) + Ca (P em bar, D em mm, S em MPa)
 * 
 * NR-13 (Item 13.5.2 - segue ASME para vasos, API 650 para tanques)
 * 
 * IMPORTANTE: Implementação real deve ser validada com engenheiro.
 */
export class MinimumThicknessCalculator implements ICalculator<MinimumThicknessInput, MinimumThicknessResult> {
  validate(input: MinimumThicknessInput): ValidationResult {
    const errors: ValidationResult['errors'] = [];
    const warnings: ValidationResult['warnings'] = [];
    const missingFields: string[] = [];
    
    if (!input.designPressureBar || input.designPressureBar <= 0) {
      missingFields.push('designPressureBar');
    }
    
    if (!input.insideDiameterMm || input.insideDiameterMm <= 0) {
      missingFields.push('insideDiameterMm');
    }
    
    if (!input.jointEfficiency || input.jointEfficiency <= 0 || input.jointEfficiency > 1) {
      missingFields.push('jointEfficiency');
    }
    
    if (!input.allowableStressMpa || input.allowableStressMpa <= 0) {
      missingFields.push('allowableStressMpa');
    }
    
    if (input.corrosionAllowanceMm === undefined || input.corrosionAllowanceMm < 0) {
      missingFields.push('corrosionAllowanceMm');
    }
    
    if (!input.designCode) {
      missingFields.push('designCode');
    }
    
    // Validações de consistência
    if (input.designPressureBar && input.allowableStressMpa) {
      const pressureMpa = input.designPressureBar * 0.1;
      const maxPressureForFormula = input.allowableStressMpa * input.jointEfficiency / 0.6;
      if (pressureMpa >= maxPressureForFormula) {
        errors.push({
          field: 'designPressureBar',
          code: 'PRESSURE_EXCEEDS_FORMULA_LIMIT',
          message: `Pressão de projeto excede limite da fórmula ASME VIII-1 (P < S*E/0.6)`,
          severity: 'ERROR',
        });
      }
    }
    
    return {
      isValid: errors.length === 0 && missingFields.length === 0,
      errors,
      warnings,
      missingFields,
    };
  }
  
  calculate(input: MinimumThicknessInput): CalculationResult<MinimumThicknessResult> {
    const validation = this.validate(input);
    
    if (!validation.isValid) {
      return {
        value: null as any,
        unit: 'mm',
        status: 'ERROR',
        criticality: 'CRITICAL',
        explanation: 'Validação falhou - dados insuficientes ou inválidos',
        normativeReference: 'ASME VIII-1 / NR-13',
        reliability: 'LOW',
        observations: validation.errors.map(e => e.message),
        metadata: {
          calculationId: `tmin-${Date.now()}`,
          calculatedAt: new Date(),
          calculatedBy: 'system',
          formulaVersion: '1.0.0',
          normativeVersion: 'ASME 2021 / NR-13 2023',
          inputs: input,
          warnings: validation.warnings.map(w => w.message),
        },
      };
    }
    
    // PLACEHOLDER - NÃO IMPLEMENTAR FÓRMULA REAL AQUI
    // A implementação real deve ser feita após validação do engenheiro
    const pressureMpa = input.designPressureBar * 0.1;
    const radiusMm = input.insideDiameterMm / 2;
    
    // Exemplo ASME VIII-1 UG-27 (cilindro) - PLACEHOLDER
    // t = (P * R) / (S * E - 0.6 * P) + Ca
    const denominator = input.allowableStressMpa * input.jointEfficiency - 0.6 * pressureMpa;
    const pressureComponentMm = denominator > 0 ? (pressureMpa * radiusMm) / denominator : 0;
    const minimumThicknessMm = pressureComponentMm + input.corrosionAllowanceMm;
    
    return {
      value: {
        minimumThicknessMm: Math.round(minimumThicknessMm * 100) / 100,
        nominalThicknessMm: Math.round((minimumThicknessMm * 1.1) * 100) / 100, // +10% tolerância
        components: {
          pressureComponentMm: Math.round(pressureComponentMm * 100) / 100,
          corrosionAllowanceMm: input.corrosionAllowanceMm,
          totalMm: Math.round(minimumThicknessMm * 100) / 100,
        },
        formulaUsed: 't = (P * R) / (S * E - 0.6 * P) + Ca  (ASME VIII-1 UG-27 cilindro)',
        codeReference: 'ASME BPVC VIII-1 UG-27 / NR-13 Item 13.5.2',
        assumptions: [
          'Cilindro fino (R/t > 10)',
          'Pressão interna apenas',
          'Sem efeitos de flambagem',
          'Material isotrópico e homogêneo',
          'Temperatura dentro dos limites da tabela de tensões admissíveis',
        ],
      },
      unit: 'mm',
      status: 'WARNING', // WARNING porque é placeholder
      criticality: 'NOT_ASSESSED',
      explanation: `Espessura mínima calculada usando fórmula ASME VIII-1 (placeholder). VALOR NÃO VALIDADO - CONFIRMAR COM ENGENHEIRO.`,
      normativeReference: 'ASME BPVC VIII-1 UG-27 / NR-13 Item 13.5.2',
      reliability: 'THEORETICAL',
      observations: [
        'IMPLEMENTAÇÃO PLACEHOLDER - NÃO USAR EM PRODUÇÃO',
        'Requer validação do engenheiro responsável',
        'Assumindo casco cilíndrico sob pressão interna',
        'Verificar se código de projeto correto foi selecionado',
      ],
      metadata: {
        calculationId: `tmin-${Date.now()}`,
        calculatedAt: new Date(),
        calculatedBy: 'system',
        formulaVersion: '1.0.0-placeholder',
        normativeVersion: 'ASME 2021 / NR-13 2023',
        inputs: input,
        warnings: [...validation.warnings.map(w => w.message), 'CÁLCULO PLACEHOLDER - NÃO VALIDADO'],
      },
    };
  }
  
  simulate(input: SimulationInput): SimulationResult {
    // Placeholder para simulação
    return {
      scenario: input.scenario,
      projectedThicknessMm: 0,
      projectedDate: new Date(),
      willReachMinThickness: false,
      remainingLifeYears: 0,
      recommendedInspectionIntervalMonths: 12,
      warnings: ['SIMULAÇÃO NÃO IMPLEMENTADA'],
    };
  }
}

// ============================================================
// CÁLCULO 2: TAXA DE CORROSÃO
// ============================================================

export interface CorrosionRateInput {
  currentThicknessMm: number;         // Espessura atual (menor medição)
  previousThicknessMm: number;        // Espessura da inspeção anterior
  timeIntervalYears: number;          // Intervalo entre inspeções (anos)
  
  // Opcional: múltiplas inspeções históricas para regressão linear
  historicalData?: Array<{
    date: Date;
    minThicknessMm: number;
  }>;
}

export interface CorrosionRateResult {
  corrosionRateMmPerYear: number;     // Taxa de corrosão (mm/ano)
  corrosionRateMpy: number;           // Taxa em mpy (mils per year)
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  dataPoints: number;
  trend: 'INCREASING' | 'STABLE' | 'DECREASING' | 'UNKNOWN';
}

/**
 * Calcula taxa de corrosão
 * 
 * FÓRMULA BÁSICA:
 * CR = (t_previous - t_current) / Δt
 * 
 * COM MÚLTIPLOS PONTOS: Regressão linear
 * CR = slope da regressão de espessura vs tempo
 * 
 * API 570 / API 510: Recomenda pelo menos 2 inspeções para calcular taxa confiável
 */
export class CorrosionRateCalculator implements ICalculator<CorrosionRateInput, CorrosionRateResult> {
  validate(input: CorrosionRateInput): ValidationResult {
    const errors: ValidationResult['errors'] = [];
    const warnings: ValidationResult['warnings'] = [];
    const missingFields: string[] = [];
    
    if (input.currentThicknessMm === undefined || input.currentThicknessMm <= 0) {
      missingFields.push('currentThicknessMm');
    }
    
    if (input.previousThicknessMm === undefined || input.previousThicknessMm <= 0) {
      missingFields.push('previousThicknessMm');
    }
    
    if (input.timeIntervalYears === undefined || input.timeIntervalYears <= 0) {
      missingFields.push('timeIntervalYears');
    }
    
    if (input.previousThicknessMm !== undefined && input.currentThicknessMm !== undefined) {
      if (input.previousThicknessMm < input.currentThicknessMm) {
        warnings.push({
          field: 'thicknessComparison',
          code: 'THICKNESS_INCREASED',
          message: 'Espessura anterior menor que atual - possível erro de medição ou medição em ponto diferente',
          suggestion: 'Verificar se medições são no mesmo ponto e com mesmo equipamento',
        });
      }
    }
    
    if (input.timeIntervalYears && input.timeIntervalYears < 0.5) {
      warnings.push({
        field: 'timeIntervalYears',
        code: 'SHORT_INTERVAL',
        message: `Intervalo muito curto (${input.timeIntervalYears} anos) - taxa pode ser imprecisa`,
      });
    }
    
    return {
      isValid: errors.length === 0 && missingFields.length === 0,
      errors,
      warnings,
      missingFields,
    };
  }
  
  calculate(input: CorrosionRateInput): CalculationResult<CorrosionRateResult> {
    const validation = this.validate(input);
    
    if (!validation.isValid) {
      return {
        value: null as any,
        unit: 'mm/ano',
        status: 'ERROR',
        criticality: 'CRITICAL',
        explanation: 'Validação falhou',
        normativeReference: 'API 570 / API 510 / NR-13',
        reliability: 'LOW',
        observations: validation.errors.map(e => e.message),
        metadata: {
          calculationId: `cr-${Date.now()}`,
          calculatedAt: new Date(),
          calculatedBy: 'system',
          formulaVersion: '1.0.0',
          normativeVersion: 'API 570 2016 / NR-13 2023',
          inputs: input,
          warnings: validation.warnings.map(w => w.message),
        },
      };
    }
    
    // Cálculo simples: CR = (t_anterior - t_atual) / Δt
    const thicknessLoss = input.previousThicknessMm - input.currentThicknessMm;
    const corrosionRateMmPerYear = thicknessLoss / input.timeIntervalYears;
    const corrosionRateMpy = corrosionRateMmPerYear * 39.3701; // mm/ano -> mpy
    
    // Determinar confiança
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (input.historicalData && input.historicalData.length >= 3) {
      confidence = 'HIGH';
    } else if (input.timeIntervalYears >= 2) {
      confidence = 'MEDIUM';
    }
    
    return {
      value: {
        corrosionRateMmPerYear: Math.round(corrosionRateMmPerYear * 1000) / 1000,
        corrosionRateMpy: Math.round(corrosionRateMpy * 10) / 10,
        confidence,
        dataPoints: (input.historicalData?.length || 0) + 2,
        trend: corrosionRateMmPerYear > 0 ? 'INCREASING' : corrosionRateMmPerYear < 0 ? 'DECREASING' : 'STABLE',
      },
      unit: 'mm/ano',
      status: corrosionRateMmPerYear > 0 ? 'SUCCESS' : 'WARNING',
      criticality: corrosionRateMmPerYear > 5 ? 'HIGH' : corrosionRateMmPerYear > 1 ? 'MEDIUM' : 'LOW',
      explanation: `Taxa de corrosão calculada: ${corrosionRateMmPerYear.toFixed(3)} mm/ano (${corrosionRateMpy.toFixed(1)} mpy)`,
      normativeReference: 'API 570 Section 7 / API 510 Section 6 / NR-13',
      reliability: confidence === 'HIGH' ? 'HIGH' : confidence === 'MEDIUM' ? 'MEDIUM' : 'LOW',
      observations: [
        confidence === 'LOW' ? 'Baseado em apenas 2 pontos - baixa confiabilidade' : 
        confidence === 'MEDIUM' ? 'Baseado em 2 pontos com intervalo adequado' : 
        'Baseado em regressão linear com 3+ pontos históricos',
        ...validation.warnings.map(w => w.message),
      ],
      metadata: {
        calculationId: `cr-${Date.now()}`,
        calculatedAt: new Date(),
        calculatedBy: 'system',
        formulaVersion: '1.0.0',
        normativeVersion: 'API 570 2016 / NR-13 2023',
        inputs: input,
        warnings: validation.warnings.map(w => w.message),
      },
    };
  }
}

// ============================================================
// CÁLCULO 3: VIDA ÚTIL REMANESCENTE
// ============================================================

export interface RemainingLifeInput {
  currentThicknessMm: number;         // Espessura atual (menor medição)
  minimumThicknessMm: number;         // Espessura mínima admissível (t_min)
  corrosionRateMmPerYear: number;     // Taxa de corrosão (mm/ano)
  
  // Opcional
  nextInspectionDate?: Date;          // Data da próxima inspeção planejada
  safetyMarginMm?: number;            // Margem de segurança adicional (mm)
}

export interface RemainingLifeResult {
  remainingLifeYears: number;         // Vida útil remanescente (anos)
  remainingLifeMonths: number;        // Vida útil em meses
  thicknessMarginMm: number;          // Margem atual (atual - mínima)
  projectedThicknessAtNextInspectionMm?: number;
  willSurviveNextInspection?: boolean;
  recommendedInspectionIntervalMonths: number;
}

/**
 * Calcula vida útil remanescente
 * 
 * FÓRMULA:
 * Vida Remanescente = (t_atual - t_mínima) / Taxa de Corrosão
 * 
 * API 570/510: Vida remanescente deve ser > intervalo até próxima inspeção
 * NR-13: Próxima inspeção antes de atingir espessura mínima
 */
export class RemainingLifeCalculator implements ICalculator<RemainingLifeInput, RemainingLifeResult> {
  validate(input: RemainingLifeInput): ValidationResult {
    const errors: ValidationResult['errors'] = [];
    const warnings: ValidationResult['warnings'] = [];
    const missingFields: string[] = [];
    
    if (input.currentThicknessMm === undefined || input.currentThicknessMm <= 0) {
      missingFields.push('currentThicknessMm');
    }
    
    if (input.minimumThicknessMm === undefined || input.minimumThicknessMm <= 0) {
      missingFields.push('minimumThicknessMm');
    }
    
    if (input.corrosionRateMmPerYear === undefined) {
      missingFields.push('corrosionRateMmPerYear');
    } else if (input.corrosionRateMmPerYear <= 0) {
      warnings.push({
        field: 'corrosionRateMmPerYear',
        code: 'ZERO_OR_NEGATIVE_CORROSION_RATE',
        message: 'Taxa de corrosão zero ou negativa - vida útil será infinita',
        suggestion: 'Confirmar se equipamento realmente não sofre corrosão ou usar taxa conservativa',
      });
    }
    
    if (input.currentThicknessMm !== undefined && input.minimumThicknessMm !== undefined) {
      if (input.currentThicknessMm <= input.minimumThicknessMm) {
        errors.push({
          field: 'currentThicknessMm',
          code: 'BELOW_MINIMUM_THICKNESS',
          message: `Espessura atual (${input.currentThicknessMm} mm) JÁ está abaixo ou igual à mínima (${input.minimumThicknessMm} mm)`,
          severity: 'CRITICAL',
        });
      }
    }
    
    return {
      isValid: errors.filter(e => e.severity === 'ERROR' || e.severity === 'CRITICAL').length === 0 && missingFields.length === 0,
      errors,
      warnings,
      missingFields,
    };
  }
  
  calculate(input: RemainingLifeInput): CalculationResult<RemainingLifeResult> {
    const validation = this.validate(input);
    
    if (!validation.isValid) {
      return {
        value: null as any,
        unit: 'anos',
        status: 'ERROR',
        criticality: 'CRITICAL',
        explanation: 'Validação falhou - equipamento pode já estar abaixo da espessura mínima',
        normativeReference: 'API 570 / API 510 / NR-13',
        reliability: 'LOW',
        observations: validation.errors.map(e => e.message),
        metadata: {
          calculationId: `rl-${Date.now()}`,
          calculatedAt: new Date(),
          calculatedBy: 'system',
          formulaVersion: '1.0.0',
          normativeVersion: 'API 570 2016 / NR-13 2023',
          inputs: input,
          warnings: validation.warnings.map(w => w.message),
        },
      };
    }
    
    const safetyMargin = input.safetyMarginMm || 0;
    const effectiveMinThickness = input.minimumThicknessMm + safetyMargin;
    const thicknessMargin = input.currentThicknessMm - effectiveMinThickness;
    
    let remainingLifeYears: number;
    let projectedThicknessAtNextInspection: number | undefined;
    let willSurviveNextInspection: boolean | undefined;
    
    if (input.corrosionRateMmPerYear > 0) {
      remainingLifeYears = thicknessMargin / input.corrosionRateMmPerYear;
      
      if (input.nextInspectionDate) {
        const yearsToNextInspection = (input.nextInspectionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 365.25);
        projectedThicknessAtNextInspection = input.currentThicknessMm - (input.corrosionRateMmPerYear * yearsToNextInspection);
        willSurviveNextInspection = projectedThicknessAtNextInspection > effectiveMinThickness;
      }
    } else {
      remainingLifeYears = Infinity; // Sem corrosão = vida infinita
    }
    
    // Intervalo recomendado (metade da vida remanescente ou máximo por norma)
    const maxIntervalByNorm = 60; // 5 anos (NR-13 tanque)
    const recommendedInterval = remainingLifeYears === Infinity 
      ? maxIntervalByNorm 
      : Math.min(Math.max(remainingLifeYears / 2, 6), maxIntervalByNorm);
    
    return {
      value: {
        remainingLifeYears: remainingLifeYears === Infinity ? 999 : Math.round(remainingLifeYears * 10) / 10,
        remainingLifeMonths: remainingLifeYears === Infinity ? 999 : Math.round(remainingLifeYears * 120) / 10,
        thicknessMarginMm: Math.round(thicknessMargin * 100) / 100,
        projectedThicknessAtNextInspectionMm: projectedThicknessAtNextInspection ? Math.round(projectedThicknessAtNextInspection * 100) / 100 : undefined,
        willSurviveNextInspection,
        recommendedInspectionIntervalMonths: Math.round(recommendedInterval),
      },
      unit: 'anos',
      status: remainingLifeYears < 2 ? 'WARNING' : remainingLifeYears < 5 ? 'SUCCESS' : 'SUCCESS',
      criticality: remainingLifeYears < 1 ? 'CRITICAL' : remainingLifeYears < 3 ? 'HIGH' : remainingLifeYears < 5 ? 'MEDIUM' : 'LOW',
      explanation: remainingLifeYears === Infinity 
        ? 'Sem corrosão detectada - vida útil indeterminada (monitorar)'
        : `Vida útil remanescente: ${remainingLifeYears.toFixed(1)} anos (margem: ${thicknessMargin.toFixed(2)} mm)`,
      normativeReference: 'API 570 Section 7 / API 510 Section 6 / NR-13 Item 13.7',
      reliability: input.corrosionRateMmPerYear > 0 ? 'MEDIUM' : 'LOW',
      observations: [
        remainingLifeYears === Infinity ? 'Taxa de corrosão zero - assumindo ausência de corrosão' : '',
        remainingLifeYears < 2 ? 'VIDA ÚTIL CRÍTICA - Requer ação imediata' : '',
        remainingLifeYears < 5 ? 'Vida útil curta - planejar substituição/reparo' : '',
        willSurviveNextInspection === false ? 'PRÓXIMA INSPEÇÃO PODE ENCONTRAR EQUIPAMENTO ABAIXO DO MÍNIMO' : '',
        ...validation.warnings.map(w => w.message),
      ].filter(Boolean),
      metadata: {
        calculationId: `rl-${Date.now()}`,
        calculatedAt: new Date(),
        calculatedBy: 'system',
        formulaVersion: '1.0.0',
        normativeVersion: 'API 570 2016 / NR-13 2023',
        inputs: input,
        warnings: validation.warnings.map(w => w.message),
      },
    };
  }
}

// ============================================================
// CÁLCULO 4: PMTA (PRESSÃO MÁXIMA DE TRABALHO ADMISSÍVEL)
// ============================================================

export interface MawpInput {
  currentThicknessMm: number;         // Espessura atual (menor medição)
  insideDiameterMm: number;           // Diâmetro interno
  jointEfficiency: number;            // Eficiência de junta (E)
  allowableStressMpa: number;         // Tensão admissível do material (MPa)
  corrosionAllowanceMm: number;       // Ca
  designCode: 'ASME_VIII_DIV1' | 'ASME_VIII_DIV2' | 'API_650' | 'OTHER';
}

export interface MawpResult {
  mawpBar: number;                    // PMTA em bar
  mawpMpa: number;                    // PMTA em MPa
  governingThicknessMm: number;       // Espessura governante (t - Ca)
  formulaUsed: string;
}

/**
 * Calcula PMTA baseado na espessura atual
 * 
 * FÓRMULA ASME VIII-1 (inversa da espessura mínima):
 * P = (S * E * t) / (R + 0.6 * t)
 * Onde t = espessura atual - Ca
 * 
 * API 650: P = (2 * S * E * t) / D
 */
export class MawpCalculator implements ICalculator<MawpInput, MawpResult> {
  validate(input: MawpInput): ValidationResult {
    const errors: ValidationResult['errors'] = [];
    const warnings: ValidationResult['warnings'] = [];
    const missingFields: string[] = [];
    
    if (input.currentThicknessMm === undefined || input.currentThicknessMm <= 0) missingFields.push('currentThicknessMm');
    if (input.insideDiameterMm === undefined || input.insideDiameterMm <= 0) missingFields.push('insideDiameterMm');
    if (input.jointEfficiency === undefined || input.jointEfficiency <= 0 || input.jointEfficiency > 1) missingFields.push('jointEfficiency');
    if (input.allowableStressMpa === undefined || input.allowableStressMpa <= 0) missingFields.push('allowableStressMpa');
    if (input.corrosionAllowanceMm === undefined || input.corrosionAllowanceMm < 0) missingFields.push('corrosionAllowanceMm');
    
    const effectiveThickness = (input.currentThicknessMm || 0) - (input.corrosionAllowanceMm || 0);
    if (effectiveThickness <= 0) {
      errors.push({
        field: 'currentThicknessMm',
        code: 'EFFECTIVE_THICKNESS_NEGATIVE',
        message: `Espessura efetiva (${effectiveThickness.toFixed(2)} mm) é zero ou negativa após deduzir Ca`,
        severity: 'CRITICAL',
      });
    }
    
    return {
      isValid: errors.length === 0 && missingFields.length === 0,
      errors,
      warnings,
      missingFields,
    };
  }
  
  calculate(input: MawpInput): CalculationResult<MawpResult> {
    const validation = this.validate(input);
    
    if (!validation.isValid) {
      return {
        value: null as any,
        unit: 'bar',
        status: 'ERROR',
        criticality: 'CRITICAL',
        explanation: 'Validação falhou',
        normativeReference: 'ASME VIII-1 / API 650 / NR-13',
        reliability: 'LOW',
        observations: validation.errors.map(e => e.message),
        metadata: {
          calculationId: `mawp-${Date.now()}`,
          calculatedAt: new Date(),
          calculatedBy: 'system',
          formulaVersion: '1.0.0',
          normativeVersion: 'ASME 2021 / API 650 2020',
          inputs: input,
          warnings: validation.warnings.map(w => w.message),
        },
      };
    }
    
    const effectiveThickness = input.currentThicknessMm - input.corrosionAllowanceMm;
    const radiusMm = input.insideDiameterMm / 2;
    
    // ASME VIII-1 UG-27 (inverso) - PLACEHOLDER
    // P = (S * E * t) / (R + 0.6 * t)
    const pressureMpa = (input.allowableStressMpa * input.jointEfficiency * effectiveThickness) / (radiusMm + 0.6 * effectiveThickness);
    const mawpBar = pressureMpa * 10;
    
    return {
      value: {
        mawpBar: Math.round(mawpBar * 100) / 100,
        mawpMpa: Math.round(pressureMpa * 100) / 100,
        governingThicknessMm: Math.round(effectiveThickness * 100) / 100,
        formulaUsed: 'P = (S * E * t) / (R + 0.6 * t)  (ASME VIII-1 UG-27 invertido)',
      },
      unit: 'bar',
      status: 'WARNING', // Placeholder
      criticality: 'NOT_ASSESSED',
      explanation: `PMTA calculada: ${mawpBar.toFixed(2)} bar (baseado na espessura atual menos Ca). VALOR PLACEHOLDER - CONFIRMAR COM ENGENHEIRO.`,
      normativeReference: 'ASME BPVC VIII-1 UG-27 / NR-13 Item 13.5',
      reliability: 'THEORETICAL',
      observations: [
        'IMPLEMENTAÇÃO PLACEHOLDER - NÃO USAR EM PRODUÇÃO',
        'Assume casco cilíndrico como elemento governante',
        'Não considera tampas, bocais, reforços',
        'Requer validação do engenheiro responsável',
      ],
      metadata: {
        calculationId: `mawp-${Date.now()}`,
        calculatedAt: new Date(),
        calculatedBy: 'system',
        formulaVersion: '1.0.0-placeholder',
        normativeVersion: 'ASME 2021 / NR-13 2023',
        inputs: input,
        warnings: [...validation.warnings.map(w => w.message), 'CÁLCULO PLACEHOLDER - NÃO VALIDADO'],
      },
    };
  }
}

// ============================================================
// EXPORTAÇÕES
// ============================================================

export const calculators = {
  minimumThickness: new MinimumThicknessCalculator(),
  corrosionRate: new CorrosionRateCalculator(),
  remainingLife: new RemainingLifeCalculator(),
  mawp: new MawpCalculator(),
} as const;

export type CalculatorName = keyof typeof calculators;