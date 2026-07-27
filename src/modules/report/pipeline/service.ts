/**
 * Report Pipeline - Main Service
 * 
 * Orquestra todo o processo: Inspection → Engineering Engine → Report Builder → TechnicalReport
 */

import type {
  PipelineResult,
  PipelineStepResult,
  PipelineError,
  PipelineAudit,
  PipelineProgress,
  PipelineCallbacks,
  PipelineConfig,
  PipelineOptions,
  InspectionReportPipelineInput,
  PipelineStepName,
  PipelineStepStatus,
  PipelineStatus,
  RawInspectionData,
} from './types';

import { buildCalculationInput } from '@/modules/engineering';
import { TechnicalReportBuilder, TechnicalReportFactory, TechnicalReportEntity } from '../domain/entities';
import type { TechnicalReport, ValidationChecklistItem } from '../types';
import { engineeringIntegration, EngineeringIntegrationService } from '@/modules/engineering/integration';
import { generateId } from '../utils/id-generator';
import type { MeasurementPoint } from '@/modules/engineering/types';

// ============================================================
// PIPELINE CONFIG PADRÃO
// ============================================================

const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  steps: [
    { name: 'VALIDATE_INSPECTION', enabled: true, required: true, order: 1, timeoutMs: 5000 },
    { name: 'VALIDATE_EQUIPMENT', enabled: true, required: true, order: 2, timeoutMs: 5000 },
    { name: 'VALIDATE_MEASUREMENTS', enabled: true, required: true, order: 3, timeoutMs: 5000 },
    { name: 'BUILD_CALCULATION_INPUT', enabled: true, required: true, order: 4, timeoutMs: 5000 },
    { name: 'EXECUTE_ENGINEERING_ENGINE', enabled: true, required: true, order: 5, timeoutMs: 30000 },
    { name: 'BUILD_TECHNICAL_REPORT', enabled: true, required: true, order: 6, timeoutMs: 10000 },
    { name: 'VALIDATE_TECHNICAL_REPORT', enabled: true, required: true, order: 7, timeoutMs: 5000 },
    { name: 'SAVE_DRAFT', enabled: true, required: true, order: 8, timeoutMs: 5000 },
  ],
  timeouts: {
    VALIDATE_INSPECTION: 5000,
    VALIDATE_EQUIPMENT: 5000,
    VALIDATE_MEASUREMENTS: 5000,
    BUILD_CALCULATION_INPUT: 5000,
    EXECUTE_ENGINEERING_ENGINE: 30000,
    BUILD_TECHNICAL_REPORT: 10000,
    VALIDATE_TECHNICAL_REPORT: 5000,
    SAVE_DRAFT: 5000,
  },
  retryPolicy: {
    maxRetries: 2,
    retryDelayMs: 1000,
    backoffMultiplier: 2,
    retryableErrors: ['TIMEOUT', 'NETWORK_ERROR', 'ENGINE_UNAVAILABLE'],
  },
  validation: {
    strictMode: true,
    validateEngineOutput: true,
    validateReportCompleteness: true,
    requiredSections: [
      'executiveSummary',
      'inspectionData',
      'engineeringResults',
      'technicalConclusion',
      'recommendations',
      'nextInspection',
    ],
  },
};

// ============================================================
// CLASSE PRINCIPAL DO PIPELINE
// ============================================================

export class InspectionReportPipeline {
  private config: PipelineConfig;
  private integrationService: EngineeringIntegrationService;
  private callbacks: PipelineCallbacks = {};

  constructor(config?: Partial<PipelineConfig>, integrationService?: EngineeringIntegrationService) {
    this.config = { ...DEFAULT_PIPELINE_CONFIG, ...config };
    this.integrationService = integrationService || engineeringIntegration;
  }

  setCallbacks(callbacks: PipelineCallbacks): void {
    this.callbacks = callbacks;
  }

  // ============================================================
  // MÉTODO PRINCIPAL - EXECUTA PIPELINE COMPLETO
  // ============================================================

  async execute(input: InspectionReportPipelineInput): Promise<PipelineResult> {
    const pipelineId = generateId('pipe');
    const startedAt = new Date();
    
    // Inicializar auditoria
    const audit: PipelineAudit = {
      pipelineId,
      inspectionId: input.inspectionId,
      equipmentId: input.equipmentId,
      initiatedBy: input.options?.initiatedBy?.id || 'system',
      initiatedAt: startedAt,
      formulaVersion: '1.0.0-placeholder',
      templateVersion: input.options?.templateVersion || '1.0',
      reportVersion: '1.0',
      engineVersion: '1.0.0-placeholder',
      steps: [],
      outcome: 'FAILURE',
    };

    const steps: PipelineStepResult[] = [];
    const errors: PipelineError[] = [];
    const warnings: string[] = [];
    let report: TechnicalReport | undefined;
    let reportEntity: TechnicalReportEntity | undefined;
    let rawData: RawInspectionData | undefined;
    let integrityAnalysis: any | undefined;
    let calculationInput: any | undefined;

    const enabledSteps = this.config.steps
      .filter(s => s.enabled && !input.options?.skipSteps?.includes(s.name))
      .sort((a, b) => a.order - b.order);

    let currentStepIndex = 0;

    try {
      for (const stepConfig of enabledSteps) {
        currentStepIndex++;
        
        // Callback de progresso
        this.callbacks.onProgress?.({
          currentStep: stepConfig.name,
          stepIndex: currentStepIndex,
          totalSteps: enabledSteps.length,
          percentComplete: Math.round((currentStepIndex / enabledSteps.length) * 100),
        });

        // Callback de início de etapa
        this.callbacks.onStepStart?.(stepConfig.name, currentStepIndex, enabledSteps.length);

        const stepResult = await this.executeStep(stepConfig.name, {
          pipelineId,
          input,
          rawData,
          integrityAnalysis,
          report,
          reportEntity,
          audit,
          options: input.options,
          calculationInput,
        });

        steps.push(stepResult);
        
        // Atualizar auditoria
        audit.steps.push({
          step: stepConfig.name,
          startedAt: stepResult.startedAt,
          completedAt: stepResult.completedAt,
          durationMs: stepResult.durationMs,
          status: stepResult.status,
          warnings: stepResult.message ? [stepResult.message].filter(Boolean) : [],
          errors: stepResult.error ? [stepResult.error] : [],
        });

        // Callback de conclusão de etapa
        this.callbacks.onStepComplete?.(stepConfig.name, stepResult);

        // Verificar falha
        if (stepResult.status === 'FAILED') {
          if (stepConfig.required) {
            // Etapa obrigatória falhou - abortar pipeline
            errors.push(stepResult.error!);
            this.callbacks.onStepError?.(stepConfig.name, stepResult.error!);
            this.callbacks.onError?.(stepResult.error!);
            
            audit.outcome = 'FAILURE';
            audit.completedAt = new Date();
            audit.totalDurationMs = audit.completedAt.getTime() - startedAt.getTime();

            return this.buildResult(false, 'FAILED', pipelineId, steps, audit, errors, warnings, startedAt);
          } else {
            // Etapa opcional falhou - continuar com warning
            warnings.push(`Etapa opcional ${stepConfig.name} falhou: ${stepResult.error?.message}`);
          }
        }

        // Atualizar dados compartilhados entre etapas
        if (stepResult.data) {
          if (stepResult.data.rawData) rawData = stepResult.data.rawData;
          if (stepResult.data.calculationInput) calculationInput = stepResult.data.calculationInput;
          if (stepResult.data.integrityAnalysis) integrityAnalysis = stepResult.data.integrityAnalysis;
          if (stepResult.data.report) report = stepResult.data.report;
          if (stepResult.data.reportEntity) reportEntity = stepResult.data.reportEntity;
        }
      }

      // Pipeline concluído com sucesso
      audit.outcome = 'SUCCESS';
      audit.completedAt = new Date();
      audit.totalDurationMs = audit.completedAt.getTime() - startedAt.getTime();

      this.callbacks.onComplete?.(await this.buildResult(true, 'COMPLETED', pipelineId, steps, audit, errors, warnings, startedAt, report, reportEntity));

      return await this.buildResult(true, 'COMPLETED', pipelineId, steps, audit, errors, warnings, startedAt, report, reportEntity);

    } catch (error) {
      const pipelineError: PipelineError = {
        code: 'PIPELINE_EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Erro desconhecido no pipeline',
        details: { originalError: error },
        recoverable: false,
        timestamp: new Date(),
      };

      errors.push(pipelineError);
      audit.outcome = 'FAILURE';
      audit.completedAt = new Date();
      audit.totalDurationMs = audit.completedAt.getTime() - startedAt.getTime();

      this.callbacks.onError?.(pipelineError);

      return this.buildResult(false, 'FAILED', pipelineId, steps, audit, errors, warnings, startedAt);
    }
  }

  // ============================================================
  // EXECUÇÃO DE ETAPAS INDIVIDUAIS
  // ============================================================

  private async executeStep(
    stepName: PipelineStepName,
    context: PipelineStepContext
  ): Promise<PipelineStepResult> {
    const startedAt = new Date();
    const timeoutMs = this.config.timeouts[stepName] || 30000;

    try {
      // Implementar timeout
      const stepPromise = this.runStep(stepName, context);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout na etapa ${stepName} (${timeoutMs}ms)`)), timeoutMs)
      );

      const data = await Promise.race([stepPromise, timeoutPromise]);
      
      const completedAt = new Date();
      return {
        step: stepName,
        status: 'COMPLETED',
        startedAt,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
        message: `Etapa ${stepName} concluída com sucesso`,
        data,
      };

    } catch (error) {
      const completedAt = new Date();
      const pipelineError: PipelineError = {
        code: 'STEP_EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        step: stepName,
        details: { originalError: String(error) },
        recoverable: this.isRecoverableError(error),
        timestamp: completedAt,
      };

      return {
        step: stepName,
        status: 'FAILED',
        startedAt,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
        message: `Etapa ${stepName} falhou: ${pipelineError.message}`,
        error: pipelineError,
      };
    }
  }

  private async runStep(stepName: PipelineStepName, context: PipelineStepContext): Promise<PipelineStepData> {
    switch (stepName) {
      case 'VALIDATE_INSPECTION':
        return this.validateInspection(context);
      case 'VALIDATE_EQUIPMENT':
        return this.validateEquipment(context);
      case 'VALIDATE_MEASUREMENTS':
        return this.validateMeasurements(context);
      case 'BUILD_CALCULATION_INPUT':
        return this.buildCalculationInput(context);
      case 'EXECUTE_ENGINEERING_ENGINE':
        return this.executeEngineeringEngine(context);
      case 'BUILD_TECHNICAL_REPORT':
        return this.buildTechnicalReport(context);
      case 'VALIDATE_TECHNICAL_REPORT':
        return this.validateTechnicalReport(context);
      case 'SAVE_DRAFT':
        return this.saveDraft(context);
      default:
        throw new Error(`Etapa desconhecida: ${stepName}`);
    }
  }

  // ============================================================
  // IMPLEMENTAÇÃO DE CADA ETAPA
  // ============================================================

  private async validateInspection(context: PipelineStepContext): Promise<PipelineStepData> {
    const { input } = context;
    
    // Buscar dados brutos da inspeção (simulado - em produção viria do banco)
    const rawData = await this.fetchRawInspectionData(input.inspectionId, input.equipmentId);
    
    // Validações
    const errors: string[] = [];
    
    if (!rawData.inspection) errors.push('Inspeção não encontrada');
    if (!rawData.inspection?.id) errors.push('ID da inspeção ausente');
    if (!rawData.inspection?.equipmentId) errors.push('Equipamento não vinculado à inspeção');
    if (rawData.inspection?.status === 'EM_ANDAMENTO') errors.push('Inspeção ainda em andamento - não é possível gerar laudo');
    if (!rawData.inspection?.completedAt) errors.push('Inspeção não possui data de conclusão');
    if (!rawData.inspection?.inspectorId) errors.push('Inspetor não identificado');
    
    if (errors.length > 0) {
      throw new Error(`Validação da inspeção falhou: ${errors.join('; ')}`);
    }

    return { rawData };
  }

  private async validateEquipment(context: PipelineStepContext): Promise<PipelineStepData> {
    const { rawData } = context;
    
    if (!rawData) throw new Error('Dados da inspeção não disponíveis');
    
    const errors: string[] = [];
    
    if (!rawData.equipment) errors.push('Equipamento não encontrado');
    if (!rawData.equipment?.tag) errors.push('TAG do equipamento ausente');
    if (!rawData.equipment?.type) errors.push('Tipo do equipamento não informado');
    if (!rawData.equipment?.designPressureBar) errors.push('Pressão de projeto não informada');
    if (!rawData.equipment?.originalThicknessMm) errors.push('Espessura original não informada');
    if (!rawData.equipment?.minThicknessMm) errors.push('Espessura mínima não informada');
    if (!rawData.equipment?.designCode) errors.push('Código de projeto não informado');
    
    if (errors.length > 0) {
      throw new Error(`Validação do equipamento falhou: ${errors.join('; ')}`);
    }

    return {};
  }

  private async validateMeasurements(context: PipelineStepContext): Promise<PipelineStepData> {
    const { rawData } = context;
    
    if (!rawData) throw new Error('Dados da inspeção não disponíveis');
    
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!rawData.measurements || rawData.measurements.length === 0) {
      errors.push('Nenhuma medição encontrada para a inspeção');
    } else {
      const thicknessValues = rawData.measurements.map(m => m.thicknessMm);
      const minThickness = Math.min(...thicknessValues);
      const equipmentMin = rawData.equipment?.minThicknessMm || 0;
      
      if (minThickness < equipmentMin) {
        warnings.push(`${rawData.measurements.filter(m => m.thicknessMm < equipmentMin).length} pontos abaixo da espessura mínima (${equipmentMin}mm)`);
      }
      
      if (rawData.measurements.length < 4) {
        warnings.push(`Apenas ${rawData.measurements.length} pontos de medição - recomendado mínimo 8 pontos`);
      }
      
      // Verificar duplicatas
      const points = rawData.measurements.map(m => m.point);
      const duplicates = points.filter((p, i) => points.indexOf(p) !== i);
      if (duplicates.length > 0) {
        warnings.push(`Pontos de medição duplicados detectados: ${[...new Set(duplicates)].join(', ')}`);
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`Validação das medições falhou: ${errors.join('; ')}`);
    }

    return { warnings };
  }

  private async buildCalculationInput(context: PipelineStepContext): Promise<PipelineStepData> {
      const { rawData } = context;
   
      if (!rawData) throw new Error('Dados da inspeção não disponíveis');
   
      // Usar a função buildCalculationInput do módulo de engenharia
      const calculationInput = buildCalculationInput(
        rawData.equipment as any,
        rawData.inspection as any,
        rawData.measurements as any,
        {
          previousInspectionDate: rawData.inspection?.completedAt ? new Date(rawData.inspection.completedAt) : undefined,
          material: rawData.equipment?.bodyMaterial ? {
            name: rawData.equipment.bodyMaterial,
            specification: 'ASME',
            grade: '',
          } : undefined,
        }
      );

      return { calculationInput };
    }

  private async executeEngineeringEngine(context: PipelineStepContext): Promise<PipelineStepData> {
    const { rawData, calculationInput } = context;
    
    if (!rawData) throw new Error('Dados da inspeção não disponíveis');
    
    // Executar análise completa via Engineering Engine
    const integrityAnalysis = await this.integrationService.runCalculation({
      caseId: rawData.equipment.id,
      calculationType: 'FULL_INTEGRITY',
    });

    if (!integrityAnalysis.success || !integrityAnalysis.data) {
      throw new Error(`Engineering Engine falhou: ${integrityAnalysis.error || 'Erro desconhecido'}`);
    }

    return { 
      integrityAnalysis: integrityAnalysis.data,
      formulaVersion: integrityAnalysis.metadata.formulaVersion,
      normativeVersion: integrityAnalysis.metadata.normativeVersion,
    };
  }

  private async buildTechnicalReport(context: PipelineStepContext): Promise<PipelineStepData> {
    const { rawData, integrityAnalysis } = context;
    
    if (!rawData || !integrityAnalysis) throw new Error('Dados insuficientes para construir laudo');

    // Preparar input para o Report Builder
    const builderInput = {
      inspection: rawData.inspection as any,
      equipment: rawData.equipment as any,
      client: rawData.client as any,
      engineeringAnalysis: integrityAnalysis,
      measurements: rawData.measurements as any,
      photos: rawData.photos as any,
      options: {
        templateId: context.options?.templateId,
        templateVersion: context.options?.templateVersion,
        includeSimulations: context.options?.includeSimulations,
        inspectorId: rawData.inspection.inspectorId,
        inspectorName: 'Inspetor', // Inspector name not in InspectionData, using placeholder
        engineerId: context.options?.initiatedBy?.id,
        engineerName: context.options?.initiatedBy?.name,
      },
    };

    // Construir laudo técnico
    const reportEntity = TechnicalReportFactory.createDraft(builderInput);
    const report = reportEntity.toJSON();

    return { report, reportEntity };
  }

  private async validateTechnicalReport(context: PipelineStepContext): Promise<PipelineStepData> {
    const { reportEntity } = context;
    
    if (!reportEntity) throw new Error('Entidade do laudo não disponível para validação');

    // Validações de completude
    const checklist: ValidationChecklistItem[] = [
      {
        item: 'Identificação completa',
        passed: !!reportEntity.identification.reportNumber && !!reportEntity.identification.inspectionDate,
        required: true,
        category: 'IDENTIFICATION',
      },
      {
        item: 'Resumo executivo preenchido',
        passed: !!reportEntity.executiveSummary.overview && reportEntity.executiveSummary.overview.length > 50,
        required: true,
        category: 'EXECUTIVE_SUMMARY',
      },
      {
        item: 'Dados da inspeção completos',
        passed: !!reportEntity.inspectionData.measurements.length && reportEntity.inspectionData.measurements.length > 0,
        required: true,
        category: 'INSPECTION_DATA',
      },
      {
        item: 'Resultados de engenharia presentes',
        passed: !!reportEntity.engineeringResults.integrityAnalysis && 
                reportEntity.engineeringResults.calculations.length >= 3,
        required: true,
        category: 'ENGINEERING_RESULTS',
      },
      {
        item: 'Conclusão técnica preenchida',
        passed: !!reportEntity.technicalConclusion.conclusion && reportEntity.technicalConclusion.conclusion !== 'INDETERMINADO',
        required: true,
        category: 'TECHNICAL_CONCLUSION',
      },
      {
        item: 'Recomendações definidas',
        passed: reportEntity.recommendations.immediate.length > 0 || 
                reportEntity.recommendations.shortTerm.length > 0 ||
                reportEntity.recommendations.mediumTerm.length > 0 ||
                reportEntity.recommendations.longTerm.length > 0,
        required: true,
        category: 'RECOMMENDATIONS',
      },
      {
        item: 'Próxima inspeção agendada',
        passed: !!reportEntity.nextInspection.recommendedDate,
        required: true,
        category: 'NEXT_INSPECTION',
      },
    ];

    // Executar validação na entidade
    const validation = reportEntity.validate(checklist);

    if (!validation.isValid) {
      throw new Error(`Validação do laudo falhou: ${validation.checklist.filter(c => !c.passed && c.required).map(c => c.item).join(', ')}`);
    }

    return { validation };
  }

  private async saveDraft(context: PipelineStepContext): Promise<PipelineStepData> {
    const { reportEntity } = context;
    
    if (!reportEntity) throw new Error('Entidade do laudo não disponível para salvamento');

    // Em produção, aqui salvaria no banco de dados
    // Por enquanto, apenas simular salvamento e retornar ID
    const reportId = reportEntity.toJSON().id;
    
    // Marcar como DRAFT (já é o padrão ao criar)
    return { 
      savedReportId: reportId,
      message: `Laudo salvo como rascunho (ID: ${reportId})`,
    };
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  private async fetchRawInspectionData(inspectionId: string, equipmentId: string): Promise<RawInspectionData> {
    // Em produção, buscar do banco de dados (Prisma)
    // Por enquanto, retornar dados mock baseados nos casos do Engineering Studio
    const cases = this.integrationService.getAllCases();
    const matchedCase = cases.find(c => c.id === equipmentId);
    
    if (!matchedCase) {
      throw new Error(`Caso não encontrado para equipamento ${equipmentId}`);
    }

    const equipment = matchedCase.equipmentData!;
    const now = new Date();

    return {
      inspection: {
        id: inspectionId,
        equipmentId,
        inspectorId: 'inspector-001',
        status: 'APROVADA',
        startedAt: new Date(now.getTime() - 86400000), // 1 dia atrás
        completedAt: new Date(now.getTime() - 43200000), // 12 horas atrás
        approvedAt: new Date(now.getTime() - 21600000), // 6 horas atrás
        type: 'PERIODICA',
        notes: 'Inspeção periódica NR-13',
        recommendations: [],
      },
      equipment: {
        id: equipment.id,
        tag: equipment.tag,
        type: equipment.type,
        description: equipment.description,
        manufacturer: equipment.manufacturer,
        manufactureYear: equipment.manufactureYear,
        serialNumber: equipment.serialNumber,
        designCode: equipment.designCode,
        designTempC: equipment.designTempC,
        operatingPressureBar: equipment.operatingPressureBar,
        operatingTempC: equipment.operatingTempC,
        mawpBar: equipment.mawpBar,
        hydroTestPressureBar: equipment.hydroTestPressureBar,
        originalThicknessMm: equipment.originalThicknessMm,
        minThicknessMm: equipment.minThicknessMm,
        headType: equipment.headType,
        headMaterial: equipment.headMaterial,
        bodyMaterial: equipment.bodyMaterial,
        headNominalThicknessMm: equipment.headNominalThicknessMm,
        volumeLiters: equipment.volumeLiters,
        corrosionAllowanceMm: equipment.corrosionAllowanceMm,
        jointEfficiency: equipment.jointEfficiency,
        fluidType: equipment.fluidType,
        fluidClass: equipment.fluidClass,
        riskGroup: equipment.riskGroup,
        nr13Category: equipment.nr13Category,
      },
      measurements: this.generateMockMeasurements(equipment),
      photos: this.generateMockPhotos(),
      client: {
        id: 'client-001',
        name: matchedCase.client,
        cnpj: '00.000.000/0001-00',
        address: 'Endereço do Cliente',
        city: 'São Paulo',
        state: 'SP',
        contactName: 'Contato Técnico',
        contactEmail: 'contato@cliente.com',
        contactPhone: '(11) 99999-9999',
        responsibleTechnicalId: 'tech-001',
        responsibleTechnicalName: 'Eng. Responsável',
      },
    };
  }

  private generateMockMeasurements(equipment: any): MeasurementPoint[] {
    const baseThickness = equipment.originalThicknessMm || 10;
    const minThickness = equipment.minThicknessMm || 5;
    const points = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'];
    
    return points.map((point, i) => {
      const variation = (Math.random() - 0.5) * 2; // ±1mm
      const thickness = Math.max(minThickness - 0.5, baseThickness + variation);
      let status: 'OK' | 'ATTENTION' | 'CRITICAL' = 'OK';
      if (thickness < minThickness * 1.1) status = 'ATTENTION';
      if (thickness <= minThickness) status = 'CRITICAL';
      
      return {
        id: `meas-${equipment.id}-${point}`,
        inspectionId: `insp-${equipment.id}`,
        point,
        thicknessMm: Math.round(thickness * 100) / 100,
        angleDeg: i * 45,
        notes: status === 'CRITICAL' ? 'Ponto crítico - abaixo do mínimo' : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        status,
      };
    });
  }

  private generateMockPhotos() {
    const categories = ['PLACA', 'CORROSAO', 'VALVULA', 'MANOMETRO', 'VISTA_GERAL', 'SOLDA'];
    return categories.map((cat, i) => ({
      id: `photo-${i}`,
      inspectionId: 'insp-001',
      url: `/photos/${cat.toLowerCase()}.jpg`,
      category: cat,
      caption: `Foto da categoria ${cat}`,
      order: i,
      takenAt: new Date(),
      takenBy: 'inspector-001',
    }));
  }

  private isRecoverableError(error: any): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return message.includes('timeout') || 
             message.includes('network') || 
             message.includes('unavailable') ||
             message.includes('econnreset');
    }
    return false;
  }

  private buildResult(
    success: boolean,
    status: PipelineStatus,
    pipelineId: string,
    steps: PipelineStepResult[],
    audit: PipelineAudit,
    errors: PipelineError[],
    warnings: string[],
    startedAt: Date,
    report?: TechnicalReport,
    reportEntity?: TechnicalReportEntity
  ): PipelineResult {
    const completedAt = new Date();
    return {
      success,
      status,
      report,
      reportEntity,
      steps,
      audit,
      errors,
      warnings,
      startedAt,
      completedAt,
      totalDurationMs: completedAt.getTime() - startedAt.getTime(),
    };
  }
}

// ============================================================
// TIPOS INTERNOS (não exportados)
// ============================================================

interface PipelineStepData {
  rawData?: RawInspectionData;
  calculationInput?: any;
  integrityAnalysis?: any;
  report?: TechnicalReport;
  reportEntity?: TechnicalReportEntity;
  validation?: any;
  warnings?: string[];
  savedReportId?: string;
  message?: string;
  formulaVersion?: string;
  normativeVersion?: string;
}

interface PipelineStepContext {
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