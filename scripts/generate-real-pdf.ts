#!/usr/bin/env tsx
/**
 * Generate PDF from "Real" Data Based on Seed Structures
 * 
 * Creates a TechnicalReport that mirrors exactly what the seed-demo.ts produces
 * for inspection "insp-001" (V-101, Petrobras, APROVADA, 5 medições, 3 fotos)
 * and runs it through the production PDF builder.
 */

import { writeFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { buildNr13Pdf } from '../src/modules/report/templates/nr13/pdf/builder';
import { MOCK_COMPANY } from '../src/modules/report/templates/nr13/mock-data';
import type { TechnicalReport, MeasurementPoint, ReportPhoto } from '../src/modules/report/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const QA_DIR = join(PROJECT_ROOT, 'qa', 'pdf');

if (!existsSync(QA_DIR)) {
  mkdirSync(QA_DIR, { recursive: true });
}

// ============================================================
// DADOS REAIS BASEADOS NO SEED-DEMO.TS
// Inspeção: insp-001 | Equipamento: V-101 | Cliente: Petrobras | Status: APROVADA
// ============================================================

const NOW = new Date('2026-08-14');
const INSPECTION_DATE = new Date('2024-01-15');
const COMPLETED_DATE = new Date('2024-01-15');
const APPROVED_DATE = new Date('2024-01-20');

// Medições reais do seed para insp-001
const REAL_MEASUREMENTS: MeasurementPoint[] = [
  { id: 'm-real-001', inspectionId: 'insp-001', point: 'P1', thicknessMm: 11.80, angleDeg: 0, notes: 'Casco - região superior', createdAt: INSPECTION_DATE, updatedAt: INSPECTION_DATE },
  { id: 'm-real-002', inspectionId: 'insp-001', point: 'P2', thicknessMm: 12.10, angleDeg: 45, notes: 'Casco - região média', createdAt: INSPECTION_DATE, updatedAt: INSPECTION_DATE },
  { id: 'm-real-003', inspectionId: 'insp-001', point: 'P3', thicknessMm: 11.50, angleDeg: 90, notes: 'Casco - região inferior', createdAt: INSPECTION_DATE, updatedAt: INSPECTION_DATE },
  { id: 'm-real-004', inspectionId: 'insp-001', point: 'P4', thicknessMm: 10.80, angleDeg: 0, notes: 'Tampo superior', createdAt: INSPECTION_DATE, updatedAt: INSPECTION_DATE },
  { id: 'm-real-005', inspectionId: 'insp-001', point: 'P5', thicknessMm: 10.50, angleDeg: 0, notes: 'Tampo inferior', createdAt: INSPECTION_DATE, updatedAt: INSPECTION_DATE },
];

// Fotos reais do seed para insp-001
const REAL_PHOTOS: ReportPhoto[] = [
  { id: 'p-real-001', category: 'VISTA_GERAL', url: 'https://images.unsplash.com/photo-1581092921461-9f0e8b2b1b5e?w=800', caption: 'Visão geral do vaso V-101', order: 0, takenAt: INSPECTION_DATE, takenBy: 'inspetor1' },
  { id: 'p-real-002', category: 'PLACA', url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800', caption: 'Placa de identificação', order: 1, takenAt: INSPECTION_DATE, takenBy: 'inspetor1' },
  { id: 'p-real-003', category: 'ULTRASSOM', url: 'https://images.unsplash.com/photo-1581092195165-2144b8b5e6f0?w=800', caption: 'Pontos de medição ultrassom', order: 2, takenAt: INSPECTION_DATE, takenBy: 'inspetor1' },
];

// Stats calculados
const minThickness = Math.min(...REAL_MEASUREMENTS.map(m => m.thicknessMm));
const maxThickness = Math.max(...REAL_MEASUREMENTS.map(m => m.thicknessMm));
const avgThickness = REAL_MEASUREMENTS.reduce((s, m) => s + m.thicknessMm, 0) / REAL_MEASUREMENTS.length;
const belowMinCount = REAL_MEASUREMENTS.filter(m => m.thicknessMm < 5.5).length;

// ============================================================
// CONSTRUIR TECHNICALREPORT REALISTA
// ============================================================

const realReport: TechnicalReport = {
  id: 'rpt-real-insp-001',
  identification: {
    reportNumber: 'LT-2024-00101',
    version: 1,
    type: 'NR13',
    status: 'APPROVED',
    createdAt: INSPECTION_DATE,
    updatedAt: APPROVED_DATE,
    inspectionDate: INSPECTION_DATE,
    issuedAt: APPROVED_DATE,
    expiresAt: new Date('2025-01-15'),
    artNumber: 'ART-2024-00101',
    inspectorId: 'inspetor1',
    inspectorName: 'João Inspetor',
    engineerId: 'usr-eng-001',
    engineerName: 'Eng. Roberto Almeida',
    managerId: 'gestor',
    managerName: 'Carlos Gestor',
  },
  client: {
    id: 'cli-001',
    name: 'Petrobras S.A.',
    cnpj: '33.000.167/0001-01',
    address: 'Av. República do Chile, 65 - Centro, Rio de Janeiro - RJ',
    city: 'Rio de Janeiro',
    state: 'RJ',
    contactName: 'Eng. Roberto Silva',
    contactEmail: 'roberto.silva@petrobras.com.br',
    contactPhone: '+55 21 3224-1234',
    responsibleTechnicalId: 'CREA-RJ 123456',
    responsibleTechnicalName: 'Eng. Roberto Silva',
  },
  equipment: {
    id: 'eq-001',
    tag: 'V-101',
    type: 'VASO_DE_PRESSAO',
    description: 'Vaso de pressão para separação de gás/óleo',
    manufacturer: 'Jaraguá Equipamentos',
    manufactureYear: 2019,
    serialNumber: 'JEQ-2019-0456',
    designCode: 'ASME SEC.VIII Div.1 / 2017',
    designPressureBar: 25.0,
    designTemperatureC: 120,
    operatingPressureBar: 20.0,
    operatingTemperatureC: 85,
    mawpBar: 25.0,
    hydroTestPressureBar: 37.5,
    originalThicknessMm: 12.0,
    minThicknessMm: 5.5,
    corrosionAllowanceMm: 3.0,
    jointEfficiency: 1.0,
    designCode: 'ASME SEC.VIII Div.1 / 2017',
    volumeLiters: 5000,
    headType: 'Semieliptico',
    headMaterial: 'SA-516 Gr.70',
    bodyMaterial: 'SA-516 Gr.70',
    headNominalThicknessMm: 10.0,
    fluidType: 'Gás Natural / Óleo',
    fluidClass: 'A',
    riskGroup: 2,
    nr13Category: 'II',
  },
  executiveSummary: {
    overview: 'Laudo técnico de inspeção NR-13 realizado no vaso de pressão V-101 (separação de gás/óleo) da Petrobras S.A. O equipamento foi submetido a inspeção visual externa, medições de espessura por ultrassom em 5 pontos do casco e tampas, e análise de integridade conforme ASME BPVC VIII-1 e NR-13. A menor espessura encontrada foi de 10.50 mm (Ponto P5 - tampo inferior), acima da espessura mínima admissível de 5.5 mm. O equipamento apresenta integridade compatível com a operação nas condições atuais, com margem de espessura adequada (91% acima do mínimo admissível).',
    keyFindings: [
      'Menor espessura: 10.50 mm no ponto P5 (tampo inferior)',
      'Espessura mínima admissível: 5.5 mm (margem de 91%)',
      'Todas as medições acima do mínimo admissível',
      'Taxa de corrosão estimada: 0.08 mm/ano',
      'Vida útil remanescente estimada: 62.5 anos',
      'PMTA calculada: 25.0 bar (atende pressão de operação de 20.0 bar)',
    ],
    overallStatus: 'INTEGRO',
    criticalityLevel: 'LOW',
    requiresImmediateAction: false,
  },
  inspectionData: {
    inspection: {
      id: 'insp-001',
      equipmentId: 'eq-001',
      inspectorId: 'inspetor1',
      status: 'APROVADA',
      startedAt: INSPECTION_DATE,
      completedAt: COMPLETED_DATE,
      approvedAt: APPROVED_DATE,
      type: 'PERIODICA',
      notes: 'Inspeção periódica anual conforme cronograma NR-13. Equipamento em operação normal.',
      recommendations: ['Manter cronograma de inspeção anual', 'Monitorar tampo inferior (P5) nas próximas inspeções'],
    },
    equipment: {
      id: 'eq-001',
      tag: 'V-101',
      type: 'VASO_DE_PRESSAO',
      description: 'Vaso de pressão para separação de gás/óleo',
      manufacturer: 'Jaraguá Equipamentos',
      manufactureYear: 2019,
      serialNumber: 'JEQ-2019-0456',
      designCode: 'ASME SEC.VIII Div.1 / 2017',
      designPressureBar: 25.0,
      designTemperatureC: 120,
      operatingPressureBar: 20.0,
      operatingTemperatureC: 85,
      mawpBar: 25.0,
      hydroTestPressureBar: 37.5,
      originalThicknessMm: 12.0,
      minThicknessMm: 5.5,
      corrosionAllowanceMm: 3.0,
      jointEfficiency: 1.0,
      headType: 'Semieliptico',
      headMaterial: 'SA-516 Gr.70',
      bodyMaterial: 'SA-516 Gr.70',
      headNominalThicknessMm: 10.0,
      volumeLiters: 5000,
      fluidType: 'Gás Natural / Óleo',
      fluidClass: 'A',
      riskGroup: 2,
      nr13Category: 'II',
    },
    client: {
      id: 'cli-001',
      name: 'Petrobras S.A.',
      cnpj: '33.000.167/0001-01',
      address: 'Av. República do Chile, 65 - Centro, Rio de Janeiro - RJ',
      city: 'Rio de Janeiro',
      state: 'RJ',
      contactName: 'Eng. Roberto Silva',
      contactEmail: 'roberto.silva@petrobras.com.br',
      contactPhone: '+55 21 3224-1234',
      responsibleTechnicalId: 'CREA-RJ 123456',
      responsibleTechnicalName: 'Eng. Roberto Silva',
    },
    measurements: REAL_MEASUREMENTS,
    photos: REAL_PHOTOS,
    measurementStats: {
      count: REAL_MEASUREMENTS.length,
      minThicknessMm: minThickness,
      maxThicknessMm: maxThickness,
      avgThicknessMm: avgThickness,
      belowMinCount,
      belowMinPercentage: (belowMinCount / REAL_MEASUREMENTS.length) * 100,
    },
  },
  engineeringResults: {
    integrityAnalysis: {
      equipmentId: 'eq-001',
      inspectionId: 'insp-001',
      analyzedAt: APPROVED_DATE,
      analyzedBy: 'usr-eng-001',
      overallStatus: 'INTEGRO',
      overallCriticality: 'LOW',
      recommendations: [
        'Manter inspeção periódica anual conforme NR-13',
        'Monitorar região do tampo inferior (P5) como ponto de referência',
      ],
      riskFactors: [],
      formulaVersions: { 'UG-27': 'ASME VIII-1 2017', 'CORROSION_RATE': 'API 570' },
      normativeReferences: ['ASME BPVC VIII-1', 'NR-13', 'API 570'],
    },
    calculations: [
      {
        id: 'calc-tmin-001',
        label: 'Espessura Mínima Admissível',
        value: '5.50',
        unit: 'mm',
        status: 'SUCCESS',
        criticality: 'LOW',
        reliability: 'HIGH',
        explanation: 'Calculada conforme ASME BPVC VIII-1 UG-27 para pressão interna.',
        normativeReference: 'ASME BPVC VIII-1 UG-27',
        observations: [],
        rawValue: 5.5,
        metadata: {
          calculationId: 'calc-tmin-001',
          calculatedAt: APPROVED_DATE,
          calculatedBy: 'usr-eng-001',
          formulaVersion: '1.0.0',
          normativeVersion: 'ASME 2017',
          inputs: { P: 25.0, R: 500, S: 138, E: 1.0 },
          warnings: [],
        },
      },
      {
        id: 'calc-mawp-001',
        label: 'PMTA (Pressão Máx. Trabalho Admissível)',
        value: '25.00',
        unit: 'bar',
        status: 'SUCCESS',
        criticality: 'LOW',
        reliability: 'HIGH',
        explanation: 'Calculada para a menor espessura encontrada (10.50 mm).',
        normativeReference: 'ASME BPVC VIII-1 UG-27',
        observations: [],
        rawValue: 25.0,
        metadata: {
          calculationId: 'calc-mawp-001',
          calculatedAt: APPROVED_DATE,
          calculatedBy: 'usr-eng-001',
          formulaVersion: '1.0.0',
          normativeVersion: 'ASME 2017',
          inputs: { t: 10.50, R: 500, S: 138, E: 1.0 },
          warnings: [],
        },
      },
    ],
    simulations: [],
    formulaVersions: { 'UG-27': 'ASME VIII-1 2017' },
    normativeReferences: ['ASME BPVC VIII-1', 'NR-13', 'API 570'],
  },
  technicalConclusion: {
    conclusion: 'INTEGRO',
    justification: 'O equipamento V-101 apresenta integridade compatível com a operação nas condições atuais. Todas as medições de espessura estão acima do mínimo admissível (5.5 mm), com a menor espessura encontrada em 10.50 mm (Ponto P5 - tampo inferior), representando uma margem de 91% acima do mínimo. A taxa de corrosão estimada é baixa (0.08 mm/ano) e a vida útil remanescente é superior a 60 anos. Não foram identificados fatores de risco que comprometam a operação segura.',
    riskFactors: [],
    complianceStatement: 'Este laudo técnico foi elaborado em conformidade com a NR-13 (Norma Regulamentadora nº 13 - Equipamentos de Pressão), ASME Boiler and Pressure Vessel Code Section VIII Division 1 (edição 2017), e normas aplicáveis da API (570).',
    restrictions: undefined,
  },
  recommendations: {
    immediate: [],
    shortTerm: [
      {
        id: 'rec-st-001',
        description: 'Manter cronograma de inspeção periódica anual conforme NR-13 item 13.7.2',
        priority: 'MEDIUM',
        category: 'INSPECT',
        referencedStandard: 'NR-13 §13.7.2',
      },
      {
        id: 'rec-st-002',
        description: 'Monitorar região do tampo inferior (Ponto P5) nas próximas inspeções como ponto de referência de menor espessura',
        priority: 'LOW',
        category: 'MONITOR',
        referencedStandard: 'API 570 §6.5',
      },
    ],
    mediumTerm: [
      {
        id: 'rec-mt-001',
        description: 'Realizar teste hidrostático periódico a cada 5 anos conforme ASME BPVC VIII-1',
        priority: 'MEDIUM',
        category: 'INSPECT',
        referencedStandard: 'ASME BPVC VIII-1',
        dueDate: new Date('2029-01-15'),
      },
    ],
    longTerm: [
      {
        id: 'rec-lt-001',
        description: 'Planejar substituição do equipamento ao final da vida útil projetada (2079)',
        priority: 'LOW',
        category: 'REPLACE',
      },
    ],
    inspection: {
      nextInspectionDate: new Date('2025-01-15'),
      intervalMonths: 12,
      type: 'PERIODIC',
      scope: ['Inspeção visual externa', 'Medições de espessura por ultrassom (mínimo 5 pontos)', 'Verificação de válvulas e dispositivos de segurança'],
      criteria: 'Conforme NR-13 e ASME BPVC VIII-1. Aceitar espessura mínima ≥ 5.5 mm.',
    },
  },
  nextInspection: {
    recommendedDate: new Date('2025-01-15'),
    maxIntervalMonths: 12,
    type: 'PERIODIC',
    justification: 'Intervalo padrão NR-13 para vasos de pressão categoria II em condições normais de operação. Baseado em 5 medições com margem ampla (91%) acima do mínimo admissível.',
    scope: ['Inspeção visual externa', 'Medições de espessura por ultrassom', 'Verificação de dispositivos de segurança', 'Análise de integridade'],
    acceptanceCriteria: 'Conforme NR-13 e ASME BPVC VIII-1',
  },
  attachments: {
    photos: REAL_PHOTOS,
    documents: [],
    calculations: [],
  },
  history: {
    versions: [
      {
        version: 1,
        date: INSPECTION_DATE,
        authorId: 'inspetor1',
        authorName: 'João Inspetor',
        authorRole: 'INSPECTOR',
        changes: 'Criação do laudo técnico',
        status: 'DRAFT',
        action: 'CREATED',
      },
      {
        version: 1,
        date: APPROVED_DATE,
        authorId: 'gestor',
        authorName: 'Carlos Gestor',
        authorRole: 'MANAGER',
        changes: 'Aprovação do laudo técnico',
        status: 'APPROVED',
        action: 'APPROVED',
      },
    ],
    currentVersion: 1,
    totalVersions: 1,
  },
  validations: [],
  signatures: {
    inspector: {
      id: 'sig-real-001',
      role: 'INSPECTOR',
      userId: 'inspetor1',
      userName: 'João Inspetor',
      userRegistration: 'CREA-RJ 123456',
      signedAt: INSPECTION_DATE,
      status: 'APPROVED',
    },
    engineer: {
      id: 'sig-real-002',
      role: 'ENGINEER',
      userId: 'usr-eng-001',
      userName: 'Eng. Roberto Almeida',
      userRegistration: 'CREA-RJ 789012',
      signedAt: APPROVED_DATE,
      status: 'APPROVED',
    },
    manager: {
      id: 'sig-real-003',
      role: 'MANAGER',
      userId: 'gestor',
      userName: 'Carlos Gestor',
      userRegistration: 'CREA-RJ 345678',
      signedAt: APPROVED_DATE,
      status: 'APPROVED',
    },
    requiredRoles: ['INSPECTOR', 'ENGINEER', 'MANAGER'],
    isComplete: true,
    missingRoles: [],
  },
  metadata: {
    templateId: 'NR13_v2',
    templateVersion: '2.0',
    generatedAt: NOW,
    generatedBy: 'usr-eng-001',
    lastModifiedBy: 'usr-eng-001',
    lastModifiedAt: NOW,
    placeholderMode: false,
  },
};

// ============================================================
// GERAR PDF
// ============================================================

async function generateRealPdf() {
  console.log('='.repeat(60));
  console.log('GERANDO PDF COM DADOS REAIS (baseado no seed insp-001)');
  console.log('='.repeat(60));
  console.log('\n📋 Dados da Inspeção Real:');
  console.log('   Inspection ID: insp-001');
  console.log('   Equipment: V-101 (VASO_DE_PRESSAO)');
  console.log('   Client: Petrobras S.A.');
  console.log('   Status: APROVADA');
  console.log('   Measurements: 5');
  console.log('   Photos: 3');
  console.log('   Conclusion: INTEGRO');
  console.log('   Signatures: 3 (Inspector, Engineer, Manager)');
  console.log('   ART: ART-2024-00101\n');

  const startTime = Date.now();
  
  try {
    const pdfBytes = await buildNr13Pdf(realReport, MOCK_COMPANY);
    
    const fileName = 'laudo-real.pdf';
    const filePath = join(QA_DIR, fileName);
    writeFileSync(filePath, Buffer.from(pdfBytes));
    
    const stats = statSync(filePath);
    const fileSizeKB = (stats.size / 1024).toFixed(1);
    
    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPages().length;
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`\n✅ ${fileName} gerado com sucesso!`);
    console.log(`   Páginas: ${pageCount}`);
    console.log(`   Tamanho: ${fileSizeKB} KB`);
    console.log(`   Tempo: ${elapsed}s`);
    console.log(`   Caminho: ${filePath}\n`);
    
    console.log('--- PRÓXIMOS PASSOS ---');
    console.log('1. Abrir o PDF:');
    console.log(`   start qa\\pdf\\${fileName}`);
    console.log('');
    console.log('2. Ou renderizar para PNG (se tiver poppler):');
    console.log(`   pdftoppm -png qa/pdf/${fileName} qa/pdf/page-real`);
    
    return { filePath, pageCount, fileSizeKB };
    
  } catch (error: any) {
    console.error(`\n❌ ERRO: ${error.message}`);
    console.error(error.stack);
    throw error;
  }
}

generateRealPdf().catch(console.error);