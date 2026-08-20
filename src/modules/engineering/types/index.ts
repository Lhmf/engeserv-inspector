/**
 * Engineering Engine - Tipos Fundamentais
 * 
 * Este arquivo define todas as interfaces e tipos base do motor de engenharia.
 * NÃO IMPLEMENTA CÁLCULOS - apenas define a estrutura de dados.
 */

// ============================================================
// DADOS DE EQUIPAMENTO (do banco de dados)
// ============================================================

export interface EquipmentData {
  id: string;
  tag: string;
  type: EquipmentType;
  description?: string;
  manufacturer?: string;
  manufactureYear?: number;
  
  // Dados de projeto básicos (NR-13)
  designPressureBar?: number;           // Pressão de projeto (bar)
  originalThicknessMm?: number;         // Espessura nominal do casco (mm)
  minThicknessMm?: number;              // Limite de segurança (> 2.5 mm conforme regra de negócio)
  
  // --- Novos campos (Sprint 3 - modelagem para laudo) ---
  serialNumber?: string;
  designCode?: string;                  // Ex: "ASME SEC.VIII div.I/2021"
  designTempC?: number;
  operatingPressureBar?: number;        // Pressão de operação - DIFERENTE da PMTA
  operatingTempC?: number;
  mawpBar?: number;                     // PMTA - Pressão Máxima de Trabalho Admissível
  hydroTestPressureBar?: number;        // PTH
  headType?: string;                    // Ex: "Semielíptico", "Semiesférico", "Torisférico"
  headMaterial?: string;                // Ex: "SA-516 Gr.70"
  bodyMaterial?: string;                // Material do corpo/casco
  headNominalThicknessMm?: number;      // DIFERENTE de originalThicknessMm (que é do casco)
  volumeLiters?: number;
  corrosionAllowanceMm?: number;             // Sobre-espessura de corrosão (Ca)
  jointEfficiency?: number;             // Eficiência de solda, ex: 1.0, 0.85, 0.7
  fluidType?: string;                   // Ex: "Ar Comprimido"
  fluidClass?: string;                  // Classe do fluido (A/B/C/D) - manual por enquanto
  riskGroup?: number;                   // Grupo de potencial de risco - manual por enquanto
  nr13Category?: string;                // Categoria (I a V) - manual por enquanto
}

export type EquipmentType = 
  | 'CALDEIRA'
  | 'VASO_DE_PRESSAO'
  | 'SILO'
  | 'TANQUE'
  | 'TUBULACAO'
  | 'COMPRESSOR'
  | 'TROCADOR_DE_CALOR'
  | 'REATOR'
  | 'OUTRO';

// ============================================================
// DADOS DE INSPEÇÃO (do banco de dados)
// ============================================================

export interface InspectionData {
  id: string;
  equipmentId: string;
  equipment?: EquipmentData;
  inspectorId: string;
  status: InspectionStatus;
  startedAt: Date;
  completedAt?: Date;
  approvedAt?: Date;
  approvedById?: string;
  rejectionReason?: string;
  type: InspectionType;
  notes?: string;
  recommendations?: string[];
  measurements?: MeasurementPoint[];
  photos?: InspectionPhoto[];
}

export type InspectionStatus = 
  | 'EM_ANDAMENTO'
  | 'AGUARDANDO_APROVACAO'
  | 'APROVADA'
  | 'REJEITADA';

export type InspectionType = 
  | 'INICIAL'
  | 'PERIODICA'
  | 'EXTRAORDINARIA';

export interface InspectionPhoto {
  id: string;
  inspectionId: string;
  url: string;
  category: PhotoCategory;
  caption?: string;
  order: number;
  uploadedById: string;
  createdAt: Date;
}

export type PhotoCategory = 
  | 'PLACA'
  | 'CORROSAO'
  | 'VALVULA'
  | 'MANOMETRO'
  | 'ULTRASSOM'
  | 'VISTA_GERAL'
  | 'SOLDA'
  | 'TRINCA'
  | 'REPARO';

// ============================================================
// PONTOS DE MEDIÇÃO (do banco de dados)
// ============================================================

export interface MeasurementPoint {
  id: string;
  inspectionId: string;
  point: string;              // Identificação do ponto (ex: "P1", "A-1")
  thicknessMm: number;        // Espessura medida em mm
  angleDeg?: number;          // Ângulo do ponto (se aplicável)
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// DADOS DE CORROSÃO (calculados/derivados)
// ============================================================

export interface CorrosionData {
  currentThicknessMm: number;     // Espessura atual (menor medição)
  originalThicknessMm: number;    // Espessura original de projeto
  minThicknessMm: number;         // Espessura mínima admissível
  operatingTimeYears: number;     // Tempo de operação (anos)
  
  // Calculados
  corrosionRateMmPerYear?: number;        // Taxa de corrosão (mm/ano)
  remainingLifeYears?: number;            // Vida útil remanescente (anos)
  corrosionAllowanceMm?: number;          // Sobre-espessura de corrosão (mm)
  thicknessMarginPercent?: number;        // Margem de espessura (%)
  thicknessMarginMm?: number;             // Margem de espessura (mm)
  status?: ThicknessStatus;               // Status: OK / ATENÇÃO / CRÍTICO
}

export type ThicknessStatus = 'OK' | 'ATENCAO' | 'CRITICO';

// ============================================================
// DADOS DE MATERIAL
// ============================================================

export interface MaterialData {
  name: string;                 // Ex: "SA-516 Gr.70"
  specification: string;        // Ex: "ASME SA-516"
  grade?: string;               // Ex: "70"
  allowableStressMpa?: number;  // Tensão admissível (MPa) - depende da temperatura
  minYieldStrengthMpa?: number; // Limite de escoamento mínimo (MPa)
  minTensileStrengthMpa?: number; // Resistência à tração mínima (MPa)
  corrosionResistance?: CorrosionResistance;
  // Tensões admissíveis por temperatura (S) - valores em MPa
  // Índice = temperatura em °C (aproximado)
  allowableStressByTempMpa?: Record<number, number>;
}

export type CorrosionResistance = 'ALTA' | 'MEDIA' | 'BAIXA' | 'DESCONHECIDA';

// ============================================================
// CONDIÇÕES DE OPERAÇÃO
// ============================================================

export interface OperatingConditions {
  designPressureBar: number;        // Pressão de projeto
  designTempC: number;              // Temperatura de projeto
  operatingPressureBar: number;     // Pressão de operação
  operatingTempC: number;           // Temperatura de operação
  mawpBar: number;                  // PMTA
  hydroTestPressureBar: number;     // PTH
  fluidType: string;                // Tipo de fluido
  fluidClass: string;               // Classe do fluido (A/B/C/D)
  riskGroup: number;                // Grupo de risco
  nr13Category: string;             // Categoria NR-13 (I a V)
}

// ============================================================
// ENTRADA PARA CÁLCULOS
// ============================================================

export interface CalculationInput {
  equipment: EquipmentData;
  inspection: InspectionData;
  measurements: MeasurementPoint[];
  material?: MaterialData;
  operatingConditions?: OperatingConditions;
  
  // Parâmetros adicionais (opcionais, para fórmulas específicas)
  corrosionRateMmPerYear?: number;      // Se já conhecido
  previousInspectionDate?: Date;        // Para cálculo de taxa de corrosão
  previousMinThicknessMm?: number;      // Menor espessura da inspeção anterior
  jointEfficiency?: number;             // Eficiência de junta (E)
  corrosionAllowanceMm?: number;        // Sobre-espessura de corrosão (Ca)
  safetyFactor?: number;                // Coeficiente de segurança
}

// ============================================================
// RESULTADO DE CÁLCULO (PADRÃO UNIFICADO)
// ============================================================

export interface CalculationResult<T = any> {
  value: T;                           // Valor calculado
  unit: string;                       // Unidade (mm, bar, MPa, anos, %)
  status: CalculationStatus;          // Status do cálculo
  criticality: CriticalityLevel;      // Nível de criticidade
  explanation: string;                // Explicação textual do resultado
  normativeReference: string;         // Referência normativa (NR-13, ASME, API)
  reliability: ReliabilityLevel;      // Nível de confiabilidade
  observations: string[];             // Observações adicionais
  metadata: CalculationMetadata;      // Metadados do cálculo
}

export type CalculationStatus = 
  | 'SUCCESS' 
  | 'WARNING' 
  | 'ERROR' 
  | 'INSUFFICIENT_DATA' 
  | 'NOT_APPLICABLE';

export type CriticalityLevel = 
  | 'LOW' 
  | 'MEDIUM' 
  | 'HIGH' 
  | 'CRITICAL' 
  | 'NOT_ASSESSED';

export type ReliabilityLevel = 
  | 'HIGH'      // Cálculo validado, dados completos
  | 'MEDIUM'    // Cálculo com algumas estimativas
  | 'LOW'       // Cálculo com muitas estimativas/dados incompletos
  | 'THEORETICAL'; // Apenas teórico, sem dados de campo

export interface CalculationMetadata {
  calculationId: string;
  calculatedAt: Date;
  calculatedBy: string;               // ID do usuário
  formulaVersion: string;             // Versão da fórmula usada
  normativeVersion: string;           // Versão da norma (ex: "NR-13 2023", "ASME 2021")
  inputs: Record<string, any>;        // Entradas usadas no cálculo
  warnings: string[];                 // Avisos durante o cálculo
}

// ============================================================
// RESULTADO DE VALIDAÇÃO
// ============================================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  missingFields: string[];
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'ERROR' | 'CRITICAL';
}

export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  suggestion?: string;
}

// ============================================================
// ANÁLISE COMPLETA DE INTEGRIDADE
// ============================================================

export interface IntegrityAnalysis {
  equipmentId: string;
  inspectionId: string;
  analyzedAt: Date;
  analyzedBy: string;
  
  // Resultados dos cálculos individuais
  minimumThickness?: CalculationResult<number>;
  corrosionRate?: CalculationResult<number>;
  remainingLife?: CalculationResult<number>;
  mawp?: CalculationResult<number>;
  nextInspectionDate?: CalculationResult<Date>;
  
  // Avaliação geral
  overallStatus: IntegrityStatus;
  overallCriticality: CriticalityLevel;
  recommendations: string[];
  riskFactors: RiskFactor[];
  
  // Metadados
  formulaVersions: Record<string, string>;
  normativeReferences: string[];
}

export type IntegrityStatus = 
  | 'INTEGRO'           // Todos os critérios atendidos
  | 'ACEITAVEL_COM_RESTRICOES'  // Atende com monitoramento
  | 'REQUER_REPARO'     // Reparo necessário antes de voltar à operação
  | 'CONDENADO'         // Fora de serviço permanentemente
  | 'INDETERMINADO';    // Dados insuficientes

export interface RiskFactor {
  factor: string;
  description: string;
  severity: CriticalityLevel;
  mitigation?: string;
}

// ============================================================
// SIMULAÇÃO / PROJEÇÃO
// ============================================================

export interface SimulationInput extends CalculationInput {
  scenario: SimulationScenario;
  projectionYears?: number;
  assumedCorrosionRateMmPerYear?: number;
}

export type SimulationScenario = 
  | 'CURRENT_CONDITIONS'        // Condições atuais
  | 'INCREASED_PRESSURE'        // Aumento de pressão de operação
  | 'INCREASED_TEMPERATURE'     // Aumento de temperatura
  | 'ACCELERATED_CORROSION'     // Corrosão acelerada
  | 'CUSTOM';                   // Parâmetros customizados

export interface SimulationResult {
  scenario: SimulationScenario;
  projectedThicknessMm: number;
  projectedDate: Date;
  willReachMinThickness: boolean;
  estimatedDateMinThickness?: Date;
  remainingLifeYears: number;
  recommendedInspectionIntervalMonths: number;
  warnings: string[];
}

// ============================================================
// TIPOS AUXILIARES
// ============================================================

export type UnitSystem = 'METRIC' | 'IMPERIAL';

export interface UnitConversion {
  from: string;
  to: string;
  factor: number;
  offset?: number;
}