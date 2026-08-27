import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildNr13Pdf } from '@/modules/report/templates/nr13/pdf/builder';
import { MOCK_COMPANY } from '@/modules/report/templates/nr13/mock-data';
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
                client: true,
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

    // Debug: scan all text fields for non-ASCII characters
    const scanObj = (obj: any, path = ''): string[] => {
      const issues: string[] = [];
      if (typeof obj === 'string') {
        for (const ch of obj) {
          const code = ch.charCodeAt(0);
          if (code > 127 && code < 0x2000) { // Latin extended + misc symbols
            issues.push(`${path}: U+${code.toString(16).toUpperCase()} '${ch}'`);
          }
        }
      } else if (Array.isArray(obj)) {
        obj.forEach((item, i) => issues.push(...scanObj(item, `${path}[${i}]`)));
      } else if (obj && typeof obj === 'object') {
        for (const [k, v] of Object.entries(obj)) {
          issues.push(...scanObj(v, `${path}.${k}`));
        }
      }
      return issues;
    };
    const nonAsciiIssues = scanObj(report);
    if (nonAsciiIssues.length > 0) {
      console.warn('Non-ASCII chars in report data:', nonAsciiIssues.slice(0, 20));
    }

    // Build PDF using the modular template
    const pdfBytes = await buildNr13Pdf(report, MOCK_COMPANY);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="laudo-${report.identification.reportNumber}.pdf"`,
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
        recommendations: inspect.recommendations,
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
      documents: attachments.documents || [],
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
