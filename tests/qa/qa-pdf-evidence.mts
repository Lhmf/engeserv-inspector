/**
 * Lote 23A — Gerador de evidências (PDFs reais) para QA
 *
 * Uso: npx tsx tests/qa/qa-pdf-evidence.mts
 * Gera em qa/lote23a/:
 *   - demo-placeholder.pdf      (laudo com fórmulas placeholder, modo DEMO)
 *   - definitive-validated.pdf  (laudo validado, modo DEFINITIVE, empresa real)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildNr13Pdf } from '../../src/modules/report/templates/nr13/pdf/builder';
import {
  resolveCompanyInfoFromEnv,
  isDefinitiveCompanyInfo,
  DEMO_COMPANY_INFO,
} from '../../src/modules/report/company-info';
import { assessTechnicalReportEmission } from '../../src/modules/report/safety/emission';
import { PDFParse } from 'pdf-parse';

const here = path.dirname(fileURLToPath(import.meta.url));
const mod: any = await import(
  new URL('file:///' + path.join(here, 'pdf-emission-barrier.test.ts').replace(/\\/g, '/')).href
);

const outDir = path.resolve(here, '..', '..', 'qa', 'lote23a');
fs.mkdirSync(outDir, { recursive: true });

const placeholderReport = mod.exportFixtureForDebug({ validated: false });
const validatedReport = mod.exportFixtureForDebug({ validated: true });

// 1) Cenário do Lote 21B (fórmulas placeholder): emissão definitiva BLOQUEADA
const assessment = assessTechnicalReportEmission(placeholderReport);
console.log('T13c/barreira:', JSON.stringify({
  canEmitDefinitive: assessment.canEmitDefinitive,
  placeholderFormulas: assessment.placeholderFormulas,
  reasons: assessment.reasons,
}, null, 2));

// 2) PDF definitivo validado com empresa REAL do .env (se configurada)
const realCompany = resolveCompanyInfoFromEnv();
console.log('T13d/empresa:', realCompany
  ? `RESOLVIDA do ambiente: ${realCompany.name} (CNPJ ${realCompany.cnpj})`
  : 'NÃO configurada no ambiente — emissão definitiva bloqueada em produção até configurar REPORT_COMPANY_* (teste usa empresa de teste explícita).');
const companyForDefinitive = realCompany ?? {
  name: 'QA-Test Company (evidência de teste)',
  tagline: 'Inspeção Técnica',
  cnpj: '00.111.222/0001-33',
};

const definitiveBytes = await buildNr13Pdf(validatedReport, companyForDefinitive, { mode: 'DEFINITIVE' });
fs.writeFileSync(path.join(outDir, 'definitive-validated.pdf'), Buffer.from(definitiveBytes));

// 3) PDF de DEMONSTRAÇÃO com fórmulas placeholder (tarjas persistentes)
const demoBytes = await buildNr13Pdf(placeholderReport, DEMO_COMPANY_INFO, { mode: 'DEMO' });
fs.writeFileSync(path.join(outDir, 'demo-placeholder.pdf'), Buffer.from(demoBytes));

// 4) Extração de texto das evidências
const demoParser = new PDFParse({ data: demoBytes.slice() });
const demoText = (await demoParser.getText()).text;
const defParser = new PDFParse({ data: definitiveBytes.slice() });
const defText = (await defParser.getText()).text;

console.log('\n--- demo-placeholder.pdf (texto extraído, primeiros 1500 chars) ---');
console.log(demoText.slice(0, 1500).replace(/\s+/g, ' '));
console.log('\n--- definitive-validated.pdf (texto extraído, primeiros 1500 chars) ---');
console.log(defText.slice(0, 1500).replace(/\s+/g, ' '));

console.log('\nArquivos gerados em', outDir);
