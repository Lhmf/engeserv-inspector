/**
 * Engineering Engine - Camada de Aplicação (Use Cases)
 * 
 * Orquestra os casos de uso do motor de engenharia.
 * Esta camada contém a lógica de aplicação, não a de negócio.
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
} from '../types';
import { validateCalculationInput, validateUnitConsistency } from '../validators';
import { 
  MinimumThicknessCalculator,
  CorrosionRateCalculator,
  RemainingLifeCalculator,
  MawpCalculator,
} from '../calculations';
import { EngineeringEngineService } from '../services/engine';

// ============================================================
// CASOS DE USO
// ============================================================

/**
 * Caso de uso: Analisar integridade de um equipamento
 */
export class AnalyzeEquipmentIntegrityUseCase {
  constructor(private engine: EngineeringEngineService) {}
  
  async execute(input: CalculationInput): Promise<IntegrityAnalysis> {
    // 1. Validar entrada
    const validation = validateCalculationInput(input);
    if (!validation.isValid) {
      throw new Error(`Entrada inválida: ${validation.errors.map(e => e.message).join('; ')}`);
    }
    
    // 2. Verificar consistência de unidades
    const unitWarnings = validateUnitConsistency(input);
    
    // 3. Executar análise completa
    const analysis = await this.engine.analyzeIntegrity(input);
    
    // 4. Adicionar avisos de unidade
    if (unitWarnings.length > 0) {
      analysis.recommendations.push(...unitWarnings.map(w => `UNIDADES: ${w.message}`));
    }
    
    return analysis;
  }
}

/**
 * Caso de uso: Calcular espessura mínima admissível
 */
export class CalculateMinimumThicknessUseCase {
  private calculator = new MinimumThicknessCalculator();
  
  async execute(input: {
    designPressureBar: number;
    insideDiameterMm: number;
    jointEfficiency: number;
    allowableStressMpa: number;
    corrosionAllowanceMm: number;
    designCode: 'ASME_VIII_DIV1' | 'ASME_VIII_DIV2' | 'API_650' | 'NR13' | 'OTHER';
  }): Promise<CalculationResult<any>> {
    const validation = this.calculator.validate(input);
    if (!validation.isValid) {
      throw new Error(`Validação falhou: ${validation.errors.map(e => e.message).join('; ')}`);
    }
    
    return this.calculator.calculate(input);
  }
}

/**
 * Caso de uso: Calcular taxa de corrosão
 */
export class CalculateCorrosionRateUseCase {
  private calculator = new CorrosionRateCalculator();
  
  async execute(input: {
    currentThicknessMm: number;
    previousThicknessMm: number;
    timeIntervalYears: number;
    historicalData?: Array<{ date: Date; minThicknessMm: number }>;
  }): Promise<CalculationResult<any>> {
    const validation = this.calculator.validate(input);
    if (!validation.isValid) {
      throw new Error(`Validação falhou: ${validation.errors.map(e => e.message).join('; ')}`);
    }
    
    return this.calculator.calculate(input);
  }
}

/**
 * Caso de uso: Calcular vida útil remanescente
 */
export class CalculateRemainingLifeUseCase {
  private calculator = new RemainingLifeCalculator();
  
  async execute(input: {
    currentThicknessMm: number;
    minimumThicknessMm: number;
    corrosionRateMmPerYear: number;
    nextInspectionDate?: Date;
    safetyMarginMm?: number;
  }): Promise<CalculationResult<any>> {
    const validation = this.calculator.validate(input);
    if (!validation.isValid) {
      throw new Error(`Validação falhou: ${validation.errors.map(e => e.message).join('; ')}`);
    }
    
    return this.calculator.calculate(input);
  }
}

/**
 * Caso de uso: Calcular PMTA
 */
export class CalculateMawpUseCase {
  private calculator = new MawpCalculator();
  
  async execute(input: {
    currentThicknessMm: number;
    insideDiameterMm: number;
    jointEfficiency: number;
    allowableStressMpa: number;
    corrosionAllowanceMm: number;
    designCode: 'ASME_VIII_DIV1' | 'ASME_VIII_DIV2' | 'API_650' | 'OTHER';
  }): Promise<CalculationResult<any>> {
    const validation = this.calculator.validate(input);
    if (!validation.isValid) {
      throw new Error(`Validação falhou: ${validation.errors.map(e => e.message).join('; ')}`);
    }
    
    return this.calculator.calculate(input);
  }
}

/**
 * Caso de uso: Simular cenários
 */
export class SimulateScenarioUseCase {
  constructor(private engine: EngineeringEngineService) {}
  
  async execute(input: SimulationInput): Promise<SimulationResult> {
    return this.engine.simulate(input);
  }
}

/**
 * Caso de uso: Validar dados de equipamento para cálculos
 */
export class ValidateEquipmentForCalculationUseCase {
  async execute(equipment: EquipmentData): Promise<ValidationResult> {
    const { validateEquipmentData } = await import('../validators');
    return validateEquipmentData(equipment);
  }
}

/**
 * Caso de uso: Validar dados de inspeção para cálculos
 */
export class ValidateInspectionForCalculationUseCase {
  async execute(inspection: InspectionData): Promise<ValidationResult> {
    const { validateInspectionData } = await import('../validators');
    return validateInspectionData(inspection);
  }
}

/**
 * Caso de uso: Validar medições para cálculos
 */
export class ValidateMeasurementsForCalculationUseCase {
  async execute(measurements: MeasurementPoint[]): Promise<ValidationResult> {
    const { validateMeasurements } = await import('../validators');
    return validateMeasurements(measurements);
  }
}

// ============================================================
// FÁBRICA DE CASOS DE USO (Dependency Injection)
// ============================================================

export class EngineeringUseCaseFactory {
  private static engineInstance: EngineeringEngineService | null = null;
  
  static getEngine(): EngineeringEngineService {
    if (!this.engineInstance) {
      this.engineInstance = new EngineeringEngineService();
    }
    return this.engineInstance;
  }
  
  static createAnalyzeIntegrityUseCase(): AnalyzeEquipmentIntegrityUseCase {
    return new AnalyzeEquipmentIntegrityUseCase(this.getEngine());
  }
  
  static createCalculateMinimumThicknessUseCase(): CalculateMinimumThicknessUseCase {
    return new CalculateMinimumThicknessUseCase();
  }
  
  static createCalculateCorrosionRateUseCase(): CalculateCorrosionRateUseCase {
    return new CalculateCorrosionRateUseCase();
  }
  
  static createCalculateRemainingLifeUseCase(): CalculateRemainingLifeUseCase {
    return new CalculateRemainingLifeUseCase();
  }
  
  static createCalculateMawpUseCase(): CalculateMawpUseCase {
    return new CalculateMawpUseCase();
  }
  
  static createSimulateScenarioUseCase(): SimulateScenarioUseCase {
    return new SimulateScenarioUseCase(this.getEngine());
  }
  
  static createValidateEquipmentUseCase(): ValidateEquipmentForCalculationUseCase {
    return new ValidateEquipmentForCalculationUseCase();
  }
  
  static createValidateInspectionUseCase(): ValidateInspectionForCalculationUseCase {
    return new ValidateInspectionForCalculationUseCase();
  }
  
  static createValidateMeasurementsUseCase(): ValidateMeasurementsForCalculationUseCase {
    return new ValidateMeasurementsForCalculationUseCase();
  }
}

// ============================================================
// TIPOS PARA REQUEST/RESPONSE DA API
// ============================================================

export interface AnalyzeIntegrityRequest {
  equipmentId: string;
  inspectionId: string;
  // Dados opcionais que podem sobrescrever os do banco
  overrideData?: Partial<CalculationInput>;
}

export interface AnalyzeIntegrityResponse {
  analysis: IntegrityAnalysis;
  warnings: string[];
}

export interface CalculateRequest<T> {
  input: T;
}

export interface CalculateResponse<T> {
  result: CalculationResult<T>;
  warnings: string[];
}

export interface SimulationRequest {
  input: SimulationInput;
}

export interface SimulationResponse {
  result: SimulationResult;
  warnings: string[];
}

export interface ValidationRequest {
  equipment?: EquipmentData;
  inspection?: InspectionData;
  measurements?: MeasurementPoint[];
}

export interface ValidationResponse {
  equipment?: ValidationResult;
  inspection?: ValidationResult;
  measurements?: ValidationResult;
  overall: ValidationResult;
}