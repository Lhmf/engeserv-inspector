/**
 * LOTE 23A — Testes de Segurança Técnica do Laudo (PDF)
 *
 * Reproduz os defeitos do relatório de QA do Lote 21B:
 *   - T13b: PDF mapeia taxa de corrosão, vida útil e PMTA somente quando
 *     são resultados válidos e aprovados (senão exibe "N/D", nunca
 *     números inventados).
 *   - T13c: PDF identifica fórmulas placeholder e NÃO afirma
 *     conformidade NR-13/ASME/API nem apresenta conclusões definitivas.
 *   - T13d: PDF usas dados institucionais reais; MOCK_COMPANY
 *     (CNPJ/endereço/telefone fictícios) eliminado do caminho de produção.
 *   - T11: pipeline sem fallback V-101 (cálculo apenas com dados reais)
 *     e barreira bloqueando emissão definitiva com fórmulas placeholder.
 *
 * Testes 100% independentes de banco e de processo Next.js.
 * Runner: node:test via tsx.
 *
 * Comando:
 *   npx tsx --test tests/qa/pdf-emission-barrier.test.ts
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFParse } from 'pdf-parse';

import { buildNr13Pdf } from '../../src/modules/report/templates/nr13/pdf/builder';
import {
  EmissionBarrierError,
  assessTechnicalReportEmission,
  sanitizeForEmission,
  extractEmissionIndicators,
  DEMO_BANNER_TEXT,
  DEMO_NO_CLAIM_TEXT,
  PLACEHOLDER_WARNING_TEXT,
} from '../../src/modules/report/safety/emission';
import {
  resolveCompanyInfoFromEnv,
  isDefinitiveCompanyInfo,
  DEMO_COMPANY_INFO,
} from '../../src/modules/report/company-info';
import type { CompanyInfo } from '../../src/modules/report/templates/nr13/types';

// ============================================================
// HELPERS
// ============================================================

/** Normaliza texto de PDF: minúsculas e sem acentos (extração estável). */
function norm(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

async function pdfText(bytes: Uint8Array): Promise<string> {
  // pdf-parse consome/desanexa o buffer passado — parse em cópia.
  const parser = new PDFParse({ data: bytes.slice() });
  const result = await parser.getText();
  return norm(result.text || '');
}

const REAL_COMPANY: CompanyInfo = {
  name: 'EngeServ Engenharia e Inspeções SA',
  tagline: 'Inspeção Técnica de Equipamentos',
  cnpj: '00.111.222/0001-33',
  address: 'Rodovia Real, km 5 - Cidade Real/SP',
  phone: '(11) 9999-0001',
  email: 'inspecoes@engeservreal.com.br',
};

const MOCK_COMPANY_CNPJ = '12.345.678/0001-90';

// ============================================================
// FIXTURES — espelham a execução integrada REAL do Lote 21B
// (equipamento QA-VP-21B-API, 8 medições, formulaVersions do engine)
// ============================================================

import { makeLote21bReportFixture } from './fixtures/lote21b-report';

const makeReportFixture = makeLote21bReportFixture;


const placeholderReport = makeReportFixture({ validated: false });
const validatedReport = makeReportFixture({ validated: true });

// ============================================================
// T13c — BARREIRA: fórmula placeholder impede laudo definitivo
// ============================================================

describe('Lote 23A / T13c — barreira de fórmulas placeholder', () => {
  it('avalia o laudo do cenário real 21B como NÃO emitível de forma definitiva', () => {
    const assessment = assessTechnicalReportEmission(placeholderReport);
    assert.equal(assessment.canEmitDefinitive, false);
    assert.equal(assessment.hasEngineeringResults, true);
    assert.ok(assessment.placeholderFormulas.includes('minimumThickness'));
    assert.ok(assessment.placeholderFormulas.includes('mawp'));
    assert.ok(assessment.reasons.length > 0);
  });

  it('buildNr13Pdf em modo DEFINITIVE lança EmissionBarrierError com placeholder', async () => {
    await assert.rejects(
      () => buildNr13Pdf(placeholderReport, REAL_COMPANY, { mode: 'DEFINITIVE' }),
      (err: unknown) => {
        assert.ok(err instanceof EmissionBarrierError);
        assert.equal(err.assessment.canEmitDefinitive, false);
        return true;
      }
    );
  });

  it('não contorna a barreira mesmo com empresa real configurada e módulo importado direto', async () => {
    // "Contorno" clássico: chamar o builder com outra empresa. Sem
    // empresa real de configuração, também não há caminho DEFINITIVE.
    await assert.rejects(
      () => buildNr13Pdf(placeholderReport, DEMO_COMPANY_INFO, { mode: 'DEFINITIVE' }),
      EmissionBarrierError
    );
  });

  it('relatório totalmente válido emite definitivo (sem bloqueio indevido)', async () => {
    const assessment = assessTechnicalReportEmission(validatedReport);
    assert.equal(assessment.canEmitDefinitive, true);
    // Fumaça: PDF definitivo com dados reais da empresa é permitido.
    const bytes = await buildNr13Pdf(validatedReport, REAL_COMPANY, { mode: 'DEFINITIVE' });
    assert.ok(bytes.length > 1000);
  });

  it('laudo sem resultados de engenharia também é bloqueado', () => {
    const assessment = assessTechnicalReportEmission({
      ...placeholderReport,
      engineeringResults: { integrityAnalysis: { formulaVersions: {} }, formulaVersions: {}, calculations: [] },
    });
    assert.equal(assessment.canEmitDefinitive, false);
    assert.ok(assessment.reasons.some((r) => r.includes('sem resultados de engenharia')));
  });
});

// ============================================================
// T13c — DEMO PDF: tarjas persistentes, avisos e sem alegação normativa
// ============================================================

describe('Lote 23A / T13c — PDF de demonstração não apresenta conclusiva nem alegação normativa', () => {
  let demoText: string;
  let demoBytes: Uint8Array;

  it('gera documento de demonstração (modo DEMO)', async () => {
    demoBytes = await buildNr13Pdf(placeholderReport, DEMO_COMPANY_INFO, { mode: 'DEMO' });
    assert.ok(demoBytes.length > 1000);
    demoText = await pdfText(demoBytes);
  });

  it('contém tarja DEMONSTRAÇÃO - NÃO VÁLIDO PARA USO TÉCNICO (persistente)', () => {
    assert.ok(demoText.includes(norm(DEMO_BANNER_TEXT)));
  });

  it('declara não haver alegação de conformidade normativa', () => {
    assert.ok(demoText.includes(norm(DEMO_NO_CLAIM_TEXT)));
  });

  it('NÃO conclui "conforme NR-13/ASME/API 570/510" (fórmula placeholder)', () => {
    assert.ok(!demoText.includes('elaborado conforme nr-13, asme bpvc viii-1, api 570/510'));
  });

  it('contém aviso explícito de fórmulas não validadas com os IDs', () => {
    assert.ok(demoText.includes(norm(PLACEHOLDER_WARNING_TEXT)));
    assert.ok(demoText.includes('minimumthickness'));
    assert.ok(demoText.includes('mawp'));
  });

  it('não apresenta REQUER REPARO como conclusão definitiva (estimativa)', () => {
    assert.ok(demoText.includes('estimativa'));
    assert.ok(demoText.includes('nao validado'));
  });

  it('visão geral (overview) vem rotulada como demonstração', () => {
    const sanitized = sanitizeForEmission(placeholderReport, 'DEMO', assessTechnicalReportEmission(placeholderReport));
    assert.ok(String(sanitized.executiveSummary.overview).startsWith('[DEMONSTRAÇÃO'));
  });
});

// ============================================================
// T13b — INDICADORES: mapeia valores apenas quando válidos e aprovados
// ============================================================

describe('Lote 23A / T13b — mapeamento de taxa de corrosão, vida útil e PMTA', () => {
  it('cenário-placeholder: PMTA calc. e esp. mín. calc. viram N/D; demais mapeiam com avisos', async () => {
    const bytes = await buildNr13Pdf(placeholderReport, DEMO_COMPANY_INFO, { mode: 'DEMO' });
    const text = await pdfText(bytes);

    const indicators = extractEmissionIndicators(placeholderReport);
    // Fórmulas placeholder → N/D (nunca número "validado")
    assert.equal(indicators.mawp.valid, false);
    assert.equal(indicators.mawp.text, 'N/D (não validado)');
    assert.equal(indicators.minimumThicknessCalculated.valid, false);
    assert.equal(indicators.minimumThicknessCalculated.text, 'N/D (não validado)');
    // Taxa/vida usam fórmula com versão não-placeholder e entrada real; o
    // documento INTEIRO em modo DEMO carrega tarjas persistentes de que
    // nada aqui é resultado técnico definitivo.
    assert.equal(indicators.corrosionRate.valid, true);

    assert.ok(text.includes('n/d (nao validado)'));
    // O card de PMTA não apresenta o valor placeholder como válido
    assert.ok(!text.includes('pmta calculada 19.76 bar'));
  });

  it('cenário-validado: exibe os valores calculados no PDF', async () => {
    const bytes = await buildNr13Pdf(validatedReport, REAL_COMPANY, { mode: 'DEFINITIVE' });
    const text = await pdfText(bytes);

    const indicators = extractEmissionIndicators(validatedReport);
    assert.equal(indicators.corrosionRate.valid, true);
    assert.equal(indicators.corrosionRate.text, '0.308 mm/ano');
    assert.equal(indicators.mawp.valid, true);
    assert.equal(indicators.mawp.text, '19.76 bar');
    assert.equal(indicators.remainingLife.text, '4.2 anos');

    assert.ok(text.includes('0.308 mm/ano'));
    assert.ok(text.includes('19.76 bar'));
  });

  it('diferencia espessura mínima cadastrada e calculada e denuncia a divergência', async () => {
    const indicators = extractEmissionIndicators(validatedReport);
    assert.equal(indicators.minimumThicknessRegistered.text, '6.3 mm');
    assert.equal(indicators.minimumThicknessCalculated.text, '5.20 mm');
    assert.ok(
      indicators.minThicknessDivergenceNote?.includes('Divergência'),
    );
    assert.ok(
      indicators.minThicknessDivergenceNote?.includes('cadastrada (6.3 mm)'),
    );

    const bytes = await buildNr13Pdf(validatedReport, REAL_COMPANY, { mode: 'DEFINITIVE' });
    const text = await pdfText(bytes);
    assert.ok(text.includes('esp. min. cadastrada'));
    assert.ok(text.includes('esp. min. calculada'));
    assert.ok(text.includes('diverge da cadastrada'));
  });

  it('placeholder: nota diz que só a espessura mínima cadastrada está exibida', () => {
    const indicators = extractEmissionIndicators(placeholderReport);
    assert.ok(
      indicators.minThicknessDivergenceNote?.includes('cálculo não validado'),
    );
  });

  it('não inventa valores ausentes: cálculo ausente exibe "-"', () => {
    const semCalc = {
      ...validatedReport,
      engineeringResults: {
        ...validatedReport.engineeringResults,
        integrityAnalysis: {
          ...validatedReport.engineeringResults.integrityAnalysis,
          corrosionRate: undefined,
          remainingLife: undefined,
          mawp: undefined,
        },
      },
    };
    const indicators = extractEmissionIndicators(semCalc);
    assert.equal(indicators.corrosionRate.text, '-');
    assert.equal(indicators.remainingLife.text, '-');
    assert.equal(indicators.mawp.text, '-');
  });
});

// ============================================================
// T13d — DADOS INSTITUCIONAIS: sem MOCK_COMPANY no caminho de produção
// ============================================================

describe('Lote 23A / T13d — empresa real no PDF, nenhum mock', () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(here, '..', '..');

  it('rota de PDF não mais importa/usa MOCK_COMPANY', () => {
    const routeSource = fs.readFileSync(
      path.join(repoRoot, 'src/app/api/reports/[id]/pdf/route.ts'),
      'utf8'
    );
    assert.ok(!routeSource.includes('MOCK_COMPANY'));
  });

  it('builder não importa/aplica MOCK_COMPANY como default', async () => {
    const builderSource = fs.readFileSync(
      path.join(repoRoot, 'src/modules/report/templates/nr13/pdf/builder.ts'),
      'utf8'
    );
    const hasMockImport = /import\s*\{[^}]*MOCK_COMPANY[^}]*\}\s*from/.test(builderSource);
    const hasMockDefault = /=\s*MOCK company_OLD|=\s*MOCK_COMPANY|,\s*company:\s*CompanyInfo\s*=\s*MOCK Company|company:\s*CompanyInfo\s*=\s*MOCK_COMPANY/.test(builderSource);
    assert.ok(!hasMockImport, 'builder não deve importar MOCK_COMPANY');
    assert.ok(!hasMockDefault, 'builder não deve usar MOCK_COMPANY como default');
  });

  it('PDF definitivo usas dados institucionais reais (nome + CNPJ)', async () => {
    const bytes = await buildNr13Pdf(validatedReport, REAL_COMPANY, { mode: 'DEFINITIVE' });
    const text = await pdfText(bytes);
    assert.ok(text.includes(norm(REAL_COMPANY.name)));
    assert.ok(text.includes('00.111.222/0001-33'));
  });

  it('nenhum PDF traz o CNPJ fictício do mock', async () => {
    const demoBytes = await buildNr13Pdf(placeholderReport, DEMO_COMPANY_INFO, { mode: 'DEMO' });
    const demoText = await pdfText(demoBytes);
    const realBytes = await buildNr13Pdf(validatedReport, REAL_COMPANY, { mode: 'DEFINITIVE' });
    const realText = await pdfText(realBytes);
    assert.ok(!demoText.includes(MOCK_COMPANY_CNPJ));
    assert.ok(!realText.includes(MOCK_COMPANY_CNPJ));
  });

  it('sem env de empresa: emissão definitiva possivelmente bloqueada', () => {
    assert.equal(resolveCompanyInfoFromEnv({}), null);
    assert.equal(isDefinitiveCompanyInfo(null), false);
    assert.equal(isDefinitiveCompanyInfo(DEMO_COMPANY_INFO), false);

    const resolved = resolveCompanyInfoFromEnv({
      REPORT_COMPANY_NAME: 'EngeServ Engenharia e Inspeções SA',
      REPORT_COMPANY_CNPJ: '00.111.222/0001-33',
    });
    assert.ok(resolved);
    assert.equal(resolved.name, 'EngeServ Engenharia e Inspeções SA');
    assert.equal(isDefinitiveCompanyInfo(resolved), true);
  });

  it('builder em DEFINITIVE com empresa fictícia/demo lança EmissionBarrierError', async () => {
    await assert.rejects(
      () => buildNr13Pdf(validatedReport, DEMO_COMPANY_INFO, { mode: 'DEFINITIVE' }),
      EmissionBarrierError
    );
  });
});

// ============================================================
// T11 — PIPELINE SEM FALLBACK V-101 + barreira na transição de estado
// ============================================================

describe('Lote 23A / T11 — cálculo apenas com dados reais', () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(here, '..', '..');

  it('pipeline de laudo não referencia fallback V-101/mock de caso', () => {
    const serviceSource = fs.readFileSync(
      path.join(repoRoot, 'src/modules/report/pipeline/service.ts'),
      'utf8'
    );
    assert.ok(!serviceSource.includes("caseId = 'V-101'"));
    assert.ok(!serviceSource.includes('runCalculation('));
  });

  it('entidade do laudo não mais esconde placeholderMode nem alega conformidade', () => {
    const entitiesSource = fs.readFileSync(
      path.join(repoRoot, 'src/modules/report/domain/entities.ts'),
      'utf8'
    );
    assert.ok(!entitiesSource.includes('placeholderMode: false'));
    assert.ok(
      !entitiesSource.includes('Laudo elaborado conforme NR-13, ASME BPVC VIII-1, API 570/510.')
    );
  });

  it('sanitização remove alegação de conformidade de laudo já persistido (banco antigo)', () => {
    const sanitized = sanitizeForEmission(
      placeholderReport,
      'DEMO',
      assessTechnicalReportEmission(placeholderReport)
    );
    assert.ok(
      !norm(sanitized.technicalConclusion.complianceStatement).includes('elaborado conforme nr-13'),
    );
    assert.ok(sanitized.technicalConclusion.complianceStatement.includes('NÃO atesta conformidade'));
  });
});
