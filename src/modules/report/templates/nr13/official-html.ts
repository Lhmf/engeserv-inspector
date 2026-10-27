import type { TechnicalReport } from '@/modules/report/types';
import { buildOfficialMeasurementPoints, REGIONAL_ADOPTION_NOTE } from '@/modules/report/measurements/regional-adoption';
import { NR13_STANDARD_TEXT, standardRecommendations } from './standard-text';

type AnyRecord = Record<string, any>;

function text(value: unknown, fallback = '-') {
  const result = String(value ?? '').trim();
  return result || fallback;
}

function escapeHtml(value: unknown) {
  return text(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function number(value: unknown, digits = 2) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(digits).replace('.', ',') : '-';
}

function date(value: unknown) {
  if (!value) return '-';
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? text(value) : parsed.toLocaleDateString('pt-BR');
}

function rows(values: Array<[string, unknown]>) {
  return values.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('');
}

function image(url: unknown, alt: string, className: string) {
  const source = String(url ?? '').trim();
  return source ? `<img class="${className}" src="${escapeHtml(source)}" alt="${escapeHtml(alt)}">` : '';
}

function minimum(values: number[]) {
  return values.length ? Math.min(...values) : null;
}

function maximum(values: number[]) {
  return values.length ? Math.max(...values) : null;
}

function documentChecklist() {
  return `<table class="checklist"><tr><th>DOCUMENTO / ITEM</th><th>RESULTADO</th></tr><tr><td>Prontuário do vaso</td><td>APRESENTADO / A CONFIRMAR</td></tr><tr><td>Livro de registro de segurança</td><td>APRESENTADO / A CONFIRMAR</td></tr><tr><td>Projeto de alteração e reparos</td><td>NÃO INFORMADO</td></tr><tr><td>Relatório de inspeção anterior</td><td>NÃO INFORMADO</td></tr><tr><td>Certificados dos instrumentos</td><td>NÃO INFORMADO</td></tr></table>`;
}

let activeDocuments: AnyRecord[] = [];

function annexPlaceholder(title: string): string {
  const normalized = title.toLowerCase();
  const terms = normalized.includes('art') || normalized.includes('responsabilidade') ? ['art', 'responsabilidade']
    : normalized.includes('válvula') || normalized.includes('valvula') ? ['valvula', 'válvula']
    : normalized.includes('manômetro') || normalized.includes('manometro') ? ['manometro', 'manômetro', 'rbc', 'inmetro']
    : normalized.includes('bomba') ? ['bomba']
    : normalized.includes('aparelho') || normalized.includes('espessura') ? ['ultrassom', 'espessura']
    : ['complementar', 'outro'];
  const attached = documentFor(activeDocuments, ...terms);
  if (attached) return annexDocument(attached, title);
  return `<div class="annex-placeholder"><b>${escapeHtml(title)}</b><p>Documento não anexado a esta inspeção. O arquivo deverá ser incluído antes da emissão definitiva.</p></div>`;
}

function annexDocument(document: AnyRecord | undefined, title: string): string {
  if (!document) return annexPlaceholder(title);
  const mimeType = text(document.mimeType || document.type, '').toLowerCase();
  const name = text(document.name || document.originalName, 'Documento anexado');
  const url = text(document.url, '');
  const isImage = mimeType.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(name);
  const content = isImage && url
    ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(name)}" style="display:block;width:100%;height:180mm;object-fit:contain;border:1px solid #111;margin:15mm auto 8mm">`
    : `<div class="annex-file"><b>${escapeHtml(name)}</b><p>Arquivo anexado à base documental do cliente.</p><p>Tipo: ${escapeHtml(mimeType || 'arquivo')}</p></div>`;
  return `<div class="annex-document"><b>${escapeHtml(title)}</b>${content}<p class="small">${escapeHtml(document.description || 'Documento vinculado ao cliente e à inspeção.')}</p></div>`;
}

function documentFor(documents: AnyRecord[], ...terms: string[]) {
  return documents.find((document) => {
    const value = `${document.type || ''} ${document.name || document.originalName || ''}`.toLowerCase();
    return terms.some((term) => value.includes(term));
  });
}

function measurementMap(report: AnyRecord) {
  const measurements = Array.isArray(report.inspectionData?.measurements) ? report.inspectionData.measurements : [];
  const points = buildOfficialMeasurementPoints(measurements);
  const mapRows = points.map((point, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(point.label)}</td><td>${point.value == null ? '-' : number(point.value)}${point.measured ? '' : '*'}</td><td>${point.measured ? 'MEDIDO' : 'ADOTADO'}</td></tr>`).join('');
  return `<table class="measurement-map"><tr><th>ID</th><th>LOCAL</th><th>ESPESSURA (mm)</th><th>ORIGEM</th></tr>${mapRows}</table><p class="small">${escapeHtml(REGIONAL_ADOPTION_NOTE)}</p>`;
}

const FIELD_CHECKLIST_LABELS: Array<[string, string]> = [
  ['externalAccess', 'Acesso seguro para manutenÃ§Ã£o, operaÃ§Ã£o e inspeÃ§Ã£o'],
  ['externalClearance', 'SaÃ­da ampla e permanentemente desobstruÃ­da'],
  ['identificationPlate', 'Placa de identificaÃ§Ã£o legÃ­vel e visÃ­vel'],
  ['safetyValve', 'VÃ¡lvula de seguranÃ§a instalada e identificada'],
  ['pressureGauge', 'ManÃ´metro instalado e identificado'],
  ['tightnessTest', 'Teste de estanqueidade realizado'],
  ['lighting', 'IluminaÃ§Ã£o adequada para inspeÃ§Ã£o'],
];

function fieldChecklistValue(report: AnyRecord, key: string) {
  const checklist = report.inspectionData?.fieldChecklist || report.inspectionData?.inspection?.fieldChecklist;
  const values = checklist && typeof checklist === 'object' ? checklist : {};
  return typeof values[key] === 'boolean' ? (values[key] ? 'SIM' : 'NÃƒO') : 'NÃƒO INFORMADO';
}

function fieldChecklist(report: AnyRecord) {
  const checklistRows = FIELD_CHECKLIST_LABELS.map(([key, label]) => {
    return `<tr><td>${escapeHtml(label)}</td><td>${fieldChecklistValue(report, key)}</td></tr>`;
  }).join('');
  return `<table class="checklist field-checklist"><tr><th>ITEM VERIFICADO EM CAMPO</th><th>RESULTADO</th></tr>${checklistRows}</table>`;
}

function pageHeader(report: AnyRecord, pageNumber: number, total: number) {
  const metadata = report.metadata || {};
  return `<table class="header"><tr><td>${image(metadata.inspectorLogoUrl, 'Logo EngeServ', 'logo')}</td><td><b>LAUDO TÉCNICO DE INSPEÇÃO PERIÓDICA<br>EM ATENDIMENTO NR-13</b></td><td>DOC: ${escapeHtml(report.identification?.reportNumber)}<br>PÁGINA: ${pageNumber} / ${total}<br>DATA: ${escapeHtml(date(report.identification?.inspectionDate))}</td></tr></table>`;
}

function page(content: string, report: AnyRecord, pageNumber: number, total: number) {
  return `<section class="page">${pageHeader(report, pageNumber, total)}${content}<footer>ART: ${escapeHtml(report.identification?.artNumber)} <span>${escapeHtml(text(report.metadata?.companySite, 'ENGSERV'))}</span></footer></section>`;
}

export function renderOfficialNr13Html(report: TechnicalReport): string {
  const data = report as AnyRecord;
  const client = data.client || {};
  const equipment = data.equipment || {};
  const inspection = data.inspectionData?.inspection || {};
  if (!inspection.notes) inspection.notes = NR13_STANDARD_TEXT.externalExam.join(' ');
  const nextInspection = data.nextInspection?.recommendedDate || data.identification?.expiresAt;
  const photos = Array.isArray(data.attachments?.photos) ? data.attachments.photos : [];
  const documents = Array.isArray(data.attachments?.documents) ? data.attachments.documents : [];
  activeDocuments = documents;
  const recommendations = Array.isArray(data.recommendations) ? data.recommendations : (data.recommendations?.immediate || []);
  const recommendationItems = recommendations.length ? recommendations : standardRecommendations();
  const recommendationMarkup = recommendationItems.map((item: AnyRecord) => `<li>${escapeHtml(item.description || item)}</li>`).join('');
  const measures = buildOfficialMeasurementPoints(Array.isArray(data.inspectionData?.measurements) ? data.inspectionData.measurements : []);
  const bodyValues = measures.slice(0, 10).filter((item) => item.value !== null).map((item) => Number(item.value));
  const headValues = measures.slice(10).filter((item) => item.value !== null).map((item) => Number(item.value));
  const conclusion = data.technicalConclusion?.justification || `O equipamento ${text(equipment.description || equipment.type)} TAG ${text(equipment.tag)} foi inspecionado nas condições registradas neste documento.`;
  const clientRows = rows([['CLIENTE', client.name], ['CNPJ', client.cnpj], ['ENDEREÇO', client.address], ['CIDADE / UF', text(client.city) + ' / ' + text(client.state)], ['CEP', client.zipCode]]);
  const vesselRows = rows([['EQUIPAMENTO', equipment.description || equipment.type], ['TAG', equipment.tag], ['FABRICANTE', equipment.manufacturer], ['NÚMERO DE SÉRIE', equipment.serialNumber], ['CÓDIGO DE PROJETO', equipment.designCode], ['LOCAL DE INSTALAÇÃO', equipment.siteName], ['NORMA', 'NR-13'], ['CATEGORIA / CLASSE / GRUPO', `${text(equipment.nr13Category)} / ${text(equipment.fluidClass)} / ${text(equipment.riskGroup)}`]]);
  const designRows = rows([['TIPO DE FLUIDO', equipment.fluidType], ['VOLUME INTERNO', equipment.volumeLiters ? `${number(Number(equipment.volumeLiters) / 1000, 3)} m³` : '-'], ['PRESSÃO DE PROJETO', equipment.designPressureBar ? `${number(equipment.designPressureBar)} bar` : '-'], ['PRESSÃO DE OPERAÇÃO', equipment.operatingPressureBar ? `${number(equipment.operatingPressureBar)} bar` : '-'], ['PMTA', equipment.mawpBar ? `${number(equipment.mawpBar)} bar` : '-'], ['PTH', equipment.hydroTestPressureBar ? `${number(equipment.hydroTestPressureBar)} bar` : '-'], ['TEMPERATURA DE PROJETO', equipment.designTempC ? `${number(equipment.designTempC)} °C` : '-'], ['TIPO DE TAMPO', equipment.headType], ['MATERIAL DO CASCO', equipment.bodyMaterial], ['MATERIAL DOS TAMPOS', equipment.headMaterial], ['ESPESSURA NOMINAL CASCO / TAMPOS', `${number(equipment.originalThicknessMm)} / ${number(equipment.headNominalThicknessMm)} mm`]]);
  const photoPages = photos.length ? photos.map((photo: AnyRecord, index: number) => `<div class="photo-sheet"><div class="section-title">REGISTRO FOTOGRÁFICO ${index + 1}</div>${image(photo.url, photo.caption || 'Foto da inspeção', 'annex-photo')}<p>${escapeHtml(photo.caption || 'Registro fotográfico da inspeção em campo.')}</p></div>`) : ['<div class="photo-sheet"><div class="section-title">REGISTRO FOTOGRÁFICO</div><p>Não foram anexadas imagens a esta inspeção.</p></div>'];
  const pages = [
    `<div class="cover"><div class="brand">${image(data.metadata?.inspectorLogoUrl, 'Logo EngeServ', 'inspector-logo')}</div><h1>LAUDO TÉCNICO DE INSPEÇÃO<br>SEGURANÇA EM VASO DE PRESSÃO</h1><h2>LAUDO TÉCNICO DE INSPEÇÃO PERIÓDICA<br>EM ATENDIMENTO DA NR-13</h2><div class="tag">TAG: ${escapeHtml(equipment.tag)}</div><p>Equipamento: <b>${escapeHtml(equipment.description || equipment.type)}</b></p><p>Inspeção realizada em <b>${escapeHtml(date(data.identification?.inspectionDate))}</b></p><p>ART: <b>${escapeHtml(data.identification?.artNumber)}</b></p><p class="category">CLASSE ${escapeHtml(equipment.fluidClass)} &nbsp; GRUPO ${escapeHtml(equipment.riskGroup)} &nbsp; CAT. ${escapeHtml(equipment.nr13Category)}</p><div class="toc"><b>ÍNDICE</b><br>1. Solicitante e identificação<br>2. Dados do vaso e do projeto<br>3. Prazo das próximas inspeções<br>4. Classificação e empresa inspetora<br>5. Análise dos documentos<br>6. Exames realizados e END<br>7. Mapa de medição e cálculo de vida útil<br>8. Equipamentos utilizados<br>9. Recomendações e conclusão<br>ANEXOS - registros e certificados</div></div>`,
    `<div class="section-title">1. SOLICITANTE</div><table>${clientRows}</table><div class="section-title">IDENTIFICAÇÃO DO VASO DE PRESSÃO</div><table>${vesselRows}</table>`,
    `<div class="section-title">2. DADOS DO VASO DE PRESSÃO</div><table>${rows([['COMPRIMENTO ENTRE SOLDAS', equipment.lengthMm ? number(equipment.lengthMm) + ' mm' : '-'], ['DIÂMETRO INTERNO', equipment.insideDiameterMm ? number(equipment.insideDiameterMm) + ' mm' : '-'], ['FORMATO', 'Cilíndrico vertical'], ['TIPOS DE UNIÕES', 'Soldada'], ['TIPO DE TAMPOS', equipment.headType]])}</table><div class="section-title">3. DADOS DO PROJETO</div><table>${designRows}</table>`,
    `<div class="section-title">4. PRAZO DAS PRÓXIMAS INSPEÇÕES DE ACORDO COM NR-13</div><table class="checklist"><tr><th>EXAME VISUAL EXTERNO</th><th>EXAME INTERNO</th><th>MEDIÇÃO ULTRASSOM</th><th>TESTE HIDROSTÁTICO</th></tr><tr><td>SIM</td><td>SIM</td><td>SIM</td><td>NÃO INFORMADO</td></tr><tr><th>DATA DA INSPEÇÃO</th><th>PRÓXIMA EXTERNA</th><th>PRÓXIMA INTERNA</th><th>PRÓXIMA END</th></tr><tr><td>${escapeHtml(date(data.identification?.inspectionDate))}</td><td>${escapeHtml(date(nextInspection))}</td><td>${escapeHtml(date(nextInspection))}</td><td>${escapeHtml(date(nextInspection))}</td></tr></table><p class="small">Os prazos devem ser confirmados pelo profissional legalmente habilitado conforme as condições reais de operação e os critérios vigentes da NR-13.</p>`,
    `<div class="section-title">5. CLASSIFICAÇÃO DO VASO DE PRESSÃO</div><table>${rows([['FLUIDO DE SERVIÇO', equipment.fluidType], ['CLASSE DO FLUIDO', equipment.fluidClass], ['GRUPO POTENCIAL DE RISCO', equipment.riskGroup], ['CATEGORIA', equipment.nr13Category], ['TIPO DE VASO', equipment.description || equipment.type], ['TIPO DE INSPEÇÃO', inspection.type]])}</table><p>Os vasos de pressão são classificados segundo o tipo de fluido e o potencial de risco em função do produto P.V, observadas as informações cadastradas e os documentos apresentados.</p>`,
    `<div class="section-title">6. EMPRESA INSPETORA OU PROFISSIONAL LEGALMENTE HABILITADO</div><table>${rows([['EMPRESA', data.metadata?.companyName || 'ENGSERV ENGENHARIA E SERVIÇOS'], ['CNPJ', data.metadata?.companyCnpj], ['ENDEREÇO', data.metadata?.companyAddress], ['PLH RESPONSÁVEL', data.identification?.engineerName || data.identification?.inspectorName], ['CREA / ART', data.identification?.artNumber], ['CONTATO', data.metadata?.companyEmail]])}</table><div class="section-title">7. ANÁLISE DOS DOCUMENTOS</div>${documentChecklist()}`,
    `<div class="section-title">8. EXAMES REALIZADOS</div><h3>8.1 - EXAME EXTERNO</h3><p>${escapeHtml(inspection.notes || 'Foi realizado exame visual externo do equipamento, verificando condições aparentes, acessibilidade, identificação e conservação.')}</p>${fieldChecklist(data)}<h3>8.2 - PLACA DE IDENTIFICAÇÃO</h3><p>Registro da identificação do vaso, TAG e número de série conforme dados cadastrados. Resultado de campo: <b>${fieldChecklistValue(data, 'identificationPlate')}</b>.</p><h3>8.3 - VÁLVULA DE SEGURANÇA</h3><p>Verificação documental e visual da válvula de segurança. Resultado de campo: <b>${fieldChecklistValue(data, 'safetyValve')}</b>.</p>`,
    `<div class="section-title">8.4 - MANÔMETRO E TESTE DE ESTANQUEIDADE</div><table>${rows([['MANÔMETRO', fieldChecklistValue(data, 'pressureGauge')], ['PRESSÃO DE TESTE', equipment.hydroTestPressureBar ? number(equipment.hydroTestPressureBar) + ' bar' : '-'], ['TEMPO DE TESTE', '-'], ['RESULTADO', fieldChecklistValue(data, 'tightnessTest')]])}</table><div class="section-title">9. ENSAIO NÃO DESTRUTIVO - END E INSPEÇÃO</div><p>Ensaio de medição de espessura por ultrassom realizado nos pontos de controle registrados na tabela deste laudo.</p>`,
    `<div class="section-title">9.1 - MEDIÇÃO DE ESPESSURA POR ULTRASSOM</div><p>As espessuras mínimas encontradas foram:</p><table><tr><th>REGIÃO</th><th>MÍNIMO</th><th>MÁXIMO</th><th>REGISTROS</th></tr><tr><td>CASCO</td><td>${number(minimum(bodyValues))} mm</td><td>${number(maximum(bodyValues))} mm</td><td>10 pontos</td></tr><tr><td>TAMPOS</td><td>${number(minimum(headValues))} mm</td><td>${number(maximum(headValues))} mm</td><td>8 pontos</td></tr></table><p>${escapeHtml(data.executiveSummary?.overview || 'A integridade do vaso foi analisada pelo ensaio de ultrassom. Os resultados permanecem como estimativa técnica até a validação formal das fórmulas pelo responsável técnico.')}</p>`,
    `<div class="section-title">MAPA DE MEDIÇÃO DE ESPESSURA</div>${measurementMap(data)}`,
    `<div class="section-title">CÁLCULO DE VIDA ÚTIL DO VASO DE PRESSÃO</div><table><tr><th>REGIÃO</th><th>ESP. MÍN. REQ.</th><th>MIN. ENCONTRADA</th><th>TAXA DE CORROSÃO</th><th>SOBREESPESSURA</th><th>VIDA REMANESCENTE</th></tr><tr><td>Casco</td><td>${number(equipment.minThicknessMm)} mm</td><td>${number(minimum(bodyValues))} mm</td><td>${number(data.engineeringResults?.corrosionRate?.value, 3)} mm/ano</td><td>${number(data.engineeringResults?.integrityAnalysis?.marginMm)} mm</td><td>${number(data.engineeringResults?.remainingLife?.value, 1)} anos</td></tr><tr><td>Tampos</td><td>${number(equipment.minThicknessMm)} mm</td><td>${number(minimum(headValues))} mm</td><td>${number(data.engineeringResults?.corrosionRate?.value, 3)} mm/ano</td><td>${number(data.engineeringResults?.integrityAnalysis?.marginMm)} mm</td><td>${number(data.engineeringResults?.remainingLife?.value, 1)} anos</td></tr></table><p class="small">Unidade de medida: milímetros (mm). Pontos com asterisco são valores adotados, não medidos.</p>`,
    `<div class="section-title">RESULTADO DAS MEDIÇÕES DE ESPESSURAS</div><div class="result-box">${escapeHtml(data.engineeringResults?.reliability === 'THEORETICAL' ? 'ESTIMATIVA TÉCNICA - FÓRMULAS PENDENTES DE VALIDAÇÃO' : 'RESULTADO TÉCNICO')}<br><b>${escapeHtml(conclusion)}</b></div><p>A emissão definitiva permanece condicionada à aprovação do critério de adoção regional e à validação das fórmulas pelo responsável técnico.</p>`,
    `<div class="section-title">10. EQUIPAMENTOS UTILIZADOS NA INSPEÇÃO</div><table>${rows([['APARELHO / Nº DE SÉRIE', data.inspectionData?.equipmentUsed || 'A informar'], ['ACOPLANTE', 'A informar'], ['PROCEDIMENTO', 'Procedimento de medição de espessura'], ['BLOCO DE REFERÊNCIA', 'A informar'], ['TEMPERATURA DA SUPERFÍCIE', 'Ambiente'], ['CABEÇOTE / VELOCIDADE SÔNICA', 'A informar']])}</table><div class="section-title">11. RECOMENDAÇÕES NECESSÁRIAS</div><ol>${recommendationMarkup || '<li>Manter os instrumentos de segurança calibrados e o equipamento dentro das condições de operação.</li><li>Não operar acima da PMTA registrada neste laudo.</li><li>Manter os registros de inspeção e manutenção disponíveis.</li>'}</ol>`,
    `<div class="section-title">12. CONCLUSÃO</div><p>${escapeHtml(conclusion)}</p><p>As recomendações registradas devem ser atendidas pelo usuário do equipamento. Qualquer reparo, alteração ou ocorrência que possa comprometer a segurança deve ser comunicada ao profissional legalmente habilitado.</p><div class="signature">${escapeHtml(data.identification?.engineerName || data.identification?.inspectorName)}<br>RESPONSÁVEL TÉCNICO<br>ART: ${escapeHtml(data.identification?.artNumber)}</div>`,
    `<div class="section-title">13. DATA PARA PRÓXIMA INSPEÇÃO</div><table>${rows([['EXAME EXTERNO', date(nextInspection)], ['EXAME INTERNO', date(nextInspection)], ['ESTANQUEIDADE', date(nextInspection)], ['TESTE HIDROSTÁTICO', 'A definir pelo PLH']])}</table><div class="section-title">14. RESPONSABILIDADE TÉCNICA</div><table>${rows([['PROFISSIONAL', data.identification?.engineerName || data.identification?.inspectorName], ['REGISTRO PROFISSIONAL', data.identification?.crea], ['ART', data.identification?.artNumber], ['DATA', date(data.identification?.inspectionDate)]])}</table>`,
    `<div class="annex-title">ANEXO I<br><b>PLACA DE IDENTIFICAÇÃO DO VASO DE PRESSÃO</b></div><table class="plate">${rows([['CÓDIGO DE LOCALIZAÇÃO', equipment.tag], ['DESCRIÇÃO', equipment.description || equipment.type], ['SÉRIE', equipment.serialNumber], ['CÓDIGO DE PROJETO', equipment.designCode], ['PRESSÃO DE PROJETO', equipment.designPressureBar], ['PRESSÃO DE OPERAÇÃO', equipment.operatingPressureBar], ['PMTA', equipment.mawpBar], ['PTH', equipment.hydroTestPressureBar], ['FABRICANTE', equipment.manufacturer], ['FLUIDO', equipment.fluidType], ['CATEGORIA', equipment.nr13Category]])}</table>`,
    ...photoPages,
    `<div class="annex-title">ANEXO II<br><b>CERTIFICADO DO APARELHO DE MEDIÇÃO DE ESPESSURA</b></div>${annexPlaceholder('Certificado do aparelho de medição de espessura por ultrassom')}`,
    `<div class="annex-title">ANEXO III<br><b>CERTIFICADO RBC INMETRO DO MANÔMETRO</b></div>${annexPlaceholder('Certificado RBC / INMETRO do manômetro')}`,
    `<div class="annex-title">ANEXO IV<br><b>CERTIFICADO DE AFERIÇÃO DA VÁLVULA DE SEGURANÇA</b></div>${annexPlaceholder('Certificado de calibração da válvula de segurança')}`,
    `<div class="annex-title">ANEXO V<br><b>CERTIFICADO DE CALIBRAÇÃO DO MANÔMETRO</b></div>${annexPlaceholder('Certificado de calibração do manômetro')}`,
    `<div class="annex-title">ANEXO VI<br><b>CERTIFICADO DA BOMBA COMPARATIVA</b></div>${annexPlaceholder('Certificado da bomba comparativa de calibração')}`,
    `<div class="annex-title">ANEXO VII<br><b>ANOTAÇÃO DE RESPONSABILIDADE TÉCNICA - ART</b></div>${annexPlaceholder('Anotação de Responsabilidade Técnica')}`,
    `<div class="annex-title">REGISTRO COMPLEMENTAR</div>${annexPlaceholder('Documentos complementares da inspeção')}`,
    `<div class="annex-title">REGISTRO COMPLEMENTAR</div>${annexPlaceholder('Documentos complementares da inspeção')}`,
    `<div class="annex-title">REGISTRO COMPLEMENTAR</div>${annexPlaceholder('Documentos complementares da inspeção')}`,
    `<div class="annex-title">REGISTRO COMPLEMENTAR</div>${annexPlaceholder('Documentos complementares da inspeção')}`,
    `<div class="annex-title">REGISTRO COMPLEMENTAR</div>${annexPlaceholder('Documentos complementares da inspeção')}`,
    `<div class="annex-title">REGISTRO COMPLEMENTAR</div>${annexPlaceholder('Documentos complementares da inspeção')}`,
    `<div class="annex-title">ENCERRAMENTO</div><div class="signature">${escapeHtml(data.identification?.engineerName || data.identification?.inspectorName)}<br>ENGENHEIRO MECÂNICO<br>ART: ${escapeHtml(data.identification?.artNumber)}</div>`,
  ];
  const fullPages = pages.slice(0, 28);
  while (fullPages.length < 28) fullPages.push(`<div class="annex-title">ANEXO</div>${annexPlaceholder('Página reservada para documento anexado')}`);
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Laudo NR-13 ${escapeHtml(data.identification?.reportNumber)}</title><style>${OFFICIAL_CSS}</style></head><body>${fullPages.map((content, index) => page(content, data, index + 1, 28)).join('')}</body></html>`;
}

const OFFICIAL_CSS = `@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;background:#e5e5e5;color:#111;font:10px Arial,Helvetica,sans-serif}.page{position:relative;width:210mm;height:297mm;margin:0 auto 8px;padding:10mm 12mm 16mm;background:#fff;page-break-after:always;border:1px solid #222;overflow:hidden}.header{width:100%;height:19mm;border-collapse:collapse;margin-bottom:4mm}.header td{border:1px solid #111;padding:2mm;text-align:center;vertical-align:middle}.header td:first-child{width:24%}.header td:last-child{width:25%;font-size:8px;text-align:left}.logo{max-width:100%;max-height:14mm}.inspector-logo{max-width:58mm;max-height:20mm}.cover{text-align:center;padding-top:5mm}.cover h1{font-size:18px;line-height:1.35;margin:8mm 0 5mm}.cover h2{font-size:11px;line-height:1.5}.tag{display:inline-block;margin:9mm 0 5mm;padding:2mm 7mm;border:2px solid #111;background:#ffff00;font-size:20px;font-weight:700}.category{margin-top:8mm;font-size:12px;font-weight:700}.toc{margin:10mm auto 0;text-align:left;width:75%;line-height:1.65;border-top:1px solid #111;padding-top:4mm}.section-title{margin:4mm 0 2mm;padding:1.5mm;background:#d9e2f3;border-bottom:1px solid #111;text-align:center;font-weight:700;font-size:10px}.page table{width:100%;border-collapse:collapse;margin-bottom:3mm}.page th,.page td{border:1px solid #111;padding:1.6mm;text-align:left;vertical-align:middle}.page th{width:34%;background:#f2f2f2}.checklist th,.checklist td{text-align:center}.measurement-map th{text-align:center;width:auto}.measurement-map td{text-align:center;height:7mm}.small{font-size:8px;line-height:1.35}.result-box{border:2px solid #111;padding:5mm;text-align:center;font-size:11px;background:#f2f2f2}.annex-title{text-align:center;font-size:16px;line-height:1.6;padding-top:12mm}.annex-placeholder{margin:30mm auto;border:1px solid #777;min-height:90mm;padding:12mm;text-align:center;font-size:13px}.photo-sheet{text-align:center}.annex-photo{width:100%;height:220mm;object-fit:contain;border:1px solid #111}.photo-sheet p{font-size:10px}.signature{margin:15mm auto 0;padding-top:2mm;border-top:1px solid #111;width:70%;text-align:center;font-size:10px}h3{font-size:10px;margin:4mm 0 1mm}p{line-height:1.35;text-align:justify}footer{position:absolute;left:12mm;right:12mm;bottom:5mm;border-top:1px solid #111;padding-top:1.5mm;font-size:8px;font-weight:700}footer span{float:right}@media print{body{background:#fff}.page{margin:0;border:0}}`;
