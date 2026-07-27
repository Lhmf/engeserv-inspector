/**
 * Engineering Integration - Tipos
 * 
 * Define os tipos para a camada de integração entre UI e Engine
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

// ============================================================
// CASOS DE ENGENHARIA (para Engineering Studio)
// ============================================================

export interface EngineeringCase {
  id: string;
  client: string;
  equipment: string;
  tag: string;
  status: 'APROVADO' | 'REJEITADO' | 'EM_VALIDACAO' | 'PLACEHOLDER';
  lastInspection: string;
  corrosionRate: number | null;
  remainingLife: number | null;
  mawp: number | null;
  
  // Dados brutos para integração com Engine
  equipmentData?: EquipmentData;
  inspectionData?: InspectionData;
  measurements?: MeasurementPoint[];
  material?: MaterialData;
  operatingConditions?: OperatingConditions;
}

// ============================================================
// ENTRADA PARA INTEGRAÇÃO
// ============================================================

export interface IntegrationInput {
  caseId: string;
  calculationType: CalculationType;
  customParams?: Partial<CalculationInput>;
}

export type CalculationType = 
  | 'MINIMUM_THICKNESS'
  | 'CORROSION_RATE'
  | 'REMAINING_LIFE'
  | 'MAWP'
  | 'FULL_INTEGRITY'
  | 'SIMULATION'
  | 'BUILD_INPUT'
  | 'ERROR';

// ============================================================
// RESULTADO DA INTEGRAÇÃO
// ============================================================

export interface IntegrationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
  metadata: IntegrationMetadata;
}

export interface IntegrationMetadata {
  calculationId: string;
  caseId: string;
  calculationType: CalculationType;
  calculatedAt: Date;
  calculatedBy: string;
  formulaVersion: string;
  normativeVersion: string;
  executionTimeMs: number;
  isPlaceholder: boolean;
}

// ============================================================
// RESULTADOS FORMATADOS PARA UI
// ============================================================

export interface FormattedCalculationResult {
  id: string;
  label: string;
  value: string;
  unit: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INSUFFICIENT_DATA' | 'NOT_APPLICABLE';
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NOT_ASSESSED';
  reliability: 'HIGH' | 'MEDIUM' | 'LOW' | 'THEORETICAL';
  explanation: string;
  normativeReference: string;
  observations: string[];
  rawValue: any;
}

export interface FormattedIntegrityAnalysis {
  equipmentId: string;
  inspectionId: string;
  overallStatus: string;
  overallCriticality: string;
  recommendations: string[];
  riskFactors: Array<{
    factor: string;
    description: string;
    severity: string;
    mitigation?: string;
  }>;
  calculations: FormattedCalculationResult[];
  formulaVersions: Record<string, string>;
  normativeReferences: string[];
  analyzedAt: Date;
}

export interface FormattedSimulationResult {
  scenario: string;
  projectedThicknessMm: number;
  projectedDate: Date;
  willReachMinThickness: boolean;
  estimatedDateMinThickness?: Date;
  remainingLifeYears: number;
  recommendedInspectionIntervalMonths: number;
  warnings: string[];
}

// ============================================================
// HISTÓRICO DE EXECUÇÕES
// ============================================================

export interface CalculationHistoryEntry {
  id: string;
  caseId: string;
  calculationType: CalculationType;
  executedAt: Date;
  executedBy: string;
  resultSummary: string;
  status: 'SUCCESS' | 'ERROR' | 'WARNING';
  formulaVersion: string;
}