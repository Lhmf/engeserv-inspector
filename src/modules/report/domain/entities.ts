// src/modules/report/domain/entities.ts
// Report Domain - Entidades Principais
// 
// Tipos exportados do módulo de relatórios
import type {
  TechnicalReport,
  ReportIdentification,
  ReportStatus,
  ReportVersion as ReportVersionType,
  ReportHistory,
  ReportValidation,
  ReportSignature,
  SignaturesSection,
  ClientInfo,
  EquipmentInfo,
  ExecutiveSummary,
  InspectionDataSection,
  EngineeringResultsSection,
  TechnicalConclusion,
  RecommendationsSection,
  NextInspectionSection,
  AttachmentsSection,
  ReportBuilderInput,
  ReportBuilderOptions,
  ReportPhoto,
  ReportPreviewData,
  ValidationChecklistItem,
} from '../types';

// Tipos exportados do módulo de engenharia
import type {
  EquipmentData as EngEquipmentData,
  InspectionData as EngInspectionData,
  MeasurementPoint as EngMeasurementPoint,
  MaterialData,
  OperatingConditions,
  IntegrityAnalysis,
  SimulationResult,
  ValidationResult,
} from '../../engineering/types';

import { generateId } from '../utils/id-generator';

// ============================================================
// ENTIDADE PRINCIPAL - TECHNICAL REPORT
// ============================================================

export class TechnicalReportEntity {
  private report: TechnicalReport;
  private _version: number = 1;
  private _history: ReportVersionType[] = [];
  private _validations: ReportValidation[] = [];

  constructor(report: TechnicalReport) {
    this.report = report;
    this._history.push({
      version: 1,
      date: new Date(),
      authorId: report.identification.inspectorId,
      authorName: report.identification.inspectorName,
      authorRole: 'INSPECTOR',
      changes: 'Criação do laudo',
      status: 'DRAFT',
      previousVersion: undefined,
    } as ReportVersionType);
  }

  get identification(): ReportIdentification { return this.report.identification; }
  get executiveSummary(): ExecutiveSummary { return this.report.executiveSummary; }
  get inspectionData(): InspectionDataSection { return this.report.inspectionData; }
  get engineeringResults(): EngineeringResultsSection { return this.report.engineeringResults; }
  get technicalConclusion(): TechnicalConclusion { return this.report.technicalConclusion; }
  get recommendations(): RecommendationsSection { return this.report.recommendations; }
  get nextInspection(): NextInspectionSection { return this.report.nextInspection; }
  get signatures(): SignaturesSection { return this.report.signatures; }
  get metadata(): ReportPreviewData['metadata'] { 
    return {
      totalPages: this.estimatePageCount(),
      generatedAt: this.report.metadata.generatedAt,
      templateId: this.report.metadata.templateId,
      templateVersion: this.report.metadata.templateVersion,
    };
  }

  get version(): number { return this._version; }
  get status(): ReportStatus { return this.report.identification.status; }
  get reportNumber(): string { return this.report.identification.reportNumber; }
  get history(): ReportVersionType[] { return [...this._history]; }
  get validations(): ReportValidation[] { return [...this._validations]; }

  // Métodos de domínio
  submitForReview(inspectorId: string, inspectorName: string): void {
    if (this.status !== 'DRAFT') throw new Error('Apenas rascunhos podem ser submetidos');
    this._changeStatus('UNDER_REVIEW', `Submetido para revisão por ${inspectorName}`, ['status'], inspectorId, inspectorName);
  }

  approve(approverId: string, approverName: string, role: 'ENGINEER' | 'MANAGER' | 'QUALITY'): void {
    if (this.status !== 'UNDER_REVIEW') throw new Error('Apenas laudos em revisão podem ser aprovados');
    this._addSignature({
      role,
      userId: approverId,
      userName: approverName,
      signedAt: new Date(),
      signatureHash: generateId('hash'),
      status: 'APPROVED',
    });
    this._changeStatus('APPROVED', `Aprovado por ${approverName} (${role})`, ['status', 'signatures'], approverId, approverName);
  }

  reject(approverId: string, approverName: string, reason: string, role: 'ENGINEER' | 'MANAGER' | 'QUALITY'): void {
    if (this.status !== 'UNDER_REVIEW') throw new Error('Apenas laudos em revisão podem ser rejeitados');
    this._addSignature({
      role,
      userId: approverId,
      userName: approverName,
      signedAt: new Date(),
      signatureHash: generateId('hash'),
      status: 'REJECTED',
      comments: reason,
    });
    this._changeStatus('REJECTED', `Rejeitado por ${approverName} (${role}): ${reason}`, ['status', 'signatures'], approverId, approverName);
  }

  publish(publisherId: string, publisherName: string): void {
    if (this.status !== 'APPROVED') throw new Error('Apenas laudos aprovados podem ser publicados');
    this._changeStatus('PUBLISHED', `Publicado por ${publisherName}`, ['status'], publisherId, publisherName);
    this.report.identification.issuedAt = new Date();
  }

  archive(archiverId: string, archiverName: string): void {
    if (this.status !== 'PUBLISHED' && this.status !== 'REJECTED') {
      throw new Error('Apenas laudos publicados ou rejeitados podem ser arquivados');
    }
    this._changeStatus('ARCHIVED', `Arquivado por ${archiverName}`, ['status'], archiverId, archiverName);
  }

  updateContent(editorId: string, editorName: string, changes: Partial<TechnicalReport>, changedFields: string[]): void {
    if (this.status === 'PUBLISHED' || this.status === 'ARCHIVED') {
      throw new Error('Não é possível editar laudos publicados ou arquivados');
    }
    
    this.report = { ...this.report, ...changes };
    this._changeStatus(this.status, `Atualizado por ${editorName}`, changedFields, editorId, editorName);
    this._version++;
  }

  addValidation(validation: ReportValidation): void {
    this._validations.push(validation);
    this._history.push({
      version: this._version,
      date: new Date(),
      authorId: validation.validatorId,
      authorName: validation.validatorName,
      authorRole: validation.validatorRole,
      changes: `Validação ${validation.isValid ? 'aprovada' : 'reprovada'} (${validation.passRate.toFixed(1)}%)`,
      status: this.status,
      previousVersion: this._version - 1,
    } as ReportVersionType);
  }

  validate(checklist: ValidationChecklistItem[]): ReportValidation {
    const passedCount = checklist.filter(c => c.passed).length;
    const totalCount = checklist.length;
    const passRate = totalCount > 0 ? (passedCount / totalCount) * 100 : 0;
    
    const validation: ReportValidation = {
      id: generateId('val'),
      reportId: this.report.id,
      version: this._version,
      validatedAt: new Date(),
      validatedBy: 'system',
      validatorId: 'system',
      validatorName: 'System Validation',
      validatorRole: 'ENGINEER',
      validatedByRole: 'ENGINEER',
      status: checklist.every(c => c.passed || !c.required) ? 'APPROVED' : 'NEEDS_CHANGES',
      checklist,
      isValid: checklist.every(c => c.passed || !c.required),
      passRate,
    };
    
    this.addValidation(validation);
    return validation;
  }

  getPreviewData(): ReportPreviewData {
    const r = this.report;
    return {
      cover: {
        reportNumber: r.identification.reportNumber,
        version: r.identification.version,
        type: r.identification.type,
        clientName: r.inspectionData.client.name,
        equipmentTag: r.inspectionData.equipment.tag,
        equipmentType: r.inspectionData.equipment.type,
        inspectionDate: r.identification.inspectionDate.toISOString().split('T')[0],
        issuedDate: r.identification.issuedAt?.toISOString().split('T')[0],
        status: r.identification.status,
        artNumber: r.identification.artNumber,
        inspectorName: r.identification.inspectorName,
        engineerName: r.identification.engineerName,
      },
      sections: [
        { id: 'executive-summary', title: 'Resumo Executivo', order: 1, content: r.executiveSummary, renderType: 'text' },
        { id: 'inspection-data', title: 'Dados da Inspeção', order: 2, content: r.inspectionData, renderType: 'mixed' },
        { id: 'measurements', title: 'Resultados das Medições', order: 3, content: r.inspectionData.measurements, renderType: 'table' },
        { id: 'photos', title: 'Fotografias', order: 4, content: r.inspectionData.photos, renderType: 'grid' },
        { id: 'engineering-results', title: 'Resultados da Engenharia', order: 5, content: r.engineeringResults, renderType: 'charts' },
        { id: 'conclusion', title: 'Conclusão Técnica', order: 6, content: r.technicalConclusion, renderType: 'text' },
        { id: 'recommendations', title: 'Recomendações', order: 7, content: r.recommendations, renderType: 'list' },
        { id: 'next-inspection', title: 'Próxima Inspeção', order: 8, content: r.nextInspection, renderType: 'text' },
        { id: 'signatures', title: 'Assinaturas', order: 9, content: r.signatures, renderType: 'list' },
      ],
      metadata: {
        totalPages: this.estimatePageCount(),
        generatedAt: new Date(),
        templateId: r.metadata.templateId,
        templateVersion: r.metadata.templateVersion,
      },
    };
  }

  toJSON(): TechnicalReport {
    return { ...this.report };
  }

  private _changeStatus(
    newStatus: ReportStatus,
    details: string,
    changedFields: string[],
    authorId: string,
    authorName: string
  ): void {
    this.report.identification.status = newStatus;
    this._history.push({
      version: this._version,
      date: new Date(),
      authorId,
      authorName,
      authorRole: 'MANAGER',
      changes: details,
      status: newStatus,
      previousVersion: this._version - 1,
    } as ReportVersionType);
  }

  private _addSignature(signature: Omit<ReportSignature, 'id'>): void {
    const fullSignature: ReportSignature = {
      ...signature,
      id: generateId('sig'),
    };
    // Assinaturas são armazenadas na seção de assinaturas do laudo
    if (signature.role === 'INSPECTOR') this.report.signatures.inspector = fullSignature;
    else if (signature.role === 'ENGINEER') this.report.signatures.engineer = fullSignature;
    else if (signature.role === 'MANAGER') this.report.signatures.manager = fullSignature;
    else if (signature.role === 'QUALITY') this.report.signatures.quality = fullSignature;
  }

  private estimatePageCount(): number {
    let pages = 2;
    pages += Math.ceil((this.report.executiveSummary.overview?.length || 0) / 2000);
    pages += Math.ceil(this.report.inspectionData.measurements.length / 20);
    pages += this.report.inspectionData.photos.length ? Math.ceil(this.report.inspectionData.photos.length / 4) : 0;
    pages += this.report.engineeringResults.calculations.length ? Math.ceil(this.report.engineeringResults.calculations.length / 2) : 0;
    pages += 2;
    return pages;
  }

  // ============================================================
  // FACTORY STATIC
  // ============================================================

  static create(input: ReportBuilderInput): TechnicalReportEntity {
    const report = TechnicalReportBuilder.build(input);
    return new TechnicalReportEntity(report);
  }
}

// ============================================================
// FACTORY PARA CRIAÇÃO
// ============================================================

export class TechnicalReportFactory {
  static createDraft(input: ReportBuilderInput): TechnicalReportEntity {
    return TechnicalReportEntity.create(input);
  }

  static createFromExisting(report: TechnicalReport): TechnicalReportEntity {
    return new TechnicalReportEntity(report);
  }
}

// ============================================================
// BUILDER
// ============================================================

export class TechnicalReportBuilder {
  static build(input: ReportBuilderInput): TechnicalReport {
    const { inspection, equipment, client, engineeringAnalysis, measurements, photos, options } = input;
    
    const reportNumber = `LT-${new Date().getFullYear()}-${generateId('num').slice(-5)}`;
    const now = new Date();

    return {
      id: generateId('rpt'),
      identification: {
        reportNumber,
        version: 1,
        type: options?.templateId ? 'NR13' : 'NR13',
        status: 'DRAFT',
        artNumber: options?.artNumber,
        inspectionDate: inspection.startedAt,
        createdAt: now,
        updatedAt: now,
        inspectorId: options?.inspectorId || '',
        inspectorName: options?.inspectorName || '',
        engineerId: options?.engineerId,
        engineerName: options?.engineerName,
      },
      // Top-level client and equipment (required by TechnicalReport type)
      client: {
        id: client.id,
        name: client.name,
        cnpj: client.cnpj,
        address: client.address,
        city: client.city,
        state: client.state,
        contactName: client.contactName,
        contactEmail: client.contactEmail,
        contactPhone: client.contactPhone,
        responsibleTechnicalId: client.responsibleTechnicalId,
        responsibleTechnicalName: client.responsibleTechnicalName,
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
        designTemperatureC: equipment.designTempC,
        operatingPressureBar: equipment.operatingPressureBar,
        operatingTemperatureC: equipment.operatingTempC,
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
      executiveSummary: {
        overview: '',
        keyFindings: [],
        overallStatus: 'INDETERMINADO',
        criticalityLevel: 'LOW',
        requiresImmediateAction: false,
      },
      inspectionData: {
        inspection: {
          id: inspection.id,
          equipmentId: inspection.equipmentId,
          inspectorId: inspection.inspectorId,
          status: inspection.status,
          startedAt: inspection.startedAt,
          completedAt: inspection.completedAt,
          approvedAt: inspection.approvedAt,
          approvedById: inspection.approvedById,
          rejectionReason: inspection.rejectionReason,
          type: inspection.type,
          notes: inspection.notes,
          recommendations: inspection.recommendations,
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
          designTemperatureC: equipment.designTempC,
          operatingPressureBar: equipment.operatingPressureBar,
          operatingTemperatureC: equipment.operatingTempC,
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
        client: {
          id: client.id,
          name: client.name,
          cnpj: client.cnpj,
          address: client.address,
          city: client.city,
          state: client.state,
          contactName: client.contactName,
          contactEmail: client.contactEmail,
          contactPhone: client.contactPhone,
          responsibleTechnicalId: client.responsibleTechnicalId,
          responsibleTechnicalName: client.responsibleTechnicalName,
        },
        measurements,
        photos: photos.map((p, i) => ({
          id: p.id || generateId('pho'),
          category: p.category,
          url: p.url,
          caption: p.caption,
          order: p.order ?? i,
          takenAt: p.takenAt,
          takenBy: p.takenBy,
        })),
        measurementStats: this.calculateStats(measurements, equipment.minThicknessMm || 0),
      },
      engineeringResults: {
        integrityAnalysis: engineeringAnalysis,
        calculations: this.formatCalculations(engineeringAnalysis),
        simulations: [],
        formulaVersions: engineeringAnalysis.formulaVersions,
        normativeReferences: engineeringAnalysis.normativeReferences,
      },
      technicalConclusion: {
        conclusion: 'INDETERMINADO',
        justification: '',
        riskFactors: engineeringAnalysis.riskFactors.map(rf => ({
          factor: rf.factor,
          description: rf.description,
          severity: rf.severity,
          mitigation: rf.mitigation,
        })),
        complianceStatement: 'Laudo elaborado conforme NR-13, ASME BPVC VIII-1, API 570/510.',
        restrictions: [],
      },
      recommendations: {
        immediate: [],
        shortTerm: [],
        mediumTerm: [],
        longTerm: [],
        inspection: {
          nextInspectionDate: engineeringAnalysis.nextInspectionDate?.value || new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
          intervalMonths: 12,
          type: 'PERIODIC',
          scope: ['Inspeção visual', 'Medições de espessura', 'Testes não destrutivos'],
          criteria: 'Conforme NR-13 e normas aplicáveis',
        },
      },
      nextInspection: {
        recommendedDate: engineeringAnalysis.nextInspectionDate?.value || new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
        maxIntervalMonths: 12,
        type: 'PERIODIC',
        justification: 'Intervalo padrão NR-13 para vasos de pressão',
        scope: ['Inspeção visual', 'Medições de espessura', 'Testes não destrutivos'],
        acceptanceCriteria: 'Conforme NR-13 e normas aplicáveis',
      },
      signatures: {
        requiredRoles: ['INSPECTOR', 'ENGINEER', 'MANAGER'],
        isComplete: false,
        missingRoles: ['INSPECTOR', 'ENGINEER', 'MANAGER'],
      },
      attachments: {
        photos: photos.map((p, i) => ({
          id: p.id || generateId('pho'),
          category: p.category,
          url: p.url,
          caption: p.caption,
          order: p.order ?? i,
          takenAt: p.takenAt,
          takenBy: p.takenBy,
        })),
        documents: [],
        calculations: [],
      },
      history: {
        versions: [{
          version: 1,
          date: now,
          authorId: options?.inspectorId || '',
          authorName: options?.inspectorName || '',
          authorRole: 'INSPECTOR',
          changes: 'Criação do laudo',
          status: 'DRAFT',
          action: 'CREATED',
          previousVersion: undefined,
        }],
        currentVersion: 1,
        totalVersions: 1,
      },
      validations: [],
      metadata: {
        templateId: options?.templateId || 'DEFAULT_NR13',
        templateVersion: options?.templateVersion || '1.0',
        generatedAt: now,
        generatedBy: options?.inspectorId || '',
        lastModifiedBy: options?.inspectorId || '',
        lastModifiedAt: now,
        placeholderMode: true,
      },
    } as TechnicalReport;
  }

  private static calculateStats(measurements: EngMeasurementPoint[], minThickness: number) {
    if (!measurements.length) {
      return { count: 0, minThicknessMm: 0, maxThicknessMm: 0, avgThicknessMm: 0, belowMinCount: 0, belowMinPercentage: 0 };
    }
    const thicknesses = measurements.map(m => m.thicknessMm);
    const belowMin = thicknesses.filter(t => t < minThickness).length;
    return {
      count: measurements.length,
      minThicknessMm: Math.min(...thicknesses),
      maxThicknessMm: Math.max(...thicknesses),
      avgThicknessMm: thicknesses.reduce((a, b) => a + b, 0) / thicknesses.length,
      belowMinCount: belowMin,
      belowMinPercentage: (belowMin / measurements.length) * 100,
    };
  }

  private static formatCalculations(analysis: IntegrityAnalysis) {
    const calcs: any[] = [];
    if (analysis.minimumThickness) {
      calcs.push({
        id: analysis.minimumThickness.metadata.calculationId,
        label: 'Espessura Mínima Admissível',
        value: analysis.minimumThickness.value?.toFixed(2) || '—',
        unit: 'mm',
        status: analysis.minimumThickness.status,
        criticality: analysis.minimumThickness.criticality,
        reliability: analysis.minimumThickness.reliability,
        explanation: analysis.minimumThickness.explanation,
        normativeReference: analysis.minimumThickness.normativeReference,
        observations: analysis.minimumThickness.observations,
      });
    }
    if (analysis.corrosionRate) {
      calcs.push({
        id: analysis.corrosionRate.metadata.calculationId,
        label: 'Taxa de Corrosão',
        value: analysis.corrosionRate.value?.toFixed(3) || '—',
        unit: 'mm/ano',
        status: analysis.corrosionRate.status,
        criticality: analysis.corrosionRate.criticality,
        reliability: analysis.corrosionRate.reliability,
        explanation: analysis.corrosionRate.explanation,
        normativeReference: analysis.corrosionRate.normativeReference,
        observations: analysis.corrosionRate.observations,
      });
    }
    if (analysis.remainingLife) {
      calcs.push({
        id: analysis.remainingLife.metadata.calculationId,
        label: 'Vida Útil Remanescente',
        value: analysis.remainingLife.value?.toFixed(1) || '—',
        unit: 'anos',
        status: analysis.remainingLife.status,
        criticality: analysis.remainingLife.criticality,
        reliability: analysis.remainingLife.reliability,
        explanation: analysis.remainingLife.explanation,
        normativeReference: analysis.remainingLife.normativeReference,
        observations: analysis.remainingLife.observations,
      });
    }
    if (analysis.mawp) {
      calcs.push({
        id: analysis.mawp.metadata.calculationId,
        label: 'PMTA (Pressão Máxima de Trabalho Admissível)',
        value: analysis.mawp.value?.toFixed(2) || '—',
        unit: 'bar',
        status: analysis.mawp.status,
        criticality: analysis.mawp.criticality,
        reliability: analysis.mawp.reliability,
        explanation: analysis.mawp.explanation,
        normativeReference: analysis.mawp.normativeReference,
        observations: analysis.mawp.observations,
      });
    }
    return calcs;
  }
}