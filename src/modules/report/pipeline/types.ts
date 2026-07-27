/**
 * Report Pipeline - Tipos
 * 
 * Define os tipos para o pipeline de geração de laudos a partir de inspeções.
 */

import type {
  TechnicalReport,
  ReportBuilderInput,
  ReportIdentification,
  ReportValidation,
  ReportPreviewData,
  ValidationChecklistItem,
} from '../types';

import type { TechnicalReportEntity } from '../domain/entities';

import type {
  InspectionData,
  EquipmentData,
  MeasurementPoint,
  IntegrityAnalysis,
} from '@/modules/engineering/types';

// ============================================================
// ENUMS E STATUS DO PIPELINE
// ============================================================

export type PipelineStatus = 
  | 'PENDING'       // Aguardando execução
  | 'RUNNING'       // Em execução
  | 'COMPLETED'     // Concluído com sucesso
  | 'FAILED'        // Falhou
  | 'CANCELLED';    // Cancelado

export type PipelineStepStatus = 
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED';

export type PipelineStepName = 
  | 'VALIDATE_INSPECTION'
  | 'VALIDATE_EQUIPMENT'
  | 'VALIDATE_MEASUREMENTS'
  | 'BUILD_CALCULATION_INPUT'
  | 'EXECUTE_ENGINEERING_ENGINE'
  | 'BUILD_TECHNICAL_REPORT'
  | 'VALIDATE_TECHNICAL_REPORT'
  | 'SAVE_DRAFT';

// ============================================================
// RESULTADOS DE CADA ETAPA
// ============================================================

export interface PipelineStepResult {
  step: PipelineStepName;
  status: PipelineStepStatus;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  message?: string;
  error?: PipelineError;
  data?: any;
}

export interface PipelineError {
  code: string;
  message: string;
  step?: PipelineStepName;
  details?: Record<string, any>;
  recoverable: boolean;
  timestamp: Date;
}

export interface PipelineResult<T = TechnicalReport> {
  success: boolean;
  status: PipelineStatus;
  report?: T;
  reportEntity?: TechnicalReportEntity;
  previewData?: ReportPreviewData;
  steps: PipelineStepResult[];
  audit: PipelineAudit;
  errors: PipelineError[];
  warnings: string[];
  startedAt: Date;
  completedAt?: Date;
  totalDurationMs?: number;
}

// ============================================================
// AUDITORIA DO PIPELINE
// ============================================================

export interface PipelineAudit {
  pipelineId: string;
  inspectionId: string;
  equipmentId: string;
  initiatedBy: string;
  initiatedAt: Date;
  formulaVersion: string;
  templateVersion: string;
  reportVersion: string;
  engineVersion: string;
  steps: PipelineAuditStep[];
  completedAt?: Date;
  totalDurationMs?: number;
  outcome: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
}

export interface PipelineAuditStep {
  step: PipelineStepName;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  status: PipelineStepStatus;
  inputHash?: string;
  outputHash?: string;
  warnings: string[];
  errors: PipelineError[];
}

// ============================================================
// INPUT DO PIPELINE
// ============================================================

export interface InspectionReportPipelineInput {
  inspectionId: string;
  equipmentId: string;
  options?: PipelineOptions;
}

export interface PipelineOptions {
  templateId?: string;
  templateVersion?: string;
  includeSimulations?: boolean;
  autoValidate?: boolean;
  initiatedBy: {
    id: string;
    name: string;
    role: 'INSPECTOR' | 'ENGINEER' | 'MANAGER';
  };
  skipSteps?: PipelineStepName[];
  customValidationRules?: ValidationRule[];
}

export interface ValidationRule {
  field: string;
  rule: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

// ============================================================
// CALLBACKS E HOOKS
// ============================================================

export interface PipelineCallbacks {
  onStepStart?: (step: PipelineStepName, stepIndex: number, totalSteps: number) => void;
  onStepComplete?: (step: PipelineStepName, result: PipelineStepResult) => void;
  onStepError?: (step: PipelineStepName, error: PipelineError) => void;
  onProgress?: (progress: PipelineProgress) => void;
  onComplete?: (result: PipelineResult) => void;
  onError?: (error: PipelineError) => void;
}

export interface PipelineProgress {
  currentStep: PipelineStepName;
  stepIndex: number;
  totalSteps: number;
  percentComplete: number;
  estimatedTimeRemainingMs?: number;
}

// ============================================================
// CONFIGURAÇÃO DO PIPELINE
// ============================================================

export interface PipelineConfig {
  steps: PipelineStepConfig[];
  timeouts: Record<PipelineStepName, number>; // ms
  retryPolicy: RetryPolicy;
  validation: ValidationConfig;
}

export interface PipelineStepConfig {
  name: PipelineStepName;
  enabled: boolean;
  required: boolean;
  order: number;
  timeoutMs: number;
}

export interface RetryPolicy {
  maxRetries: number;
  retryDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface ValidationConfig {
  strictMode: boolean;
  validateEngineOutput: boolean;
  validateReportCompleteness: boolean;
  requiredSections: string[];
}

// ============================================================
// TIPO PARA DADOS BRUTOS DA INSPEÇÃO (do banco)
// ============================================================

export interface RawInspectionData {
  inspection: InspectionData;
  equipment: EquipmentData;
  measurements: MeasurementPoint[];
  photos: Array<{
    id: string;
    category: string;
    url: string;
    caption?: string;
    order: number;
    takenAt: Date;
    takenBy: string;
  }>;
  client: {
    id: string;
    name: string;
    cnpj?: string;
    address?: string;
    city?: string;
    state?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    responsibleTechnicalId?: string;
    responsibleTechnicalName?: string;
  };
}

// ============================================================
// CONTEXTO DO PIPELINE
// ============================================================

export interface PipelineStepContext {
  pipelineId: string;
  input: InspectionReportPipelineInput;
  rawData?: RawInspectionData;
  calculationInput?: any;
  integrityAnalysis?: any;
  report?: TechnicalReport;
  reportEntity?: TechnicalReportEntity;
  audit: PipelineAudit;
  options: PipelineOptions | undefined;
}