#!/usr/bin/env tsx
/**
 * QA PDF Generation Script
 * 
 * Gera 4 PDFs de teste usando o builder de produção (buildNr13Pdf).
 * Cenários: Pequeno, Médio, Grande, Extremo.
 */

import { writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { buildNr13Pdf } from '../src/modules/report/templates/nr13/pdf/builder';
import { MOCK_COMPANY, MOCK_REPORT, createMockTechnicalReport } from '../src/modules/report/templates/nr13/mock-data';
import type { TechnicalReport, MeasurementPoint, ReportPhoto } from '../src/modules/report/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const QA_DIR = join(PROJECT_ROOT, 'qa', 'pdf');

if (!existsSync(QA_DIR)) {
  mkdirSync(QA_DIR, { recursive: true });
}

// ============================================================
// FIXTURES DE TESTE QA
// ============================================================

const BASE_INSPECTION_DATE = new Date('2026-08-14');
const BASE_NOW = new Date('2026-08-14');

const LONG_CLIENT_NAME = 'Indústria Petroquímica Brasileira de Grande Porte S.A. - Unidade Operacional Cubatão';
const LONG_DESCRIPTION = 'Vaso de pressão horizontal tipo trocador de calor casco e tubo, destinado ao serviço de condensação de vapores de processo na unidade de destilação atmosférica, fabricado em aço carbono SA-516 Gr.70 com tampas semielípticas, operando em regime contínuo com fluido classe D, categoria NR-13 II, grupo de risco 2, equipado com válvula de segurança, manômetro, indicador de nível e dispositivo de purga, devidamente aterrado e pintado conforme especificação do fabricante';

function generateMeasurements(count: number, minThickness: number = 6.5): MeasurementPoint[] {
  const measurements: MeasurementPoint[] = [];
  const baseThickness = 8.5;
  const spread = 1.2;
  
  for (let i = 0; i < count; i++) {
    const pointNum = i + 1;
    const angle = (i * 360) / count;
    let thickness = baseThickness - Math.random() * spread;
    
    if (i % 7 === 0) {
      thickness = minThickness + 0.1 + Math.random() * 0.3;
    }
    
    const notes = [
      `Ponto ${pointNum} - casco frontal`,
      `Quadrante ${Math.floor(angle / 90) + 1} - região inferior`,
      `Solda longitudinal próxima ao ponto ${pointNum}`,
      `Área de influência térmica - solda circunferencial`,
      `Região de apoio do equipamento`,
      `Próximo à flange de entrada`,
      `Próximo à flange de saída`,
      `Zona de transição casco-tampa`,
    ][i % 8];
    
    measurements.push({
      id: `m-qa-${pointNum.toString().padStart(4, '0')}`,
      inspectionId: 'insp-qa',
      point: `P${pointNum}`,
      thicknessMm: Number(thickness.toFixed(2)),
      angleDeg: angle,
      notes: `${notes} - observação detalhada para teste de quebra de linha no PDF com texto longo que pode ocupar múltiplas linhas`,
      createdAt: BASE_INSPECTION_DATE,
      updatedAt: BASE_INSPECTION_DATE,
    });
  }
  
  return measurements;
}

function generatePhotos(count: number): ReportPhoto[] {
  const categories = ['VISTA_GERAL', 'PLACA', 'CORROSAO', 'ULTRASSOM', 'SOLDA', 'VALVULA', 'MANOMETRO', 'TRINCA', 'REPARO'];
  const captions = [
    'Vista geral do equipamento em operação',
    'Placa de identificação do fabricante com dados de projeto',
    'Corrosão superficial na região inferior do casco',
    'Medição por ultrassom - ponto de menor espessura',
    'Solda longitudinal - inspeção visual e partículas magnéticas',
    'Válvula de segurança - teste de abertura verificado',
    'Manômetro - leitura comparada com padrão',
    'Trinca superficial detectada em inspeção visual',
    'Reparo executado em campanha anterior',
  ];
  
  const photos: ReportPhoto[] = [];
  for (let i = 0; i < count; i++) {
    photos.push({
      id: `p-qa-${(i + 1).toString().padStart(4, '0')}`,
      category: categories[i % categories.length],
      url: `/public/test-${(i % 4) + 1}.jpg`,
      caption: `${captions[i % captions.length]} - descrição longa para testar quebra de texto no card fotográfico do PDF`,
      order: i,
      takenAt: BASE_INSPECTION_DATE,
      takenBy: 'insp-qa',
    });
  }
  return photos;
}

function generateRecommendations(count: number) {
  const categories = ['REPAIR', 'REPLACE', 'MONITOR', 'INSPECT', 'DOCUMENT', 'OPERATIONAL'] as const;
  const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
  const standards = [
    'NR-13 §13.4', 'NR-13 Anexo C', 'ASME BPVC VIII-1 UG-27',
    'API 570 §6.4', 'API 510 §6.5', 'ABNT NBR 14892',
  ];
  
  const recs: any[] = [];
  for (let i = 0; i < count; i++) {
    recs.push({
      id: `rec-qa-${(i + 1).toString().padStart(4, '0')}`,
      description: `Recomendação QA ${i + 1}: realizar inspeção detalhada com medições complementares na região identificada, incluindo verificação de integridade dos dispositivos de segurança e análise de conformidade com as normas aplicáveis - texto longo para testar quebra de linha no PDF`,
      priority: priorities[i % priorities.length],
      category: categories[i % categories.length],
      referencedStandard: standards[i % standards.length],
      dueDate: new Date(BASE_NOW.getTime() + (i + 1) * 30 * 24 * 60 * 60 * 1000),
      responsibleRole: ['INSPECTOR', 'ENGINEER', 'MANAGER'][i % 3],
    });
  }
  return recs;
}

function createQAReport(config: {
  name: string;
  measurementsCount: number;
  photosCount: number;
  status: 'DRAFT' | 'APPROVED' | 'PUBLISHED';
  conclusion: 'INTEGRO' | 'ACEITAVEL_COM_RESTRICOES' | 'REQUER_REPARO' | 'CONDENADO';
}): TechnicalReport {
  const baseReport = createMockTechnicalReport();
  const measurements = generateMeasurements(config.measurementsCount);
  const photos = generatePhotos(config.photosCount);
  
  const belowMinCount = measurements.filter(m => m.thicknessMm < 6.5).length;
  const avgThickness = measurements.reduce((sum, m) => sum + m.thicknessMm, 0) / measurements.length;
  const minThickness = Math.min(...measurements.map(m => m.thicknessMm));
  const maxThickness = Math.max(...measurements.map(m => m.thicknessMm));
  
  const report: TechnicalReport = {
    ...baseReport,
    id: `rpt-qa-${config.name}`,
    identification: {
      ...baseReport.identification,
      reportNumber: `LT-QA-${config.name.toUpperCase()}-${BASE_NOW.getFullYear()}`,
      status: config.status,
      artNumber: `ART-QA-${config.name.toUpperCase()}-${BASE_NOW.getFullYear()}`,
    },
    client: {
      ...baseReport.client,
      name: LONG_CLIENT_NAME,
      address: 'Rodovia BR-101, Km 45, Distrito Industrial, Cubatão - SP, CEP 11560-000',
    },
    equipment: {
      ...baseReport.equipment,
      tag: `V-QA-${config.name.toUpperCase()}`,
      description: LONG_DESCRIPTION,
      serialNumber: `QA-${config.name.toUpperCase()}-2026-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      minThicknessMm: 6.5,
    },
    executiveSummary: {
      ...baseReport.executiveSummary,
      overallStatus: config.conclusion,
      overview: `Laudo técnico QA ${config.name} - ${config.measurementsCount} medições, ${config.photosCount} fotos. ${config.measurementsCount > 50 ? 'Grande volume de dados testando paginação automática.' : ''} ${config.conclusion === 'INTEGRO' ? 'Equipamento íntegro.' : config.conclusion === 'ACEITAVEL_COM_RESTRICOES' ? 'Equipamento aceitável com restrições de monitoramento.' : 'Equipamento requer reparo ou condenação.'}`,
      keyFindings: [
        `Total de medições: ${config.measurementsCount}`,
        `Menor espessura encontrada: ${minThickness.toFixed(2)} mm`,
        `Espessura média: ${avgThickness.toFixed(2)} mm`,
        `Medições abaixo do mínimo (6.5 mm): ${belowMinCount} (${((belowMinCount / config.measurementsCount) * 100).toFixed(1)}%)`,
        `Fotos anexadas: ${config.photosCount}`,
      ],
    },
    inspectionData: {
      ...baseReport.inspectionData,
      measurements,
      photos,
      measurementStats: {
        count: config.measurementsCount,
        minThicknessMm: minThickness,
        maxThicknessMm: maxThickness,
        avgThicknessMm: avgThickness,
        belowMinCount,
        belowMinPercentage: (belowMinCount / config.measurementsCount) * 100,
      },
    },
    engineeringResults: {
      ...baseReport.engineeringResults,
      calculations: [
        ...baseReport.engineeringResults.calculations,
        ...generateMeasurements(config.measurementsCount).slice(0, 3).map((m, i) => ({
          id: `calc-qa-${i}`,
          label: `Cálculo Adicional QA ${i + 1}`,
          value: m.thicknessMm.toFixed(2),
          unit: 'mm',
          status: 'SUCCESS' as const,
          criticality: 'LOW' as const,
          reliability: 'HIGH' as const,
          explanation: 'Cálculo de verificação para QA',
          normativeReference: 'ASME BPVC VIII-1',
          observations: [],
          rawValue: m.thicknessMm,
          metadata: {
            calculationId: `calc-qa-${i}`,
            calculatedAt: BASE_NOW,
            calculatedBy: 'qa-script',
            formulaVersion: '1.0.0',
            normativeVersion: 'ASME 2021',
            inputs: {},
            warnings: [],
          },
        })),
      ],
    },
    technicalConclusion: {
      ...baseReport.technicalConclusion,
      conclusion: config.conclusion,
      justification: `Justificativa técnica detalhada para o cenário ${config.name}. ${LONG_DESCRIPTION.substring(0, 200)}... O equipamento foi submetido a inspeção completa com ${config.measurementsCount} pontos de medição e ${config.photosCount} registros fotográficos. A análise de integridade considerou todos os requisitos da NR-13, ASME BPVC VIII-1 e API 570. ${config.conclusion === 'INTEGRO' ? 'Todos os critérios foram atendidos com margem adequada.' : 'Foram identificadas não conformidades que requerem atenção.'}`,
      restrictions: config.conclusion !== 'INTEGRO' ? [
        'Monitoramento reforçado nas regiões com espessura próxima ao mínimo',
        'Reinspeção antecipada em 6 meses',
        'Limpeza interna para melhor avaliação da superfície',
      ] : undefined,
    },
    recommendations: {
      ...baseReport.recommendations,
      immediate: generateRecommendations(Math.min(3, config.measurementsCount / 10)),
      shortTerm: generateRecommendations(Math.min(5, config.measurementsCount / 5)),
      mediumTerm: generateRecommendations(Math.min(4, config.measurementsCount / 8)),
      longTerm: generateRecommendations(Math.min(3, config.measurementsCount / 15)),
      inspection: {
        ...baseReport.recommendations.inspection,
        scope: [
          ...baseReport.recommendations.inspection.scope,
          'Medições complementares em pontos críticos',
          'Análise de tensões residuais nas soldas',
          'Verificação de corrosão sob isolamento',
        ],
      },
    },
    nextInspection: {
      ...baseReport.nextInspection,
      justification: `Intervalo definido conforme NR-13 para equipamento categoria II com ${config.conclusion === 'INTEGRO' ? 'condições normais' : 'restrições de monitoramento'}. Baseado em ${config.measurementsCount} medições e análise de vida útil remanescente.`,
      scope: [
        ...baseReport.nextInspection.scope,
        'Reavaliação de taxa de corrosão com dados históricos',
        'Inspeção interna com acesso a todas as superfícies',
      ],
    },
    attachments: {
      ...baseReport.attachments,
      photos,
    },
    signatures: {
      ...baseReport.signatures,
      inspector: {
        ...baseReport.signatures.inspector,
        userName: 'Inspetor QA Carlos Silva',
        userRegistration: 'CREA-SP 123456',
      },
      engineer: {
        ...baseReport.signatures.engineer,
        userName: 'Eng. QA Roberto Almeida',
        userRegistration: 'CREA-SP 789012',
      },
      manager: {
        ...baseReport.signatures.manager,
        userName: 'Eng. QA Maria Fernanda Costa',
        userRegistration: 'CREA-SP 345678',
      },
    },
  };
  
  return report;
}

// ============================================================
// EXECUÇÃO DOS TESTES
// ============================================================

const TEST_CONFIGS = [
  { name: 'a-pequeno', measurementsCount: 5, photosCount: 2, status: 'DRAFT' as const, conclusion: 'INTEGRO' as const },
  { name: 'b-medio', measurementsCount: 18, photosCount: 6, status: 'APPROVED' as const, conclusion: 'ACEITAVEL_COM_RESTRICOES' as const },
  { name: 'c-grande', measurementsCount: 50, photosCount: 15, status: 'PUBLISHED' as const, conclusion: 'REQUER_REPARO' as const },
  { name: 'd-extremo', measurementsCount: 100, photosCount: 30, status: 'PUBLISHED' as const, conclusion: 'CONDENADO' as const },
];

async function runTests() {
  console.log('='.repeat(60));
  console.log('QA PDF GENERATION - EngeServ Inspector NR-13');
  console.log('='.repeat(60));
  console.log(`Output directory: ${QA_DIR}`);
  console.log('');

  const results: any[] = [];

  for (const config of TEST_CONFIGS) {
    console.log(`\n▶ Gerando ${config.name}...`);
    console.log(`   Medições: ${config.measurementsCount} | Fotos: ${config.photosCount} | Status: ${config.status} | Conclusão: ${config.conclusion}`);
    
    const startTime = Date.now();
    
    try {
      const report = createQAReport(config);
      const pdfBytes = await buildNr13Pdf(report, MOCK_COMPANY);
      
      const fileName = `teste-${config.name}.pdf`;
      const filePath = join(QA_DIR, fileName);
      writeFileSync(filePath, Buffer.from(pdfBytes));
      
      const stats = statSync(filePath);
      const fileSizeKB = (stats.size / 1024).toFixed(1);
      
      // Contar páginas usando pdf-lib
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pageCount = pdfDoc.getPages().length;
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      
      console.log(`   ✓ ${fileName} - ${pageCount} páginas - ${fileSizeKB} KB - ${elapsed}s`);
      
      results.push({
        name: config.name,
        measurements: config.measurementsCount,
        photos: config.photosCount,
        pages: pageCount,
        fileSizeKB,
        filePath,
        elapsed,
      });
      
    } catch (error: any) {
      console.error(`   ✗ ERRO: ${error.message}`);
      results.push({
        name: config.name,
        error: error.message,
      });
    }
  }

  // ============================================================
  // RELATÓRIO FINAL
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('RESULTADO QA');
  console.log('='.repeat(60));
  
  console.log('\n| Cenário | Medições | Fotos | Páginas | Tamanho | Tempo |');
  console.log('|---|---:|---:|---:|---:|---:|');
  
  for (const r of results) {
    if (r.error) {
      console.log(`| ${r.name} | ${r.measurements || '-'} | ${r.photos || '-'} | ERRO | - | - |`);
    } else {
      console.log(`| ${r.name} | ${r.measurements} | ${r.photos} | ${r.pages} | ${r.fileSizeKB} KB | ${r.elapsed}s |`);
    }
  }

  console.log('\n--- ARQUIVOS GERADOS ---');
  for (const r of results) {
    if (!r.error) {
      console.log(`${r.filePath}`);
    }
  }

  console.log('\n--- PRÓXIMOS PASSOS PARA VALIDAÇÃO VISUAL ---');
  console.log('1. Renderizar PDFs para PNG:');
  console.log('   pdftoppm -png qa/pdf/teste-a-pequeno.pdf qa/pdf/page-a');
  console.log('   pdftoppm -png qa/pdf/teste-b-medio.pdf qa/pdf/page-b');
  console.log('   pdftoppm -png qa/pdf/teste-c-grande.pdf qa/pdf/page-c');
  console.log('   pdftoppm -png qa/pdf/teste-d-extremo.pdf qa/pdf/page-d');
  console.log('');
  console.log('2. Ou abrir os PDFs diretamente no navegador/visualizador');
  console.log('3. Verificar checklist visual (ver instruções)');

  return results;
}

runTests().catch(console.error);