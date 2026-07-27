/**
 * Engineering Engine - Camada de Domínio
 * 
 * Define as interfaces e contratos do domínio de engenharia.
 * Esta camada é independente de implementação técnica.
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
  CriticalityLevel,
  IntegrityStatus,
} from '../types';

// ============================================================
// PORTAS (INTERFACES) - Para Inversão de Dependência
// ============================================================

/** Porta para repositório de equipamentos */
export interface IEquipmentRepository {
  findById(id: string): Promise<EquipmentData | null>;
  findByClientId(clientId: string): Promise<EquipmentData[]>;
  findActiveByClientId(clientId: string): Promise<EquipmentData[]>;
}

/** Porta para repositório de inspeções */
export interface IInspectionRepository {
  findById(id: string): Promise<InspectionData | null>;
  findByEquipmentId(equipmentId: string): Promise<InspectionData[]>;
  findByInspectorId(inspectorId: string): Promise<InspectionData[]>;
  findByStatus(status: InspectionData['status']): Promise<InspectionData[]>;
}

/** Porta para repositório de medições */
export interface IMeasurementRepository {
  findByInspectionId(inspectionId: string): Promise<MeasurementPoint[]>;
  findLatestByEquipmentId(equipmentId: string): Promise<MeasurementPoint[]>;
}

/** Porta para serviço de cálculos */
export interface ICalculationService {
  calculateMinimumThickness(input: any): Promise<CalculationResult<any>>;
  calculateCorrosionRate(input: any): Promise<CalculationResult<any>>;
  calculateRemainingLife(input: any): Promise<CalculationResult<any>>;
  calculateMawp(input: any): Promise<CalculationResult<any>>;
  analyzeIntegrity(input: CalculationInput): Promise<IntegrityAnalysis>;
  simulate(input: SimulationInput): Promise<SimulationResult>;
}

/** Porta para validação */
export interface IValidationService {
  validateCalculationInput(input: CalculationInput): ValidationResult;
  validateEquipmentData(equipment: EquipmentData): ValidationResult;
  validateInspectionData(inspection: InspectionData): ValidationResult;
  validateMeasurements(measurements: MeasurementPoint[]): ValidationResult;
}

/** Porta para logs de auditoria */
export interface IAuditLogService {
  logCalculation(entry: {
    calculationId: string;
    calculatedAt: Date;
    calculatedBy: string;
    formulaVersion: string;
    normativeVersion: string;
    equipmentId: string;
    inspectionId: string;
    inputs: Record<string, any>;
    results: Record<string, any>;
  }): Promise<void>;
  getCalculationHistory(equipmentId: string): Promise<any[]>;
}

// ============================================================
// ENTIDADES DE DOMÍNIO (Ricas em Comportamento)
// ============================================================

/**
 * Entidade Equipamento - Encapsula regras de negócio do equipamento
 */
export class Equipment {
  constructor(private data: EquipmentData) {}
  
  get id(): string { return this.data.id; }
  get tag(): string { return this.data.tag; }
  get type(): EquipmentData['type'] { return this.data.type; }
  get minThicknessMm(): number | undefined { return this.data.minThicknessMm; }
  get originalThicknessMm(): number | undefined { return this.data.originalThicknessMm; }
  get designPressureBar(): number | undefined { return this.data.designPressureBar; }
  get operatingPressureBar(): number | undefined { return this.data.operatingPressureBar; }
  get mawpBar(): number | undefined { return this.data.mawpBar; }
  get jointEfficiency(): number | undefined { return this.data.jointEfficiency; }
  get corrosionAllowanceMm(): number | undefined { return this.data.corrosionAllowanceMm; }
  get bodyMaterial(): string | undefined { return this.data.bodyMaterial; }
  get volumeLiters(): number | undefined { return this.data.volumeLiters; }
  get designTempC(): number | undefined { return this.data.designTempC; }
  get operatingTempC(): number | undefined { return this.data.operatingTempC; }
  get designCode(): string | undefined { return this.data.designCode; }
  
  /** Verifica se equipamento tem dados mínimos para cálculos NR-13 */
  hasMinimumCalculationData(): boolean {
    return !!(
      this.data.originalThicknessMm &&
      this.data.minThicknessMm &&
      this.data.designPressureBar
    );
  }
  
  /** Calcula margem de espessura atual (%) */
  getThicknessMarginPercent(currentThicknessMm: number): number {
    if (!this.data.minThicknessMm) return 0;
    return ((currentThicknessMm - this.data.minThicknessMm) / this.data.minThicknessMm) * 100;
  }
  
  /** Verifica se está abaixo da espessura mínima */
  isBelowMinimum(currentThicknessMm: number): boolean {
    return this.data.minThicknessMm !== undefined && currentThicknessMm <= this.data.minThicknessMm;
  }
  
  /** Verifica se PMTA é inferior à pressão de operação */
  isMawpBelowOperatingPressure(mawpBar: number): boolean {
    return this.data.operatingPressureBar !== undefined && mawpBar < this.data.operatingPressureBar;
  }
  
  /** Obtém intervalo de inspeção padrão por tipo */
  getDefaultInspectionIntervalMonths(): number {
    const intervals: Record<string, number> = {
      CALDEIRA: 12,
      VASO_DE_PRESSAO: 24,
      TANQUE: 60,
      TUBULACAO: 48,
      SILO: 24,
      COMPRESSOR: 12,
      TROCADOR_DE_CALOR: 24,
      REATOR: 24,
      OUTRO: 24,
    };
    return intervals[this.data.type] || 24;
  }
  
  /** Converte para dados puros */
  toData(): EquipmentData {
    return { ...this.data };
  }
}

/**
 * Entidade Inspeção - Encapsula regras de negócio da inspeção
 */
export class Inspection {
  constructor(private data: InspectionData) {}
  
  get id(): string { return this.data.id; }
  get equipmentId(): string { return this.data.equipmentId; }
  get status(): InspectionData['status'] { return this.data.status; }
  get type(): InspectionData['type'] { return this.data.type; }
  get startedAt(): Date { return this.data.startedAt; }
  get completedAt(): Date | undefined { return this.data.completedAt; }
  get approvedAt(): Date | undefined { return this.data.approvedAt; }
  get rejectionReason(): string | undefined { return this.data.rejectionReason; }
  
  /** Verifica se inspeção pode ser editada */
  canBeEdited(): boolean {
    return this.data.status === 'EM_ANDAMENTO';
  }
  
  /** Verifica se inspeção pode ser enviada para aprovação */
  canBeSubmittedForApproval(): boolean {
    return this.data.status === 'EM_ANDAMENTO';
  }
  
  /** Verifica se inspeção pode ser aprovada/rejeitada */
  canBeApprovedOrRejected(): boolean {
    return this.data.status === 'AGUARDANDO_APROVACAO';
  }
  
  /** Verifica se inspeção rejeitada pode ser reaberta */
  canBeReopened(): boolean {
    return this.data.status === 'REJEITADA';
  }
  
  /** Obtém próximas transições de status válidas */
  getValidStatusTransitions(): InspectionData['status'][] {
    const transitions: Record<InspectionData['status'], InspectionData['status'][]> = {
      EM_ANDAMENTO: ['AGUARDANDO_APROVACAO'],
      AGUARDANDO_APROVACAO: ['APROVADA', 'REJEITADA', 'EM_ANDAMENTO'],
      APROVADA: [],
      REJEITADA: ['EM_ANDAMENTO'],
    };
    return transitions[this.data.status] || [];
  }
  
  /** Verifica se inspeção está finalizada */
  isFinalized(): boolean {
    return ['APROVADA', 'REJEITADA'].includes(this.data.status);
  }
  
  toData(): InspectionData {
    return { ...this.data };
  }
}

/**
 * Entidade Ponto de Medição
 */
export class MeasurementPointEntity {
  constructor(private data: MeasurementPoint) {}
  
  get id(): string { return this.data.id; }
  get point(): string { return this.data.point; }
  get thicknessMm(): number { return this.data.thicknessMm; }
  get angleDeg(): number | undefined { return this.data.angleDeg; }
  get notes(): string | undefined { return this.data.notes; }
  
  /** Avalia status do ponto contra espessura mínima */
  evaluateThicknessStatus(minThicknessMm: number): 'OK' | 'ATENCAO' | 'CRITICO' {
    if (this.data.thicknessMm <= minThicknessMm) return 'CRITICO';
    if (this.data.thicknessMm <= minThicknessMm * 1.2) return 'ATENCAO';
    return 'OK';
  }
  
  toData(): MeasurementPoint {
    return { ...this.data };
  }
}

// ============================================================
// VALUE OBJECTS
// ============================================================

/** Espessura com validação */
export class Thickness {
  constructor(
    public readonly value: number,
    public readonly unit: 'mm' | 'cm' | 'in' = 'mm'
  ) {
    if (value < 0) throw new Error('Espessura não pode ser negativa');
    if (value > 500) throw new Error('Espessura excede máximo permitido (500 mm)');
  }
  
  toMm(): number {
    switch (this.unit) {
      case 'mm': return this.value;
      case 'cm': return this.value * 10;
      case 'in': return this.value * 25.4;
      default: return this.value;
    }
  }
  
  equals(other: Thickness): boolean {
    return this.toMm() === other.toMm();
  }
  
  isLessThan(other: Thickness): boolean {
    return this.toMm() < other.toMm();
  }
  
  minus(other: Thickness): Thickness {
    return new Thickness(this.toMm() - other.toMm(), 'mm');
  }
}

/** Pressão com validação */
export class Pressure {
  constructor(
    public readonly value: number,
    public readonly unit: 'bar' | 'MPa' | 'psi' | 'kgf/cm2' = 'bar'
  ) {
    if (value < 0) throw new Error('Pressão não pode ser negativa');
  }
  
  toBar(): number {
    switch (this.unit) {
      case 'bar': return this.value;
      case 'MPa': return this.value * 10;
      case 'psi': return this.value * 0.0689476;
      case 'kgf/cm2': return this.value * 0.980665;
      default: return this.value;
    }
  }
  
  toMpa(): number {
    return this.toBar() * 0.1;
  }
}

/** Temperatura com validação */
export class Temperature {
  constructor(
    public readonly value: number,
    public readonly unit: 'C' | 'F' | 'K' = 'C'
  ) {}
  
  toCelsius(): number {
    switch (this.unit) {
      case 'C': return this.value;
      case 'F': return (this.value - 32) * 5/9;
      case 'K': return this.value - 273.15;
      default: return this.value;
    }
  }
  
  toKelvin(): number {
    return this.toCelsius() + 273.15;
  }
}

/** Taxa de corrosão */
export class CorrosionRate {
  constructor(
    public readonly valueMmPerYear: number
  ) {
    if (valueMmPerYear < 0) throw new Error('Taxa de corrosão não pode ser negativa');
  }
  
  toMpy(): number {
    return this.valueMmPerYear * 39.3701;
  }
  
  isHigh(): boolean { return this.valueMmPerYear > 5; }
  isMedium(): boolean { return this.valueMmPerYear > 1 && this.valueMmPerYear <= 5; }
  isLow(): boolean { return this.valueMmPerYear > 0 && this.valueMmPerYear <= 1; }
  isZero(): boolean { return this.valueMmPerYear === 0; }
}

// ============================================================
// EVENTOS DE DOMÍNIO
// ============================================================

export interface DomainEvent {
  eventId: string;
  occurredAt: Date;
  aggregateId: string;
  aggregateType: 'Equipment' | 'Inspection' | 'Measurement';
}

export interface EquipmentCreatedEvent extends DomainEvent {
  aggregateType: 'Equipment';
  payload: { equipmentId: string; tag: string; type: string };
}

export interface InspectionStartedEvent extends DomainEvent {
  aggregateType: 'Inspection';
  payload: { inspectionId: string; equipmentId: string; inspectorId: string };
}

export interface InspectionSubmittedForApprovalEvent extends DomainEvent {
  aggregateType: 'Inspection';
  payload: { inspectionId: string; equipmentId: string };
}

export interface InspectionApprovedEvent extends DomainEvent {
  aggregateType: 'Inspection';
  payload: { inspectionId: string; approvedBy: string; approvedAt: Date };
}

export interface InspectionRejectedEvent extends DomainEvent {
  aggregateType: 'Inspection';
  payload: { inspectionId: string; rejectedBy: string; reason: string };
}

export interface MeasurementRecordedEvent extends DomainEvent {
  aggregateType: 'Measurement';
  payload: { measurementId: string; inspectionId: string; point: string; thicknessMm: number };
}

export interface IntegrityAnalyzedEvent extends DomainEvent {
  aggregateType: 'Equipment';
  payload: { 
    equipmentId: string; 
    analysisId: string; 
    overallStatus: IntegrityStatus;
    overallCriticality: CriticalityLevel;
  };
}

export type AnyDomainEvent = 
  | EquipmentCreatedEvent 
  | InspectionStartedEvent 
  | InspectionSubmittedForApprovalEvent
  | InspectionApprovedEvent
  | InspectionRejectedEvent
  | MeasurementRecordedEvent
  | IntegrityAnalyzedEvent;

// ============================================================
// EXPORTAÇÕES
// ============================================================

export * from '../types';
export * from '../constants';
export * from '../utils/units';
export * from '../validators';
export * from '../calculations';
export * from '../services/engine';