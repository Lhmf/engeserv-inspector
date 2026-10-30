import { NextRequest, NextResponse } from 'next/server';
import { getSession, canIssueFinalReport } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { renderOfficialNr13Html } from '@/modules/report/templates/nr13/official-html';
import { renderHtmlToPdf } from '@/modules/report/pdf/server-renderer';
import { resolveCompanyInfoFromEnv } from '@/modules/report/company-info';
import { DEMO_COMPANY_INFO } from '@/modules/report/company-info';
import { assessTechnicalReportEmission, sanitizeForEmission } from '@/modules/report/safety/emission';
import type { TechnicalReport } from '@/modules/report/types';
import type { CompanyInfo } from '@/modules/report/templates/nr13/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Buscar o laudo técnico
    const technicalReport = await prisma.technicalReport.findUnique({
      where: { id },
      include: {
        inspection: {
          include: {
            equipment: {
              include: {
                client: { include: { documents: true } },
              },
            },
            inspector: true,
          },
        },
      },
    });

    if (!technicalReport) {
      return NextResponse.json({ error: 'Laudo não encontrado.' }, { status: 404 });
    }

    // Parse JSON fields and build TechnicalReport domain object
    // Wrap in try/catch to handle incomplete inspection data gracefully
    let report: TechnicalReport;
    try {
      report = parseTechnicalReport(technicalReport);
    } catch (parseError: any) {
      console.warn('Erro ao parsear TechnicalReport, usando dados parciais:', parseError.message);
      // Return a minimal valid report structure to prevent PDF generation failure
      report = parseTechnicalReport({
        ...technicalReport,
        inspection: technicalReport.inspection || {},
        executiveSummary: technicalReport.executiveSummary || '{}',
        inspectionData: technicalReport.inspectionData || JSON.stringify({
          inspection: {}, equipment: {}, client: {}, measurements: [], photos: [],
          measurementStats: { count: 0, minThicknessMm: 0, maxThicknessMm: 0, avgThicknessMm: 0, belowMinCount: 0, belowMinPercentage: 0 },
        }),
        engineeringResults: technicalReport.engineeringResults || '{}',
        technicalConclusion: technicalReport.technicalConclusion || '{}',
        recommendations: technicalReport.recommendations || '{}',
        nextInspection: technicalReport.nextInspection || '{}',
        attachments: technicalReport.attachments || '{}',
        signatures: technicalReport.signatures || '{}',
      });
    }

    const demoMode = req.nextUrl.searchParams.get('mode')?.toLowerCase() === 'demo';
    if (!demoMode && !canIssueFinalReport(session.role)) {
      return NextResponse.json(
        { error: 'Funcionário não pode emitir ou liberar laudo definitivo.', code: 'DEFINITIVE_EMISSION_FORBIDDEN' },
        { status: 403 },
      );
    }
    const assessment = assessTechnicalReportEmission(report);
    if (!demoMode && !assessment.canEmitDefinitive) {
      return NextResponse.json(
        {
          error: 'Emissão definitiva bloqueada: os cálculos de engenharia ainda não foram validados.',
          code: 'EMISSION_BLOCKED_UNVALIDATED_ENGINEERING',
          reasons: assessment.reasons,
        },
        { status: 409 }
      );
    }

    const emissionReport = demoMode
      ? sanitizeForEmission(report, 'DEMO', assessment)
      : report;

    // O modo definitivo exige dados reais da empresa emitente. O modo demo
    // usa identificação explícita e nunca pode ser confundido com laudo técnico.
    const company = demoMode ? DEMO_COMPANY_INFO : resolveCompanyInfoFromEnv();
    if (!company) {
      return NextResponse.json(
        {
          error: 'Emissão definitiva bloqueada: faltam os dados institucionais da EngeServ.',
          code: 'DEFINITIVE_COMPANY_INFO_REQUIRED',
          required: ['REPORT_COMPANY_NAME', 'REPORT_COMPANY_CNPJ'],
        },
        { status: 409 }
      );
    }
    const html = renderOfficialNr13Html({
      ...emissionReport,
      metadata: {
        ...(emissionReport.metadata || {}),
        companyName: company.name,
        companyCnpj: company.cnpj,
        companyAddress: company.address,
        companyEmail: company.email,
        companySite: company.website,
      },
    } as TechnicalReport);
    const pdfBytes = await renderHtmlToPdf(html);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="laudo-${emissionReport.identification.reportNumber}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error: any) {
    console.error('Erro ao gerar PDF:', error);
    return NextResponse.json({ error: error.message || 'Erro ao gerar PDF' }, { status: 500 });
  }
}

// ============================================================
// PARSE PRISMA RECORD → DOMAIN TechnicalReport
// ============================================================

function parseTechnicalReport(raw: any): TechnicalReport {
  const parseJson = (value: any) => {
    if (value === null || value === undefined) return value;
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return value; }
    }
    return value;
  };

  const inspect = raw.inspection || {};
  const equip = inspect.equipment || {};
  const client = equip.client || {};
  const inspector = inspect.inspector || {};
  const clientDocuments = Array.isArray(client.documents) ? client.documents : [];

  // Parse all JSON fields
  const clientData = parseJson(raw.clientData) || {};
  const equipmentData = parseJson(raw.equipmentData) || {};
  const executiveSummary = parseJson(raw.executiveSummary) || {};
  const inspectionData = parseJson(raw.inspectionData) || {};
  const engineeringResults = parseJson(raw.engineeringResults) || {};
  const technicalConclusion = parseJson(raw.technicalConclusion) || {};
  const recommendations = parseJson(raw.recommendations) || {};
  const nextInspection = parseJson(raw.nextInspection) || {};
  const attachments = parseJson(raw.attachments) || {};
  const history = parseJson(raw.history) || {};
  const signatures = parseJson(raw.signatures) || {};
  const metadata = parseJson(raw.metadata) || {};

  const now = new Date();
  const inspectionDate = raw.inspectionDate ? new Date(raw.inspectionDate) : now;

  return {
    id: raw.id,
    identification: {
      reportNumber: raw.reportNumber || 'LT-00000',
      version: raw.version || 1,
      type: (raw.reportType || 'NR13') as any,
      status: (raw.status || 'DRAFT') as any,
      createdAt: raw.createdAt ? new Date(raw.createdAt) : now,
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : now,
      inspectionDate,
      issuedAt: raw.issuedAt ? new Date(raw.issuedAt) : undefined,
      expiresAt: raw.expiresAt ? new Date(raw.expiresAt) : undefined,
      artNumber: raw.artNumber,
      inspectorId: inspect.inspectorId || '',
      inspectorName: inspector.name || raw.inspectorName || 'Inspetor',
      engineerId: raw.engineerId,
      engineerName: raw.engineerName,
      managerId: raw.managerId,
      managerName: raw.managerName,
    },
    client: {
      id: client.id || clientData.id || '',
      name: clientData.name || client.name || 'Cliente não informado',
      cnpj: clientData.cnpj || client.cnpj || '',
      address: clientData.address || client.address || '',
      city: clientData.city || client.city || '',
      state: clientData.state || client.state || '',
      contactName: clientData.contactName || client.contactName,
      contactEmail: clientData.contactEmail || client.contactEmail,
      contactPhone: clientData.contactPhone || client.contactPhone,
      responsibleTechnicalId: clientData.responsibleTechnicalId || client.responsibleTechnicalId,
      responsibleTechnicalName: clientData.responsibleTechnicalName || client.responsibleTechnicalName,
    },
    equipment: {
      id: equipmentData.id || equip.id || '',
      tag: equipmentData.tag || equip.tag || 'TAG',
      type: equipmentData.type || equip.type || 'NAO_INFORMADO',
      description: equipmentData.description || equip.description,
      manufacturer: equipmentData.manufacturer || equip.manufacturer,
      manufactureYear: equipmentData.manufactureYear || equip.manufactureYear,
      serialNumber: equipmentData.serialNumber || equip.serialNumber,
      designPressureBar: equipmentData.designPressureBar || equip.designPressureBar,
      designTemperatureC: equipmentData.designTemperatureC || equip.designTemperatureC,
      originalThicknessMm: equipmentData.originalThicknessMm || equip.originalThicknessMm,
      minThicknessMm: equipmentData.minThicknessMm || equip.minThicknessMm,
      corrosionAllowanceMm: equipmentData.corrosionAllowanceMm || equip.corrosionAllowanceMm,
      jointEfficiency: equipmentData.jointEfficiency || equip.jointEfficiency,
      designCode: equipmentData.designCode || equip.designCode,
      volumeLiters: equipmentData.volumeLiters || equip.volumeLiters,
      headType: equipmentData.headType || equip.headType,
      lengthMm: equipmentData.lengthMm || equip.lengthMm,
      insideDiameterMm: equipmentData.insideDiameterMm || equip.insideDiameterMm,
      orientation: equipmentData.orientation || equip.orientation,
      jointType: equipmentData.jointType || equip.jointType,
      installationLocation: equipmentData.installationLocation || equip.installationLocation,
      bodyMaterial: equipmentData.bodyMaterial || equip.bodyMaterial,
      headMaterial: equipmentData.headMaterial || equip.headMaterial,
      operatingPressureBar: equipmentData.operatingPressureBar || equip.operatingPressureBar,
      operatingTemperatureC: equipmentData.operatingTemperatureC || equip.operatingTemperatureC,
      mawpBar: equipmentData.mawpBar || equip.mawpBar,
      hydroTestPressureBar: equipmentData.hydroTestPressureBar || equip.hydroTestPressureBar,
      fluidType: equipmentData.fluidType || equip.fluidType,
      fluidClass: equipmentData.fluidClass || equip.fluidClass,
      riskGroup: equipmentData.riskGroup || equip.riskGroup,
      nr13Category: equipmentData.nr13Category || equip.nr13Category,
    },
    executiveSummary: {
      overview: executiveSummary.overallStatus ? `Status: ${executiveSummary.overallStatus}` : 'Laudo técnico NR-13',
      keyFindings: executiveSummary.keyFindings || [],
      overallStatus: executiveSummary.overallStatus || 'INDETERMINADO',
      criticalityLevel: executiveSummary.criticalityLevel || 'NOT_ASSESSED',
      requiresImmediateAction: executiveSummary.requiresImmediateAction || false,
    },
    inspectionData: {
      inspection: {
        id: inspect.id || '',
        equipmentId: inspect.equipmentId || '',
        inspectorId: inspect.inspectorId || '',
        status: inspect.status || 'APROVADA',
        startedAt: inspect.startedAt ? new Date(inspect.startedAt) : inspectionDate,
        completedAt: inspect.completedAt ? new Date(inspect.completedAt) : undefined,
        approvedAt: inspect.approvedAt ? new Date(inspect.approvedAt) : undefined,
        type: inspect.type || 'PERIODICA',
        notes: inspect.notes,
        fieldChecklist: inspect.fieldChecklist || inspectionData.fieldChecklist || {},
        recommendations: inspect.recommendations,
      },
      fieldChecklist: inspect.fieldChecklist || inspectionData.fieldChecklist || {},
      equipment: {
        id: equipmentData.id || equip.id || '',
        tag: equipmentData.tag || equip.tag || 'TAG',
        type: equipmentData.type || equip.type || 'NAO_INFORMADO',
        description: equipmentData.description || equip.description,
        manufacturer: equipmentData.manufacturer || equip.manufacturer,
        manufactureYear: equipmentData.manufactureYear || equip.manufactureYear,
        serialNumber: equipmentData.serialNumber || equip.serialNumber,
        designPressureBar: equipmentData.designPressureBar || equip.designPressureBar,
        designTemperatureC: equipmentData.designTemperatureC || equip.designTemperatureC,
        originalThicknessMm: equipmentData.originalThicknessMm || equip.originalThicknessMm,
        minThicknessMm: equipmentData.minThicknessMm || equip.minThicknessMm,
        corrosionAllowanceMm: equipmentData.corrosionAllowanceMm || equip.corrosionAllowanceMm,
        jointEfficiency: equipmentData.jointEfficiency || equip.jointEfficiency,
        designCode: equipmentData.designCode || equip.designCode,
        volumeLiters: equipmentData.volumeLiters || equip.volumeLiters,
        headType: equipmentData.headType || equip.headType,
        lengthMm: equipmentData.lengthMm || equip.lengthMm,
        insideDiameterMm: equipmentData.insideDiameterMm || equip.insideDiameterMm,
        orientation: equipmentData.orientation || equip.orientation,
        jointType: equipmentData.jointType || equip.jointType,
        installationLocation: equipmentData.installationLocation || equip.installationLocation,
        bodyMaterial: equipmentData.bodyMaterial || equip.bodyMaterial,
        headMaterial: equipmentData.headMaterial || equip.headMaterial,
        operatingPressureBar: equipmentData.operatingPressureBar || equip.operatingPressureBar,
        operatingTemperatureC: equipmentData.operatingTemperatureC || equip.operatingTemperatureC,
        mawpBar: equipmentData.mawpBar || equip.mawpBar,
        hydroTestPressureBar: equipmentData.hydroTestPressureBar || equip.hydroTestPressureBar,
        fluidType: equipmentData.fluidType || equip.fluidType,
        fluidClass: equipmentData.fluidClass || equip.fluidClass,
        riskGroup: equipmentData.riskGroup || equip.riskGroup,
        nr13Category: equipmentData.nr13Category || equip.nr13Category,
      },
      client: {
        id: client.id || clientData.id || '',
        name: clientData.name || client.name || 'Cliente não informado',
        cnpj: clientData.cnpj || client.cnpj || '',
        address: clientData.address || client.address || '',
        city: clientData.city || client.city || '',
        state: clientData.state || client.state || '',
        contactName: clientData.contactName || client.contactName,
        contactEmail: clientData.contactEmail || client.contactEmail,
        contactPhone: clientData.contactPhone || client.contactPhone,
        responsibleTechnicalId: clientData.responsibleTechnicalId || client.responsibleTechnicalId,
        responsibleTechnicalName: clientData.responsibleTechnicalName || client.responsibleTechnicalName,
      },
      measurements: inspectionData.measurements || [],
      photos: inspectionData.photos || attachments.photos || [],
      measurementStats: inspectionData.measurementStats || {
        count: 0,
        minThicknessMm: 0,
        maxThicknessMm: 0,
        avgThicknessMm: 0,
        belowMinCount: 0,
        belowMinPercentage: 0,
      },
    },
    engineeringResults: {
      integrityAnalysis: engineeringResults.integrityAnalysis || {
        equipmentId: '',
        inspectionId: '',
        analyzedAt: now,
        analyzedBy: '',
        overallStatus: 'INDETERMINADO',
        overallCriticality: 'NOT_ASSESSED',
        recommendations: [],
        riskFactors: [],
        formulaVersions: {},
        normativeReferences: [],
      },
      calculations: engineeringResults.calculations || [],
      simulations: engineeringResults.simulations,
      normativeReferences: engineeringResults.normativeReferences || ['NR-13', 'ASME BPVC VIII-1'],
      formulaVersions: engineeringResults.formulaVersions || {},
    },
    technicalConclusion: {
      conclusion: technicalConclusion.conclusion || 'INDETERMINADO',
      justification: technicalConclusion.justification || 'Conclusão não disponível.',
      riskFactors: technicalConclusion.riskFactors || [],
      complianceStatement: technicalConclusion.complianceStatement || '',
      restrictions: technicalConclusion.restrictions,
    },
    recommendations: {
      immediate: recommendations.immediate || [],
      shortTerm: recommendations.shortTerm || [],
      mediumTerm: recommendations.mediumTerm || [],
      longTerm: recommendations.longTerm || [],
      inspection: recommendations.inspection || {
        nextInspectionDate: nextInspection.recommendedDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        intervalMonths: nextInspection.maxIntervalMonths || 12,
        type: nextInspection.type || 'PERIODIC',
        scope: nextInspection.scope || [],
        criteria: nextInspection.acceptanceCriteria || 'Conforme NR-13 e ASME BPVC VIII-1',
      },
    },
    nextInspection: {
      recommendedDate: nextInspection.recommendedDate ? new Date(nextInspection.recommendedDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      maxIntervalMonths: nextInspection.maxIntervalMonths || 12,
      type: nextInspection.type || 'PERIODIC',
      justification: nextInspection.justification || '',
      scope: nextInspection.scope || [],
      acceptanceCriteria: nextInspection.acceptanceCriteria || 'Conforme NR-13',
    },
    attachments: {
      photos: attachments.photos || inspectionData.photos || [],
      documents: attachments.documents?.length ? attachments.documents : clientDocuments.map((document: any) => ({
        id: document.id,
        name: document.originalName,
        type: document.type,
        url: document.url,
        description: document.mimeType,
        uploadedAt: document.createdAt,
        uploadedBy: document.uploadedById || '',
      })),
      calculations: attachments.calculations || [],
    },
    history: history.versions ? history : {
      versions: [],
      currentVersion: raw.version || 1,
      totalVersions: 1,
    },
    validations: raw.validations || [],
    signatures: {
      inspector: signatures.inspector,
      engineer: signatures.engineer,
      manager: signatures.manager,
      quality: signatures.quality,
      requiredRoles: signatures.requiredRoles || ['INSPECTOR', 'ENGINEER', 'MANAGER'],
      isComplete: signatures.isComplete || false,
      missingRoles: signatures.missingRoles || [],
    },
    metadata: {
      ...metadata,
      templateId: metadata.templateId || 'NR13_v2',
      templateVersion: metadata.templateVersion || '2.0',
      generatedBy: metadata.generatedBy || '',
      generatedAt: metadata.generatedAt ? new Date(metadata.generatedAt) : now,
      lastModifiedBy: metadata.lastModifiedBy || '',
      lastModifiedAt: metadata.lastModifiedAt ? new Date(metadata.lastModifiedAt) : now,
      placeholderMode: metadata.placeholderMode || false,
    },
  };
}
