/**
 * Report Domain - Tipos Fundamentais
 * 
 * Define todas as interfaces e tipos para o domínio de Laudos Técnicos.
 * NÃO IMPLEMENTA EXPORTAÇÃO - apenas estrutura de dados.
 */

import type {
  EquipmentData,
  InspectionData,
  MeasurementPoint,
  IntegrityAnalysis,
  CalculationResult,
} from '@/modules/engineering/types';

// ============================================================
// ENUMS E TIPOS BASE
// ============================================================

export type ReportStatus = 
  | 'DRAFT'           // Rascunho
  | 'UNDER_REVIEW'    // Em revisão
  | 'APPROVED'        // Aprovado
  | 'REJECTED'        // Rejeitado
  | 'PUBLISHED'       // Publicado
  | 'ARCHIVED';       // Arquivado

export type ReportType = 
  | 'NR13'            // Laudo NR-13 padrão
  | 'API510'          // Inspeção vasos pressão API 510
  | 'API570'          // Inspeção tubulação API 570
  | 'ASME'            // Laudo código ASME
  | 'CUSTOM';         // Template customizado

export type SignatureRole = 
  | 'INSPECTOR'       // Inspetor executou
  | 'ENGINEER'        // Engenheiro validou cálculos
  | 'MANAGER'         // Gestor aprovou
  | 'QUALITY'         // Qualidade validou
  | 'CLIENT';         // Cliente recebeu

export type InspectionConclusion = 
  | 'INTEGRO'                    // Atende todos os critérios
  | 'ACEITAVEL_COM_RESTRICOES'   // Atende com monitoramento
  | 'REQUER_REPARO'              // Reparo necessário antes de voltar à operação
  | 'CONDENADO'                  // Fora de serviço permanentemente
  | 'INDETERMINADO';             // Dados insuficientes

// ============================================================
// IDENTIFICAÇÃO E METADADOS
// ============================================================

export interface ReportIdentification {
  reportNumber: string;           // Ex: "LT-2024-00123"
  version: number;                // 1, 2, 3...
  type: ReportType;
  status: ReportStatus;
  
  // Datas
  createdAt: Date;
  updatedAt: Date;
  inspectionDate: Date;
  issuedAt?: Date;                // Quando publicado
  expiresAt?: Date;               // Validade do laudo
  
  // ART / Responsáveis
  artNumber?: string;             // Anotação de Responsabilidade Técnica
  inspectorId: string;
  inspectorName: string;
  engineerId?: string;            // Engenheiro que validou cálculos
  engineerName?: string;
  managerId?: string;             // Gestor que aprovou
  managerName?: string;
}

export interface ClientInfo {
  id: string;
  name: string;                   // Razão social
  cnpj: string;
  address: string;
  city: string;
  state: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  responsibleTechnicalId?: string;
  responsibleTechnicalName?: string;
}

export interface EquipmentInfo {
  id: string;
  tag: string;
  type: string;
  description?: string;
  manufacturer?: string;
  manufactureYear?: number;
  serialNumber?: string;
  
  // Dados de projeto
  designPressureBar?: number;
  designTemperatureC?: number;
  originalThicknessMm?: number;
  minThicknessMm?: number;
  corrosionAllowanceMm?: number;
  jointEfficiency?: number;
  designCode?: string;
  volumeLiters?: number;
  headType?: string;
  bodyMaterial?: string;
  headMaterial?: string;
  headNominalThicknessMm?: number;
  
  // Dados operacionais
  operatingPressureBar?: number;
  operatingTemperatureC?: number;
  mawpBar?: number;
  hydroTestPressureBar?: number;
  fluidType?: string;
  fluidClass?: string;
  riskGroup?: number;
  nr13Category?: string;
}

// ============================================================
// SEÇÕES DO LAUDO
// ============================================================

export interface ExecutiveSummary {
  overview: string;               // Texto livre - visão geral
  keyFindings: string[];          // Principais achados (bullet points)
  overallStatus: InspectionConclusion;
  criticalityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiresImmediateAction: boolean;
}

export interface InspectionDataSection {
  inspection: InspectionData;
  equipment: EquipmentInfo;
  client: ClientInfo;
  
  // Fotos organizadas por categoria
  photos: ReportPhoto[];
  
  // Medições
  measurements: MeasurementPoint[];
  measurementStats: {
    count: number;
    minThicknessMm: number;
    maxThicknessMm: number;
    avgThicknessMm: number;
    belowMinCount: number;
    belowMinPercentage: number;
  };
}

export interface ReportPhoto {
  id: string;
  category: string;               // PLACA, CORROSAO, VALVULA, etc.
  url: string;
  caption?: string;
  order: number;
  takenAt: Date;
  takenBy: string;
}

export interface EngineeringResultsSection {
  // Análise completa do Engineering Engine
  integrityAnalysis: IntegrityAnalysis;
  
  // Cálculos individuais formatados
  calculations: FormattedCalculation[];
  
  // Simulações (se executadas)
  simulations?: FormattedSimulation[];
  
  // Referências normativas
  normativeReferences: string[];
  
  // Versões das fórmulas usadas
  formulaVersions: Record<string, string>;
}

export interface FormattedCalculation {
  id: string;
  label: string;
  value: string;                  // Valor formatado para exibição
  unit: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INSUFFICIENT_DATA' | 'NOT_APPLICABLE';
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NOT_ASSESSED';
  reliability: 'HIGH' | 'MEDIUM' | 'LOW' | 'THEORETICAL';
  explanation: string;
  normativeReference: string;
  observations: string[];
  rawValue: any;
  metadata: {
    calculationId: string;
    calculatedAt: Date;
    calculatedBy: string;
    formulaVersion: string;
    normativeVersion: string;
    inputs: Record<string, any>;
    warnings: string[];
  };
}

export interface FormattedSimulation {
  scenario: string;
  projectedThicknessMm: number;
  projectedDate: Date;
  willReachMinThickness: boolean;
  estimatedDateMinThickness?: Date;
  remainingLifeYears: number;
  recommendedInspectionIntervalMonths: number;
  warnings: string[];
}

export interface TechnicalConclusion {
  conclusion: InspectionConclusion;
  justification: string;          // Justificativa técnica detalhada
  riskFactors: RiskFactor[];
  complianceStatement: string;    // Declaração de conformidade NR-13/ASME/API
  restrictions?: string[];        // Restrições de operação (se houver)
}

export interface RiskFactor {
  factor: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NOT_ASSESSED';
  mitigation?: string;
}

export interface RecommendationsSection {
  immediate: Recommendation[];      // Ações imediatas (críticas)
  shortTerm: Recommendation[];      // Curto prazo (até 6 meses)
  mediumTerm: Recommendation[];     // Médio prazo (6-18 meses)
  longTerm: Recommendation[];       // Longo prazo (18+ meses)
  inspection: InspectionRecommendation;
}

export interface Recommendation {
  id: string;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'REPAIR' | 'REPLACE' | 'MONITOR' | 'INSPECT' | 'DOCUMENT' | 'OPERATIONAL';
  referencedStandard?: string;
  dueDate?: Date;
  responsibleRole?: string;
}

export interface InspectionRecommendation {
  nextInspectionDate: Date;
  intervalMonths: number;
  type: 'PERIODIC' | 'EXTRAORDINARY' | 'INITIAL';
  scope: string[];                  // Pontos/áreas a inspecionar
  criteria: string;                 // Critérios de aceitação
}

export interface NextInspectionSection {
  recommendedDate: Date;
  maxIntervalMonths: number;
  type: 'PERIODIC' | 'EXTRAORDINARY';
  justification: string;
  scope: string[];
  acceptanceCriteria: string;
}

export interface AttachmentsSection {
  photos: ReportPhoto[];
  documents: ReportDocument[];
  calculations: ReportCalculationFile[];
}

export interface ReportDocument {
  id: string;
  name: string;
  type: string;                     // PDF, DOC, XLS, etc.
  url: string;
  description?: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface ReportCalculationFile {
  id: string;
  calculationType: string;
  inputJson: string;                // JSON das entradas
  outputJson: string;               // JSON dos resultados
  generatedAt: Date;
  generatedBy: string;
}

// ============================================================
// HISTÓRICO E VERSIONAMENTO
// ============================================================

export interface ReportVersion {
  version: number;
  date: Date;
  authorId: string;
  authorName: string;
  authorRole: SignatureRole;
  changes: string;                  // Descrição das alterações
  status: ReportStatus;
  action: string;                   // Ação: CREATED, SUBMITTED, APPROVED, REJECTED, PUBLISHED, ARCHIVED, VALIDATED
  previousVersion?: number;
}

export interface ReportHistory {
  versions: ReportVersion[];
  currentVersion: number;
  totalVersions: number;
}

export interface ReportValidation {
  id: string;
  reportId: string;
  version: number;
  validatedAt: Date;
  validatedBy: string;
  validatorId: string;
  validatorName: string;
  validatorRole: SignatureRole;
  validatedByRole: SignatureRole;
  status: 'APPROVED' | 'REJECTED' | 'NEEDS_CHANGES';
  comments?: string;
  isValid: boolean;
  passRate: number;
  checklist: ValidationChecklistItem[];
}

export interface ValidationChecklistItem {
  item: string;
  passed: boolean;
  comments?: string;
  required: boolean;
  category?: string;
}

// ============================================================
// ASSINATURAS
// ============================================================

export interface ReportSignature {
  id: string;
  role: SignatureRole;
  userId: string;
  userName: string;
  userRegistration?: string;        // CREA, etc.
  signedAt: Date;
  signatureHash?: string;           // Hash da assinatura digital
  ipAddress?: string;
  status: 'APPROVED' | 'REJECTED';
  comments?: string;
}

export interface SignaturesSection {
  inspector?: ReportSignature;
  engineer?: ReportSignature;
  manager?: ReportSignature;
  quality?: ReportSignature;
  requiredRoles: SignatureRole[];
  isComplete: boolean;
  missingRoles: SignatureRole[];
}

// ============================================================
// ENTIDADE PRINCIPAL - TECHNICAL REPORT
// ============================================================

export interface TechnicalReport {
  // Identificação
  id: string;
  identification: ReportIdentification;
  
  // Partes interessadas
  client: ClientInfo;
  equipment: EquipmentInfo;
  
  // Seções técnicas
  executiveSummary: ExecutiveSummary;
  inspectionData: InspectionDataSection;
  engineeringResults: EngineeringResultsSection;
  technicalConclusion: TechnicalConclusion;
  recommendations: RecommendationsSection;
  nextInspection: NextInspectionSection;
  attachments: AttachmentsSection;
  
  // Controle
  history: ReportHistory;
  validations: ReportValidation[];
  signatures: SignaturesSection;
  
  // Metadados
  metadata: {
    templateId: string;
    templateVersion: string;
    generatedBy: string;
    generatedAt: Date;
    lastModifiedBy: string;
    lastModifiedAt: Date;
    placeholderMode: boolean;       // true se usando placeholders do Engine
  };
}

// ============================================================
// INPUT PARA BUILDER
// ============================================================

export interface ReportBuilderInput {
  inspection: InspectionData;
  equipment: EquipmentData;
  client: ClientInfo;
  engineeringAnalysis: IntegrityAnalysis;
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
  options?: ReportBuilderOptions;
}

export interface ReportBuilderOptions {
  reportType?: ReportType;
  templateId?: string;
  templateVersion?: string;
  includeSimulations?: boolean;
  customRecommendations?: Recommendation[];
  artNumber?: string;
  inspectorId: string;
  inspectorName: string;
  engineerId?: string;
  engineerName?: string;
  managerId?: string;
  managerName?: string;
}

// ============================================================
// PREVIEW OUTPUT
// ============================================================

export interface ReportPreviewData {
  // Dados já formatados para renderização
  cover: CoverPreviewData;
  sections: SectionPreviewData[];
  metadata: PreviewMetadata;
}

export interface CoverPreviewData {
  reportNumber: string;
  version: number;
  type: ReportType;
  clientName: string;
  equipmentTag: string;
  equipmentType: string;
  inspectionDate: string;
  issuedDate?: string;
  status: ReportStatus;
  artNumber?: string;
  inspectorName: string;
  engineerName?: string;
}

export interface SectionPreviewData {
  id: string;
  title: string;
  order: number;
  content: any;                     // Dados estruturados da seção
  renderType: 'table' | 'list' | 'text' | 'grid' | 'charts' | 'mixed';
}

export interface PreviewMetadata {
  totalPages: number;
  generatedAt: Date;
  templateId: string;
  templateVersion: string;
}

// ============================================================
// TEMPLATE REGISTRY
// ============================================================

export interface ReportTemplate {
  id: string;
  name: string;
  version: string;
  type: ReportType;
  description: string;
  sections: TemplateSection[];
  defaults: Partial<ReportBuilderOptions>;
}

export interface TemplateSection {
  id: string;
  title: string;
  order: number;
  required: boolean;
  renderType: 'table' | 'list' | 'text' | 'grid' | 'charts' | 'mixed';
  dataMapper: string;               // Nome da função que mapeia dados
  conditions?: string[];            // Condições para exibir seção
}

export interface TemplateRegistry {
  templates: Map<string, ReportTemplate>;
  defaultTemplateId: string;
  register(template: ReportTemplate): void;
  get(templateId: string): ReportTemplate | undefined;
  getDefault(): ReportTemplate;
  listByType(type: ReportType): ReportTemplate[];
}