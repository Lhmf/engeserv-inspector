/**
 * Lote 23A — Fixture compartilhado: laudo do cenário REAL do Lote 21B
 *
 * Espelha o laudo efetivamente produzido pela execução integrada do
 * Lote 21B (equipamento QA-VP-21B-API, 8 medições, formulaVersions do
 * engine com minimumThickness/mawp placeholder) e a variante hipotética
 * de fórmulas validadas. Usado pelos testes de barreira e pelo gerador
 * de evidências em PDF.
 */

const measurement = (point: string, thicknessMm: number) => ({
  id: `meas-${point}`,
  inspectionId: 'insp-qa-21b',
  point,
  thicknessMm,
  angleDeg: 0,
  notes: '',
  createdAt: new Date('2026-10-21T12:00:00Z'),
  updatedAt: new Date('2026-10-21T12:00:00Z'),
});

const measurements = [
  measurement('P1', 8.42),
  measurement('P2', 8.38),
  measurement('P3', 8.51),
  measurement('P4', 7.89),
  measurement('P5', 8.45),
  measurement('P6', 8.32),
  measurement('P7', 8.55),
  measurement('P8', 7.95),
];

const equipment = {
  id: 'eq-QA-VP-21B-API',
  tag: 'QA-VP-21B-API',
  type: 'VASO_DE_PRESSAO',
  description: 'Vaso de pressão do teste integrado Lote 21B',
  designPressureBar: 18,
  designTemperatureC: 120,
  operatingPressureBar: 12.5,
  operatingTemperatureC: 80,
  mawpBar: 17.2,
  hydroTestPressureBar: 24,
  originalThicknessMm: 9.5,
  // Esp. mínima CADASTRADA diverge da calculada (5.20) no cenário real
  minThicknessMm: 6.3,
  corrosionAllowanceMm: 2,
  bodyMaterial: 'SA-516 Gr.70',
  designCode: 'ASME SEC.VIII DIV.1/2021',
};

export function makeLote21bReportFixture(options: { validated: boolean }): any {
  const v = options.validated;
  const placeholderVersion = v ? '1.0.0-validada' : '1.0.0-placeholder';
  const calcStatus = v ? 'SUCCESS' : 'WARNING';
  const reliability = v ? 'HIGH' : 'THEORETICAL';

  const formulaVersions = {
    minimumThickness: placeholderVersion,
    corrosionRate: '1.0.0',
    remainingLife: '1.0.0',
    mawp: placeholderVersion,
  };

  return {
    id: 'rpt-qa-23a',
    identification: {
      reportNumber: 'LT-2026-kxkda',
      version: 1,
      type: 'NR13',
      status: 'DRAFT',
      createdAt: new Date('2026-10-21T12:00:00Z'),
      updatedAt: new Date('2026-10-21T12:00:00Z'),
      inspectionDate: new Date('2026-10-21T12:00:00Z'),
      inspectorId: 'insp-qa',
      inspectorName: 'Inspetor QA Lote 21B',
    },
    client: {
      id: 'client-qa',
      name: 'Aurora Engenharia QA Lote 21B',
      cnpj: '11.222.333/0001-44',
      address: 'Rua Real do Cliente, 100',
      city: 'Cidade Real',
      state: 'SP',
    },
    equipment,
    executiveSummary: {
      overview: 'Laudo técnico NR-13 realizado com cálculos do Engineering Engine.',
      keyFindings: ['Pontos abaixo da espessura mínima'],
      overallStatus: 'REQUER_REPARO',
      criticalityLevel: 'CRITICAL',
      requiresImmediateAction: true,
    },
    inspectionData: {
      inspection: {
        id: 'insp-qa-21b',
        equipmentId: 'eq-QA-VP-21B-API',
        inspectorId: 'insp-qa',
        status: 'APROVADA',
        startedAt: new Date('2026-10-21T12:00:00Z'),
        completedAt: new Date('2026-10-21T13:00:00Z'),
        approvedAt: new Date('2026-10-21T13:00:00Z'),
        type: 'PERIODICA',
        notes: null,
        recommendations: [],
      },
      equipment,
      client: {
        id: 'client-qa',
        name: 'Aurora Engenharia QA Lote 21B',
        cnpj: '11.222.333/0001-44',
        address: 'Rua Real do Cliente, 100',
        city: 'Cidade Real',
        state: 'SP',
      },
      measurements,
      photos: [],
      measurementStats: {
        count: 8,
        minThicknessMm: 7.89,
        maxThicknessMm: 8.55,
        avgThicknessMm: 8.31,
        belowMinCount: 0,
        belowMinPercentage: 0,
      },
    },
    engineeringResults: {
      integrityAnalysis: {
        equipmentId: 'eq-QA-VP-21B-API',
        inspectionId: 'insp-qa-21b',
        analyzedAt: new Date('2026-10-21T13:30:00Z'),
        analyzedBy: 'system',
        minimumThickness: {
          value: 5.2,
          unit: 'mm',
          status: calcStatus,
          criticality: v ? 'LOW' : 'CRITICAL',
          explanation: v
            ? 'Espessura mínima calculada conforme ASME VIII-1 validada.'
            : 'Espessura mínima calculada usando fórmula ASME VIII-1 (placeholder). VALOR NÃO VALIDADO - CONFIRMAR COM ENGENHEIRO.',
          normativeReference: 'ASME BPVC VIII-1 / NR-13',
          reliability,
          observations: v ? [] : ['Fórmula em implementação placeholder'],
          metadata: {
            calculationId: 'tmin-1',
            calculatedAt: new Date('2026-10-21T13:30:00Z'),
            calculatedBy: 'system',
            formulaVersion: placeholderVersion,
            normativeVersion: 'ASME 2021',
            inputs: {},
            warnings: [],
          },
        },
        corrosionRate: {
          value: 0.308,
          unit: 'mm/ano',
          status: 'SUCCESS',
          criticality: 'LOW',
          explanation: 'Taxa de corrosão real entre inspeções.',
          normativeReference: 'API 570',
          reliability: 'HIGH',
          observations: [],
          metadata: {
            calculationId: 'cr-1',
            calculatedAt: new Date('2026-10-21T13:30:00Z'),
            calculatedBy: 'system',
            formulaVersion: '1.0.0',
            normativeVersion: 'API 570 2016',
            inputs: {},
            warnings: [],
          },
        },
        remainingLife: {
          value: 4.2,
          unit: 'anos',
          status: 'SUCCESS',
          criticality: 'MEDIUM',
          explanation: 'Vida útil remanescente estimada.',
          normativeReference: 'API 570',
          reliability: 'HIGH',
          observations: [],
          metadata: {
            calculationId: 'rl-1',
            calculatedAt: new Date('2026-10-21T13:30:00Z'),
            calculatedBy: 'system',
            formulaVersion: '1.0.0',
            normativeVersion: 'API 570 2016',
            inputs: {},
            warnings: [],
          },
        },
        mawp: {
          value: 19.76,
          unit: 'bar',
          status: calcStatus,
          criticality: v ? 'LOW' : 'CRITICAL',
          explanation: v ? 'PMTA calculada validada.' : 'PMTA calculada (placeholder). NÃO VALIDADO.',
          normativeReference: 'ASME BPVC VIII-1',
          reliability,
          observations: v ? [] : ['Fórmula em implementação placeholder'],
          metadata: {
            calculationId: 'mawp-1',
            calculatedAt: new Date('2026-10-21T13:30:00Z'),
            calculatedBy: 'system',
            formulaVersion: placeholderVersion,
            normativeVersion: 'ASME 2021',
            inputs: {},
            warnings: [],
          },
        },
        overallStatus: 'REQUER_REPARO',
        overallCriticality: 'CRITICAL',
        recommendations: ['Ponto P4 requer reparo'],
        riskFactors: [],
        formulaVersions,
        normativeReferences: ['NR-13', 'ASME BPVC VIII-1'],
        nextInspectionDate: {
          value: new Date('2027-10-21T13:30:00Z'),
          unit: 'date',
          status: 'SUCCESS',
          criticality: 'LOW',
          explanation: '',
          normativeReference: '',
          reliability: 'HIGH',
          observations: [],
          metadata: {
            calculationId: 'ni-1',
            calculatedAt: new Date('2026-10-21T13:30:00Z'),
            calculatedBy: 'system',
            formulaVersion: '1.0.0',
            normativeVersion: 'NR-13 2023',
            inputs: {},
            warnings: [],
          },
        },
      },
      calculations: [],
      simulations: [],
      normativeReferences: ['NR-13', 'ASME BPVC VIII-1'],
      formulaVersions,
    },
    technicalConclusion: {
      // Alegação de conformidade como a versão anterior do laudo gravava
      // no banco (Lote 21B) — a sanitização deve removê-la no cenário com
      // fórmulas placeholder.
      conclusion: 'REQUER_REPARO',
      justification:
        'Análise técnica baseada em medições ultrassônicas e cálculos conforme ASME BPVC VIII-1 e NR-13.',
      riskFactors: [],
      complianceStatement: 'Laudo elaborado conforme NR-13, ASME BPVC VIII-1, API 570/510.',
      restrictions: ['Operação com restrições até reparo'],
    },
    recommendations: {
      immediate: [{ id: 'imm-0', description: 'Reparar ponto P4', priority: 'CRITICAL', category: 'REPAIR' }],
      shortTerm: [],
      mediumTerm: [],
      longTerm: [],
      inspection: {
        nextInspectionDate: new Date('2027-10-21T13:30:00Z'),
        intervalMonths: 12,
        type: 'PERIODIC',
        scope: ['Inspeção visual'],
        criteria: v ? 'Critérios por definição do engenheiro responsável' : 'Conforme NR-13 e normas aplicáveis',
      },
    },
    nextInspection: {
      recommendedDate: new Date('2027-10-21T13:30:00Z'),
      maxIntervalMonths: 12,
      type: 'PERIODIC',
      justification: 'Intervalo padrão NR-13 para vasos de pressão',
      scope: ['Inspeção visual'],
      acceptanceCriteria: v ? 'Critérios por definição do engenheiro responsável' : 'Conforme NR-13',
    },
    attachments: { photos: [], documents: [], calculations: [] },
    history: { versions: [], currentVersion: 1, totalVersions: 1 },
    validations: [],
    signatures: {
      requiredRoles: ['INSPECTOR', 'ENGINEER', 'MANAGER'],
      isComplete: false,
      missingRoles: ['INSPECTOR', 'ENGINEER', 'MANAGER'],
    },
    metadata: {
      templateId: 'NR13_v2',
      templateVersion: '2.0',
      generatedBy: 'system',
      generatedAt: new Date('2026-10-21T13:30:00Z'),
      lastModifiedBy: 'system',
      lastModifiedAt: new Date('2026-10-21T13:30:00Z'),
      placeholderMode: !v,
      regionalAdoptionApproved: v,
      technicalValidation: v ? {
        status: 'APPROVED',
        approvedAt: '2026-10-21T14:00:00Z',
        approvedById: 'rt-qa',
        approvedByName: 'Responsável Técnico QA',
      } : undefined,
    },
  };
}
