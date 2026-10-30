import fs from 'node:fs';
import path from 'node:path';
import type { TechnicalReport } from '@/modules/report/types';
import { buildOfficialMeasurementPoints, REGIONAL_ADOPTION_NOTE } from '@/modules/report/measurements/regional-adoption';
import { NR13_STANDARD_TEXT, standardRecommendations } from './standard-text';

type AnyRecord = Record<string, any>;

const PAGE_TOTAL = 28;
const TEMPLATE_ROOT = path.join(process.cwd(), 'public', 'report-template');

function templateAsset(fileName: string, mimeType: string) {
  try {
    const contents = fs.readFileSync(path.join(TEMPLATE_ROOT, fileName));
    return `data:${mimeType};base64,${contents.toString('base64')}`;
  } catch {
    return '';
  }
}

const ENGSERV_LOGO = templateAsset('engserv-logo.png', 'image/png');
const CLIENT_LOGO = templateAsset('client-logo.jpg', 'image/jpeg');
const EQUIPMENT_DIAGRAM = templateAsset('equipment-diagram.png', 'image/png');
const QR_A = templateAsset('qr-a.jpg', 'image/jpeg');
const QR_B = templateAsset('qr-b.jpg', 'image/jpeg');

function value(input: unknown, fallback = '-') {
  const result = String(input ?? '').trim();
  return result || fallback;
}

function html(input: unknown, fallback = '-') {
  return value(input, fallback)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function numeric(input: unknown, digits = 2) {
  const parsed = Number(input);
  return Number.isFinite(parsed) ? parsed.toFixed(digits).replace('.', ',') : '-';
}

function shortDate(input: unknown) {
  if (!input) return '-';
  const parsed = new Date(String(input));
  return Number.isNaN(parsed.getTime()) ? value(input) : parsed.toLocaleDateString('pt-BR');
}

function imageSource(input: unknown, fallback = '') {
  return value(input, fallback);
}

function isRenderableImageSource(input: unknown) {
  const source = String(input ?? '').trim();
  return /^(?:data:image\/|https?:\/\/)/i.test(source);
}

function imageTag(input: unknown, alt: string, className: string, fallback = '') {
  const source = imageSource(input, fallback);
  return source ? `<img class="${className}" src="${html(source)}" alt="${html(alt)}">` : '';
}

function tableRows(rows: Array<[string, unknown]>) {
  return rows.map(([label, item]) => `<tr><th>${html(label)}</th><td>${html(item)}</td></tr>`).join('');
}

function table(columns: string[], rows: Array<Array<unknown>>, className = '') {
  return `<table class="data-table ${className}"><thead><tr>${columns.map((column) => `<th>${html(column)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((item) => `<td>${html(item)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function band(title: string, color = 'blue') {
  return `<div class="band ${color}">${html(title)}</div>`;
}

function minimum(values: number[]) {
  return values.length ? Math.min(...values) : null;
}

function maximum(values: number[]) {
  return values.length ? Math.max(...values) : null;
}

function normaliseList(input: unknown): AnyRecord[] {
  if (Array.isArray(input)) return input.map((item) => typeof item === 'object' && item !== null ? item as AnyRecord : { description: item });
  if (input && typeof input === 'object') {
    const record = input as AnyRecord;
    for (const key of ['items', 'immediate', 'required', 'selected']) {
      if (Array.isArray(record[key])) return normaliseList(record[key]);
    }
  }
  return [];
}

function findAttachment(documents: AnyRecord[], ...terms: string[]) {
  return documents.find((document) => {
    const haystack = `${document.type || ''} ${document.name || ''} ${document.originalName || ''} ${document.description || ''}`.toLowerCase();
    return terms.some((term) => haystack.includes(term.toLowerCase()));
  });
}

function photoSource(photos: AnyRecord[], index: number, fallback = '') {
  const source = imageSource(photos[index]?.url, fallback);
  return isRenderableImageSource(source) ? source : '';
}

function photoGrid(photos: AnyRecord[], indexes: number[], className = '') {
  const items = indexes
    .map((index) => photos[index])
    .filter((photo) => photo && isRenderableImageSource(photo.url));
  if (!items.length) return `<div class="photo-empty">Registro fotográfico não anexado a esta inspeção.</div>`;
  return `<div class="photo-grid ${className}">${items.map((photo) => `<figure><img src="${html(value(photo.url))}" alt="${html(photo.caption, 'Registro fotográfico')}"><figcaption>${html(photo.caption, 'Registro fotográfico da inspeção')}</figcaption></figure>`).join('')}</div>`;
}

function standardHeader(report: AnyRecord, pageNumber: number) {
  const client = report.client || {};
  const metadata = report.metadata || {};
  const equipment = report.equipment || {};
  const clientLogo = imageSource(client.logoUrl || client.logo || metadata.clientLogoUrl, CLIENT_LOGO);
  const inspectorLogo = imageSource(metadata.inspectorLogoUrl, ENGSERV_LOGO);
  const documentNumber = report.identification?.reportNumber || `LTI ${value(client.cnpj, '').replace(/\D/g, '')}-${value(equipment.tag, '').replace(/\W/g, '-')}`;
  return `<table class="document-header"><tr><td class="header-client">${imageTag(clientLogo, 'Logo do cliente', 'client-logo')}</td><td class="header-title"><b>DOC: ${html(documentNumber)}</b><strong>LAUDO TÉCNICO DE INSPEÇÃO<br>PERIÓDICA<br>EM ATENDIMENTO NR 13</strong></td><td class="header-meta"><b>PÁGINA:</b><b>${pageNumber} / ${PAGE_TOTAL}</b><b>REVISÃO:</b><b>-</b><b>DATA:</b><b>${html(shortDate(report.identification?.inspectionDate))}</b><div>${imageTag(inspectorLogo, 'Logo EngeServ - ENG-SERV ENGENHARIA & SERVIÇOS', 'engserv-logo')}</div></td></tr></table>`;
}

function standardFooter(report: AnyRecord) {
  const equipment = report.equipment || {};
  const metadata = report.metadata || {};
  const identification = report.identification || {};
  const firstWord = value(equipment.manufacturer, 'EQUIPAMENTO').split(/\s+/)[0];
  return `<footer class="document-footer"><span>ART: ${html(identification.artNumber)}</span><span>${html(value(metadata.companySite, 'www.engenhariaeinspecoes.com.br'))}</span><span>ID_EGS_LAU_VP_${html(equipment.serialNumber)} /VERT/AR /${html(firstWord)}_${html(equipment.tag)}</span></footer>`;
}

function bodyPage(report: AnyRecord, pageNumber: number, content: string) {
  return `<section class="page body-page">${standardHeader(report, pageNumber)}<main>${content}</main>${standardFooter(report)}</section>`;
}

function annexTitlePage(report: AnyRecord, pageNumber: number, annexNumber: string, title: string) {
  return bodyPage(report, pageNumber, `<div class="annex-title-page"><b>ANEXO</b><u>${html(annexNumber)}</u>${band(title, 'cyan')}</div>`);
}

function documentChecklist(documents: AnyRecord[]) {
  const rows = [
    ['Prontuário do vaso', findAttachment(documents, 'prontuário', 'prontuario') ? 'SIM' : 'NÃO INFORMADO'],
    ['Livro de Registro de Segurança', findAttachment(documents, 'livro', 'registro de segurança', 'registro de seguranca') ? 'SIM' : 'NÃO INFORMADO'],
    ['Projeto de Alteração e Reparos', findAttachment(documents, 'projeto', 'alteração', 'alteracao', 'reparo') ? 'SIM' : 'NÃO INFORMADO'],
    ['Relatório de Inspeção Anterior', findAttachment(documents, 'inspeção anterior', 'inspecao anterior', 'laudo anterior') ? 'SIM' : 'NÃO INFORMADO'],
    ['Certificados dos instrumentos', findAttachment(documents, 'certificado', 'calibração', 'calibracao', 'instrumento') ? 'SIM' : 'NÃO INFORMADO'],
  ];
  return table(['DOCUMENTO / ITEM', 'RESULTADO'], rows, 'checklist');
}

function fieldResult(report: AnyRecord, key: string) {
  const checklist = report.inspectionData?.fieldChecklist || report.inspectionData?.inspection?.fieldChecklist || {};
  return typeof checklist[key] === 'boolean' ? (checklist[key] ? 'SIM' : 'NÃO') : 'NÃO INFORMADO';
}

function measurementMap(report: AnyRecord) {
  const measurements = Array.isArray(report.inspectionData?.measurements) ? report.inspectionData.measurements : [];
  const points = buildOfficialMeasurementPoints(measurements);
  const rows = points.map((point, index) => [index + 1, point.label, point.value == null ? '-' : `${numeric(point.value)}${point.measured ? '' : '*'}`, point.measured ? 'MEDIDO' : 'ADOTADO']);
  return table(['ID', 'LOCAL', 'ESPESSURA (mm)', 'ORIGEM'], rows, 'measurement-list');
}

function recommendations(report: AnyRecord) {
  const list = normaliseList(report.recommendations);
  const items = list.length ? list : standardRecommendations().map((description) => ({ description }));
  return items.map((item) => `<tr><td>${html(item.description || (item as AnyRecord).text || item)}</td></tr>`).join('');
}

function reportCover(report: AnyRecord) {
  const client = report.client || {};
  const equipment = report.equipment || {};
  const identification = report.identification || {};
  const metadata = report.metadata || {};
  const clientLogo = imageSource(client.logoUrl || client.logo || metadata.clientLogoUrl, CLIENT_LOGO);
  const inspectorLogo = imageSource(metadata.inspectorLogoUrl, ENGSERV_LOGO);
  return `<section class="page cover-page"><div class="cover-left"><div class="cover-brand">${imageTag(inspectorLogo, 'Logo EngeServ', 'cover-engserv-logo')}<b>☎ 18 99623-8997</b><b>WWW.ENGENHARIAEINSPECOES.COM.BR/</b></div><div class="nr13"><span>NR</span><strong>13</strong></div><div class="qr-caption">APONTE A CÂMERA<br>NO QR CODE E VISUALIZE.</div><div class="cover-qrs"><img src="${html(QR_A)}" alt="QR Code"><img src="${html(QR_B)}" alt="QR Code"></div><b class="client-caption">CLIENTE</b>${imageTag(clientLogo, 'Logo do cliente', 'cover-client-logo')}</div><div class="cover-right"><h1>LAUDO TÉCNICO DE<br>INSPEÇÃO SEGURANÇA<br>EM VASO DE PRESSÃO</h1><h2>CERTIFICADO DA<br>INSPEÇÃO DE SEGURANÇA</h2><div class="cover-tag">TAG: ${html(equipment.tag)}</div><div class="cover-date">INSPEÇÃO DE SEGURANÇA REALIZADA EM<strong>${html(shortDate(identification.inspectionDate))}</strong></div><div class="cover-expiry">O EQUIPAMENTO ESTÁ APTO A OPERAR ATÉ DESDE QUE<br>PERMANEÇA NAS CONDIÇÕES ATUAIS ATÉ A DATA DE:<strong>${html(shortDate(report.nextInspection?.recommendedDate || identification.expiresAt))}</strong></div><div class="cover-art">ART:${html(identification.artNumber)}</div><div class="cover-class">CLASSE ${html(equipment.fluidClass)} <i>|</i> GRUPO ${html(equipment.riskGroup)} <i>|</i> CATEGORIA ${html(equipment.nr13Category)}</div></div></section>`;
}

function titlePage(report: AnyRecord) {
  const client = report.client || {};
  const equipment = report.equipment || {};
  const identification = report.identification || {};
  const metadata = report.metadata || {};
  const clientLogo = imageSource(client.logoUrl || client.logo || metadata.clientLogoUrl, CLIENT_LOGO);
  return `<section class="page title-page"><div><b>Título:</b><h1>LAUDO TÉCNICO DE INSPEÇÃO PERIÓDICA PARA<br>ATENDIMENTO DA NR 13.</h1><b>Subtítulo:</b><p>Inspeção Periódica Exame Externo NR-13</p><h2>EQUIPAMENTO:</h2><p>${html(equipment.description || equipment.type)}<br>Fabricante: ${html(equipment.manufacturer)}<br><b>Série:</b> ${html(equipment.serialNumber)} - <b>TAG</b>-${html(equipment.tag)}</p><strong class="title-category">CAT.${html(equipment.nr13Category)}</strong><img class="equipment-diagram" src="${html(EQUIPMENT_DIAGRAM)}" alt="Pulverizador pressurizado"><h2>Cliente:</h2>${imageTag(clientLogo, 'Logo do cliente', 'title-client-logo')}<p>${html(client.city)}- ${html(client.state)}/ ${html(shortDate(identification.inspectionDate))}</p></div>${simpleFooter(report)}</section>`;
}

function simpleFooter(report: AnyRecord) {
  const equipment = report.equipment || {};
  const identification = report.identification || {};
  const metadata = report.metadata || {};
  return `<footer class="document-footer title-footer"><span>ART: ${html(identification.artNumber)}</span><span>${html(value(metadata.companySite, 'www.engenhariaeinspecoes.com.br'))}</span><span>ID_EGS_LAU_VP_${html(equipment.serialNumber)} /VERT/AR /${html(equipment.manufacturer)}_${html(equipment.tag)}</span></footer>`;
}

function indexPage(report: AnyRecord) {
  const lines = [
    ['1.', 'SOLICITANTE', '1'], ['2.', 'IDENTIFICAÇÃO DO VASO DE PRESSÃO', '1'], ['3.', 'DADOS DO VASO DE PRESSÃO', '1'], ['4.', 'DADOS DO PROJETO', '1'], ['5.', 'PRAZO DAS PRÓXIMAS INSPEÇÕES DE ACORDO COM NR-13', '1'], ['6.', 'CLASSIFICAÇÃO DO VASO DE PRESSÃO', '2'], ['7.', 'EMPRESA INSPETORA OU PROFISSIONAL LEGALMENTE HABILITADO', '2'], ['8.', 'ANÁLISE DOS DOCUMENTOS', '2'], ['9.', 'EXAMES REALIZADOS E ITENS INSPECIONADOS', '3'], ['9.1', 'EXAMES EXTERNOS E INTERNO', '3'], ['9.2', 'PLACA DE IDENTIFICAÇÃO', '3'], ['9.3', 'VÁLVULA DE SEGURANÇA', '3'], ['9.4', 'MANÔMETRO E TESTE DE ESTANQUEIDADE', '4'], ['9.5', 'VÁLVULA DE DESCARGA', '4'], ['9.6', 'EXAME INTERNO', '5'], ['10.', 'ENSAIO NÃO DESTRUTIVOS END E INSPEÇÃO', '5'], ['10.1', 'MEDIÇÃO DE ESPESSURA POR ULTRASSON', '5'], ['11.', 'EQUIPAMENTOS UTILIZADOS NA INSPEÇÃO', '7'], ['12.', 'RECOMENDAÇÕES NECESSÁRIAS', '7'], ['13.', 'CONCLUSÃO', '8'], ['14.', 'DATA PRÓXIMA INSPEÇÕES', '9'], ['15.', 'RESPONSABILIDADE TÉCNICA', '9'], ['', 'ANEXOS', '10'], ['', 'MODELO DE PLACA DE IDENTIFICAÇÃO', '11'], ['', 'CERTIFICADO DO APARELHO DE MEDIÇÃO DE ESPESSURA', '12;17'], ['', 'CERTIFICADO DE CALIBRAÇÃO DA VÁLVULA DE SEGURANÇA', '18'], ['', 'CERTIFICADO DE CALIBRAÇÃO DO MANÔMETRO', '19'], ['', 'ANOTAÇÃO DE RESPONSABILIDADE TÉCNICA (ART)', '20'],
  ];
  return `<section class="page index-page"><h1>ÍNDICE</h1><div class="index-lines">${lines.map(([numberPart, title, pageNumber]) => `<div class="index-line ${numberPart ? '' : 'subline'}"><span>${html(numberPart)} ${html(title)}</span><i></i><b>${html(pageNumber)}</b></div>`).join('')}</div>${simpleFooter(report)}</section>`;
}

function pageThreeContent(report: AnyRecord) {
  const client = report.client || {};
  const equipment = report.equipment || {};
  const identification = report.identification || {};
  const nextInspection = report.nextInspection?.recommendedDate || identification.expiresAt;
  const projectRows = tableRows([
    ['3.1 - TIPO DE FLUIDO', equipment.fluidType],
    ['3.2 - VOLUME INTERNO', equipment.volumeLiters ? numeric(Number(equipment.volumeLiters) / 1000, 3) + ' m³' : '-'],
    ['3.3 - PRESSÃO OPERAÇÃO', numeric(equipment.operatingPressureBar) + ' [Kgf/cm²]'],
    ['3.4 - PRESSÃO DE MÁXIMA DE TRABALHO ADMISSÍVEL (PMTA)', numeric(equipment.mawpBar) + ' [Kgf/cm²]'],
    ['3.5 - PRESSÃO DE TESTE HIDROSTÁTICO (PTH)', numeric(equipment.hydroTestPressureBar) + ' [Kgf/cm²]'],
    ['3.6 - TEMPERATURA MÁXIMA DE PROJETO', numeric(equipment.designTempC) + ' [°C]'],
    ['3.7 - OPERA VÁCUO?', equipment.operatesUnderVacuum ? 'Sim' : 'Não'],
    ['3.8 - TAMPO SUPERIOR', value(equipment.headMaterial) + ' {' + numeric(equipment.headNominalThicknessMm) + 'mm' + String.fromCharCode(125)],
    ['3.9 - TAMPO INFERIOR', value(equipment.headMaterial) + ' {' + numeric(equipment.headNominalThicknessMm) + 'mm' + String.fromCharCode(125)],
    ['3.10 - CASCO', value(equipment.bodyMaterial) + ' {' + numeric(equipment.originalThicknessMm) + 'mm' + String.fromCharCode(125)],
  ]);
  return [
    band('SOLICITANTE'),
    '<div class="client-lines"><p><b>CLIENTE:</b> ' + html(client.name) + ' <b>CNPJ:</b> ' + html(client.cnpj) + '</p><p><b>END:</b> ' + html(client.address) + ' <b>BAIRRO:</b> ' + html(client.neighborhood || client.district) + '</p><p><b>CIDADE:</b> ' + html(client.city) + ' <b>UF:</b> ' + html(client.state) + ' <b>CEP:</b>' + html(client.zipCode) + '</p></div>',
    band('1. IDENTIFICAÇÃO DO VASO DE PRESSÃO'),
    '<table class="strip-table"><tr><td><b>EQUIPAMENTO:</b> ' + html(equipment.description || equipment.type) + '</td><td><b>TAG:</b> ' + html(equipment.tag) + '</td></tr><tr><td><b>FABRICANTE:</b> ' + html(equipment.manufacturer) + '</td><td><b>FLUIDO:</b> ' + html(equipment.fluidType) + '</td><td><b>DATA DE FAB:</b> ' + html(equipment.manufactureDate || equipment.manufactureYear) + '</td></tr><tr><td colspan="2"><b>CÓDIGO DE PROJETO:</b> ' + html(equipment.designCode) + '</td><td><b>LOCAL DE INST:</b> ' + html(equipment.siteName) + '</td></tr><tr><td><b>NORMA:</b> NR-13</td></tr><tr class="yellow"><td colspan="3"><b>CATEGORIA DO VASO DE PRESSÃO</b> - NR13 <b>CLASSE</b> ' + html(equipment.fluidClass) + ' <b>GRUPO</b> ' + html(equipment.riskGroup) + ' <b>CAT.</b> ' + html(equipment.nr13Category) + '</td></tr></table>',
    band('2. DADOS DO VASO DE PRESSÃO'),
    '<table class="compact-table"><tr><td colspan="2"><b>CASCO:</b></td></tr><tr><td>2.1- COMPRIMENTO ENTRE SOLDAS: [mm] ' + html(equipment.lengthBetweenWeldsMm || equipment.lengthMm) + '</td><td>2.2- Nº DE SÉRIE: ' + html(equipment.serialNumber) + '</td></tr><tr><td>2.3- COMPRIMENTO TOTAL:[mm] ' + html(equipment.lengthMm) + '</td><td>2.4- FORMATO CILÍNDRICO: ' + html(equipment.orientation || 'Vertical') + '</td></tr><tr><td>2.5- DIÂMETRO INTERNO:[mm] ' + html(equipment.insideDiameterMm) + '</td><td>2.6- TIPO DE TAMPOS: ' + html(equipment.headType || 'Semi-Elípticos') + '</td></tr><tr><td colspan="2">2.7- TIPOS DE UNIÕES: ' + html(equipment.jointType || 'Soldada') + '</td></tr></table>',
    band('3. DADOS DO PROJETO'),
    '<p><b>CÓDIGO DE CONSTRUÇÃO E NORMAS ADICIONAIS:</b> ' + html(equipment.designCode) + '</p><table class="compact-table">' + projectRows + '</table>',
    band('4. PRAZO DAS PRÓXIMAS INSPEÇÕES DE ACORDO COM NR-13'),
    '<table class="schedule-table"><tr><th>EXAME VISUAL EXTERNO</th><th>EXAME INTERNO</th><th>MEDIÇÃO ESPESSURA P/ ULTRASSON</th><th>T. HIDROSTÁTICO</th></tr><tr><td>SIM</td><td>SIM</td><td>SIM</td><td>NÃO</td></tr><tr class="cyan"><th colspan="2">DATA DA INSPEÇÃO</th><th colspan="2">DATA DAS PRÓXIMAS INSPEÇÕES</th></tr><tr><td>CASCO: ' + html(shortDate(identification.inspectionDate)) + '</td><td>' + html(shortDate(identification.inspectionDate)) + '</td><td class="red">' + html(shortDate(nextInspection)) + '</td><td class="red">' + html(shortDate(nextInspection)) + '</td></tr><tr><td>TAMPO: ' + html(shortDate(identification.inspectionDate)) + '</td><td>' + html(shortDate(identification.inspectionDate)) + '</td><td class="red">' + html(shortDate(nextInspection)) + '</td><td class="red">' + html(shortDate(nextInspection)) + '</td></tr></table>',
  ].join('');
}

function annexDocumentPage(documents: AnyRecord[], terms: string[], title: string) {
  const attachment = findAttachment(documents, ...terms);
  const source = value(attachment?.url, '');
  const isImage = /^(data:image|https?:\/\/.*\.(?:png|jpe?g|webp)(?:\?.*)?$)/i.test(source) || /\.(?:png|jpe?g|webp)$/i.test(value(attachment?.name));
  const content = source && isImage ? `<img class="annex-image" src="${html(source)}" alt="${html(title)}">` : `<div class="annex-placeholder"><b>${html(title)}</b><p>${attachment ? `Arquivo anexado: ${html(attachment.name || attachment.originalName)}` : 'Documento ainda não anexado a esta inspeção.'}</p></div>`;
  return `<div class="annex-document-page"><h2>${html(title)}</h2>${content}${attachment ? `<p class="annex-file-name">Arquivo anexado: ${html(attachment.name || attachment.originalName)}</p>` : ''}</div>`;
}

function renderPages(report: AnyRecord) {
  const client = report.client || {};
  const equipment = report.equipment || {};
  const inspection = report.inspectionData?.inspection || {};
  const identification = report.identification || {};
  const documents = Array.isArray(report.attachments?.documents) ? report.attachments.documents : [];
  const photos = Array.isArray(report.attachments?.photos) ? report.attachments.photos : [];
  const measures = buildOfficialMeasurementPoints(Array.isArray(report.inspectionData?.measurements) ? report.inspectionData.measurements : []);
  const bodyValues = measures.slice(0, 10).filter((point) => point.value != null).map((point) => Number(point.value));
  const headValues = measures.slice(10).filter((point) => point.value != null).map((point) => Number(point.value));
  const nextInspection = report.nextInspection?.recommendedDate || identification.expiresAt;
  const companyName = value(report.metadata?.companyName, 'EDISON APARECIDO CORREIA-ME');
  const conclusion = value(report.technicalConclusion?.justification, `Conforme Norma ABNT NBR 15417 e NR-13 conclui-se que o Vaso de Pressão ${equipment.description || equipment.type} SERIE:${equipment.serialNumber} TAG:${equipment.tag} encontra-se APTO para prosseguir em operação até a data da próxima inspeção, desde que as exigências de melhorias e recomendações sejam atendidas.`);
  const fieldPhoto = photoSource(photos, 0, '');
  const platePhoto = photoSource(photos, 1, '');
  const valvePhotos = photoGrid(photos, [2, 3]);
  const gaugePhotos = photoGrid(photos, [4, 5]);
  const measurementPhotos = photoGrid(photos, [6, 7], 'measurement-photos');
  const checklistTable = table(['ITEM VERIFICADO EM CAMPO', 'RESULTADO'], [
    ['Acesso seguro para manutenção, operação e inspeção', fieldResult(report, 'externalAccess')],
    ['Saída ampla e permanentemente desobstruída', fieldResult(report, 'externalClearance')],
    ['Placa de identificação legível e visível', fieldResult(report, 'identificationPlate')],
    ['Válvula de segurança instalada e identificada', fieldResult(report, 'safetyValve')],
    ['Manômetro instalado e identificado', fieldResult(report, 'pressureGauge')],
    ['Teste de estanqueidade realizado', fieldResult(report, 'tightnessTest')],
    ['Iluminação adequada para inspeção', fieldResult(report, 'lighting')],
  ], 'checklist');
  return [
    reportCover(report),
    titlePage(report),
    indexPage(report),
    bodyPage(report, 3, pageThreeContent(report)),
    bodyPage(report, 4, `<p>A empresa ${html(client.name)} deve informar a <b>ENGSERV-ENGENHARIA E SERVIÇOS</b>, junto ao Profissional Legalmente Habilitado sempre que for executar qualquer reparo ou alteração que venha a comprometer a segurança do vaso de pressão, meio ambiente e colaboradores.</p><p>${html(NR13_STANDARD_TEXT.inspectionScope)}</p>${band('5. CLASSIFICAÇÃO DO VASO DE PRESSÃO')}<p>Os vasos de pressão são classificados em categorias segundo o tipo de fluído e o potencial em função do produto P.V onde P é a pressão máxima de operação em Mpa e V é o volume geométrico interno em m³ (Item 13.5.1.2).</p>${table(['FLUÍDO DE SERVIÇO', 'CLASSE DO FLUÍDO', 'GRUPO POT. DE RISCO', 'CATEGORIA'], [[equipment.fluidType, `Classe ${equipment.fluidClass}`, `Grupo ${equipment.riskGroup}`, equipment.nr13Category]], 'yellow-table')}${table(['TIPO DE VASO DE PRESSÃO', 'TIPO DE INSPEÇÃO EXECUTADA'], [[equipment.description || equipment.type, value(inspection.type, 'INSPEÇÃO EXTERNA E INTERNA')]], 'blue-table')}${band('6. EMPRESA INSPETORA OU PROFISSIONAL LEGALMENTE HABILITADO')}<table class="strip-table"><tr><td colspan="2"><b>EMPRESA:</b> ${html(companyName)}</td><td><b>CNPJ:</b> ${html(report.metadata?.companyCnpj)}</td><td><b>IE:</b> ${html(report.metadata?.companyIe)}</td></tr><tr><td colspan="2"><b>END:</b> ${html(report.metadata?.companyAddress)}</td><td colspan="2"><b>BAIRRO:</b> ${html(report.metadata?.companyNeighborhood)}</td></tr><tr><td><b>CIDADE:</b> CASTILHO</td><td><b>CEP:</b> 16920-300</td><td colspan="2"><b>ESTADO:</b> SÃO PAULO</td></tr><tr><td colspan="2"><b>PLH RESPONSÁVEL:</b> ${html(identification.engineerName || identification.inspectorName)}</td><td colspan="2"><b>CREA SP:</b> ${html(identification.crea)}</td></tr><tr><td colspan="4"><b>CONTATO:</b> ${html(report.metadata?.companyPhone)} <b>e-mail:</b> ${html(report.metadata?.companyEmail)}</td></tr></table>${band('7. ANÁLISE DOS DOCUMENTOS')}${documentChecklist(documents)}`),
    bodyPage(report, 5, `${band('8. EXAMES REALIZADOS')}<h3>8.1- EXAME EXTERNO</h3><p>8.1.1- Vaso encontra-se instalado em ${html(equipment.siteName, 'local informado no cadastro')}.</p><p>8.1.2- Dispõe de uma saída ampla e permanentemente desobstruída;</p><p>8.1.3- Dispõe de acesso fácil e seguro para as atividades de manutenção, operação e inspeção;</p><p>8.1.4- ${fieldResult(report, 'lighting') === 'SIM' ? 'Dispõe de iluminação conforme norma vigente NR-10.' : 'Não dispõe de iluminação conforme norma vigente NR-10.'}</p>${checklistTable}${fieldPhoto ? `<div class="photo-frame single"><img src="${html(fieldPhoto)}" alt="Exame externo"></div>` : ''}${band('8.2- Placa de Identificação', 'cyan')}<p>8.2.1-[PLA] O vaso de pressão ${fieldResult(report, 'identificationPlate') === 'SIM' ? 'possui' : 'não possui'} placa de identificação</p><p>8.2.2- Quando não existente providenciar a confecção de nova placa de identificação e instalar em local de fácil visualização conforme item 13.5.1.</p>${platePhoto ? `<div class="photo-frame single"><img src="${html(platePhoto)}" alt="Placa de identificação"></div>` : ''}`),
    bodyPage(report, 6, `${band('8.3- Válvula de Segurança', 'blue')}<p><b>8.3.1- [PSV]</b> O vaso possui uma válvula de segurança tipo mola, instalada e aferida, e está em conformidade com a PMTA do vaso de acordo com o item 13.5.1.3a).</p>${valvePhotos}${band('8.4- Manômetro e Teste de Estanqueidade', 'blue')}<p>8.4.1- O manômetro instalado é do tipo seco com escala compatível com a pressão de operação.</p><p>8.4.2- Teste estanqueidade: Pressão de teste: [${numeric(equipment.hydroTestPressureBar)}] kgf/cm² &nbsp; Tempo de teste: 30 minutos</p>${gaugePhotos}`),
    bodyPage(report, 7, `${band('9. ENSAIO NÃO DESTRUTIVOS-END E INSPEÇÃO')}<h3>9.1- MEDIÇÃO DE ESPESSURA DE CHAPA POR ULTRASSOM</h3><p>Ensaio realizado na externa do equipamento, utilizando-se o aparelho ${html(report.inspectionData?.equipmentUsed, 'MITECH MT190')}, com cabeçote e velocidade de ensaio registrados na ficha de campo. Os registros obtidos estão registrados na tabela em anexos.</p><p><b>As espessuras mínimas encontradas foram as seguintes:</b></p><div class="minima"><b>Casco: ........ Min ................ Máx.</b><b>Tampos: ........ Min ................ Máx.</b><strong>${numeric(minimum(bodyValues))}[mm] ........ ${numeric(maximum(bodyValues))}[mm] &nbsp;&nbsp;&nbsp; ${numeric(minimum(headValues))}[mm] ........ ${numeric(maximum(headValues))}[mm]</strong></div><div class="register-line"><b>Registro:</b> ${measures.length} [unid] <b>Anos de Operação:</b> ${html(report.engineeringResults?.yearsOfOperation, '07')} <b>Taxa de Corrosão:</b> ${numeric(report.engineeringResults?.corrosionRate?.value, 3)}</div><hr><p>A integridade do Vaso Pressão foi analisada pelo ensaio de ultrassom, onde apresentou espessuras uniformes, não sendo detectado perdas de espessura significativa para calcular nova PMTA, portanto nenhum resultado determinante para uma condenação ou reparo no equipamento.</p><p>Todo o vaso deve ser medido nos pontos de controle de registro de medições e seu mapeamento. Se uma perda excessiva de espessura for detectada, novos pontos devem ser acrescentados a pesquisa.</p><p>A medição de espessura deve seguir uma periodicidade definida pelo PLH.</p><h3>MAPA DE MEDIÇÃO DE CHAPA POR ULTRASSOM</h3><div class="map-diagram"><img src="${html(EQUIPMENT_DIAGRAM)}" alt="Mapa de medição"></div>`),
    bodyPage(report, 8, `${band('MAPA DE MEDIÇÃO DE ESPESSURA')}<div class="map-table-wrap">${measurementMap(report)}</div>${measurementPhotos}${band('CALCULO DE VIDA UTIL DO VASO DE PRESSÃO', 'cyan')}${table(['ID', 'LOCAL', 'ESP. MIN. REQ.', 'MIN. ENCONTRADA', 'TX. CORROSÃO', 'SOBRE ESPESSURA', 'VD. REMANESCENTE'], [['1', 'Tp.Dir.', `${numeric(equipment.minThicknessMm)} mm`, `${numeric(minimum(bodyValues))} mm`, numeric(report.engineeringResults?.corrosionRate?.value, 3), numeric(report.engineeringResults?.integrityAnalysis?.marginMm), `${numeric(report.engineeringResults?.remainingLife?.value, 0)} anos`], ['2', 'Corpo', `${numeric(equipment.minThicknessMm)} mm`, `${numeric(minimum(bodyValues))} mm`, numeric(report.engineeringResults?.corrosionRate?.value, 3), numeric(report.engineeringResults?.integrityAnalysis?.marginMm), `${numeric(report.engineeringResults?.remainingLife?.value, 0)} anos`], ['3', 'Tp.Esq.', `${numeric(equipment.minThicknessMm)} mm`, `${numeric(minimum(headValues))} mm`, numeric(report.engineeringResults?.corrosionRate?.value, 3), numeric(report.engineeringResults?.integrityAnalysis?.marginMm), `${numeric(report.engineeringResults?.remainingLife?.value, 0)} anos`]], 'yellow-table')}<p class="small"><b>NOTA:</b> Unidade de medida em milímetros(mm)</p><div class="result-status"><b>RESULTADO DAS MEDIÇÕES DE ESPESSURAS</b><strong>${report.engineeringResults?.reliability === 'THEORETICAL' ? 'ESTIMATIVA TÉCNICA' : 'APROVADO'}</strong><p>${html(conclusion)}</p></div><p class="adoption-note">${html(REGIONAL_ADOPTION_NOTE)}</p>`),
    bodyPage(report, 9, `${band('10. EQUIPAMENTOS UTILIZADOS NA INSPEÇÃO', 'cyan')}${table(['APARELHO / Nº SÉRIE', 'ACOPLANTE', 'PROCEDIMENTO', 'BLOCO DE REFERÊNCIA', 'TEMP. SUPERFÍCIE (°C)'], [[html(report.inspectionData?.equipmentUsed, 'MT-190 MT0123071411'), 'EXOSEN 20', 'EGS-PR-020', 'ESCALONADO', 'AMBIENTE']], 'equipment-table')}${table(['EVENTOS', 'SUPERFÍCIE', 'CABEÇOTE', 'VELOCIDADE SÔNICA', 'ESP / BL.PADRÃO'], [['EXTERNO/INTERNO', 'PREPARADA', 'PSEE 10MHZ', '5.920 M/S.', '3,25 - 25,4mm / BL-02']], 'equipment-table')}${table(['CAMERA', 'MARCA', 'SÉRIE', 'MONITOR', 'MODELO'], [['SCREEN', 'ENDOSCOPE', 'SCH-10024', '9"', 'INDUSTRIAL']], 'equipment-table')}${band('11- RECOMENDAÇÕES NECESSÁRIAS', 'cyan')}<table class="recommendations">${recommendations(report)}</table>`),
    bodyPage(report, 10, `${table(['', ''], [['e)', 'possuir sistema de iluminação de emergência; 13.5.2.3 Quando o vaso de pressão for instalado em ambientes abertos, a instalação deve satisfazer as alíneas aplicáveis.'], ['12.6-', 'Caberá ao usuário final do equipamento, manter identificada a documentação específica de acordo com a norma NR - 13 do MTE;'], ['12.7 -', 'Providenciar e/ou deixar disponível o projeto de instalação, conforme NR 13.5.2.5.'], ['12.8-', 'Manter o reservatório despressurizado no final do trabalho;']], 'recommendation-continuation')}${band('12- CONCLUSÃO', 'cyan')}<table class="narrative"><tbody>${['Atendendo as determinações técnicas constantes nas NBR 222 da Associação Brasileira de Normas Técnicas-ABNT e Norma Regulamentadora NR-13.', 'Procedeu-se a Inspeção externa, Medição de espessura por ultrassom e inspeção interna por imagem no Vaso de Pressão.', '[TH] Teste Hidrostático: foi apresentada documentação na fase de fabricação do vaso. O PLH avaliou a necessidade conforme o histórico operacional.', 'Conforme exigido pela norma NR-13 o vaso de pressão deve possuir placa de identificação legível e indelével, estar em local visível e de fácil acesso.', 'Havendo ocorrência de vazamento, incêndio ou explosão envolvendo equipamentos abrangidos na NR-13, o empregador deve comunicar ao órgão regional competente.'].map((item) => '<tr><td>' + html(item) + '</td></tr>').join('')}</tbody></table>`),
    bodyPage(report, 11, `<div class="conclusion-box"><b>Conforme Norma ABNT NBR 15417 e NR-13 conclui-se que o Vaso de Pressão ${html(equipment.description || equipment.type)} SERIE:${html(equipment.serialNumber)} TAG:${html(equipment.tag)} encontra-se <span>APTO</span> para prosseguir em operação até a data da próxima inspeção, desde que as exigências de melhorias e recomendações escritas neste documento sejam todas atendidas.</b></div>${band('13- DATA PARA PRÓXIMA INSPEÇÃO', 'cyan')}<p>Deverá ser realizada nova inspeção (Externa) 24 (vinte quatro) meses a partir da emissão deste documento.</p><p>Caso seja feita alguma manutenção com solda ou alterando a característica do Vaso de Pressão, este laudo perderá sua validade, sendo necessária nova inspeção e realização de teste hidrostático.</p>${table(['EXAME EXTERNO', 'EXAME INTERNO', 'ESTANQUEIDADE', 'TESTE HIDROSTÁTICO'], [['REALIZADO', 'REALIZADO', 'REALIZADO', 'REALIZADO'], [shortDate(identification.inspectionDate), shortDate(identification.inspectionDate), shortDate(identification.inspectionDate), '******']], 'inspection-result')}${band('14. RESPONSABILIDADE TÉCNICA', 'cyan')}<div class="signature"><b>${html(identification.engineerName || identification.inspectorName, 'EDISON AP CORREIA')}</b><br>ENGENHEIRO MECÂNICO<br>ENGENHEIRO DE SEGURANÇA DO TRABALHO<br>ENGENHEIRO DE INSPEÇÃO E DIMENSIONAMENTO CONFORME -NR13<br>CREA/SP: ${html(identification.crea)}<br><br><strong>ART:${html(identification.artNumber)}</strong></div>`),
    annexTitlePage(report, 12, 'I', 'PLACA DE IDENTIFICAÇÃO DO VASO DE PRESSÃO'),
    bodyPage(report, 13, `<div class="plate-card">${imageTag(client.logoUrl || client.logo || report.metadata?.clientLogoUrl, 'Logo do cliente', 'plate-client-logo', CLIENT_LOGO)}<table class="data-table plate-table">${tableRows([['CÓDIGO DE LOCALIZAÇÃO', equipment.tag], ['DESCRIÇÃO', equipment.description || equipment.type], ['SÉRIE', equipment.serialNumber], ['CÓDIGO DE PROJETO', equipment.designCode], ['PRESSÃO DE PROJETO', `${numeric(equipment.designPressureBar)} Kgf/cm²`], ['TEMPERATURA DE PROJETO', `${numeric(equipment.designTempC)}°C`], ['PRESSÃO OPERAÇÃO', `${numeric(equipment.operatingPressureBar)} Kgf/cm²`], ['TEMPERATURA DE OPERAÇÃO', `${numeric(equipment.operatingTempC)}°C`], ['PRESSÃO MAX. TRAB. ADMISSÍVEL', `${numeric(equipment.mawpBar)} Kgf/cm²`], ['TAMPO', equipment.headType], ['PRESSÃO TESTE HIDROSTÁTICO', `${numeric(equipment.hydroTestPressureBar)} Kgf/cm²`], ['ESPESSURA NOMINAL CASCO', `${numeric(equipment.originalThicknessMm)}mm`], ['ESPESSURA NOMINAL TAMPOS', `${numeric(equipment.headNominalThicknessMm)}mm`], ['VOLUME', `${numeric(equipment.volumeLiters, 1)} LITROS`], ['FLUIDO', equipment.fluidType], ['FABRICANTE', equipment.manufacturer], ['ANO DE FABRICAÇÃO', equipment.manufactureYear]])}</table><div class="plate-company"><b>EMPRESA DE INSPEÇÃO</b><br>ENGSERV- ENGENHARIA E SERVIÇOS<br>CNPJ: ${html(report.metadata?.companyCnpj)}<br>${html(value(report.metadata?.companySite, 'WWW.ENGENHARIAEINSPECOES.COM.BR'))}</div></div>`),
    annexTitlePage(report, 14, 'II', 'CERTIFICADO APARELHO MEDIÇÃO DE ESPESSURA POR ULTRASSOM'),
    bodyPage(report, 15, annexDocumentPage(documents, ['ultrassom', 'espessura', 'medidor'], 'CERTIFICADO DE CALIBRAÇÃO DE MEDIDOR DE ESPESSURA POR ULTRASSOM')),
    bodyPage(report, 16, annexDocumentPage(documents, ['ultrassom', 'espessura', 'medidor'], 'MEDIÇÃO DAS DISTÂNCIAS')),
    bodyPage(report, 17, annexDocumentPage(documents, ['ultrassom', 'espessura', 'medidor'], 'ANEXO I - MEDIÇÕES')),
    annexTitlePage(report, 18, 'III', 'CERTIFICADO RBC INMETRO DO MANÔMETRO DIGITAL PADRÃO'),
    annexTitlePage(report, 19, 'IV', 'CERTIFICADO DA BOMBA COMPARATIVA DE CALIBRAÇÃO'),
    bodyPage(report, 20, annexDocumentPage(documents, ['bomba', 'comparativa'], 'CERTIFICADO DA BOMBA COMPARATIVA DE CALIBRAÇÃO')),
    annexTitlePage(report, 21, 'V', 'CERTIFICADO DE CALIBRAÇÃO MANOMETRO'),
    bodyPage(report, 22, annexDocumentPage(documents, ['manometro', 'manômetro', 'calibração'], 'CERTIFICADO DE CALIBRAÇÃO DO MANÔMETRO')),
    annexTitlePage(report, 23, 'VI', 'CERTIFICADO DE AFERIÇÃO PSV'),
    bodyPage(report, 24, annexDocumentPage(documents, ['valvula', 'válvula', 'psv'], 'CERTIFICADO DE CALIBRAÇÃO PSV')),
    annexTitlePage(report, 25, 'VII', 'ANOTAÇÃO DE RESPONSABILIDADE TÉCNICA(ART)'),
    bodyPage(report, 26, annexDocumentPage(documents, ['art', 'responsabilidade'], 'ANOTAÇÃO DE RESPONSABILIDADE TÉCNICA - ART')),
    bodyPage(report, 27, annexDocumentPage(documents, ['art', 'responsabilidade'], 'ANOTAÇÃO DE RESPONSABILIDADE TÉCNICA - ART')),
    bodyPage(report, 28, annexDocumentPage(documents, ['art', 'responsabilidade'], 'ANOTAÇÃO DE RESPONSABILIDADE TÉCNICA - ART')),
  ];
}

export function renderOfficialNr13Html(report: TechnicalReport): string {
  const pages = renderPages(report as AnyRecord);
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Laudo NR-13 ${html(report.identification?.reportNumber)}</title><style>${OFFICIAL_CSS}${COVER_OVERRIDES}</style></head><body>${pages.join('')}</body></html>`;
}

const COVER_OVERRIDES = `.cover-right{background:#39b7dc!important}.cover-right:after{display:none!important}`;

const OFFICIAL_CSS = `
@page{size:A4;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#e7e7e7;color:#080808;font-family:Arial,Helvetica,sans-serif;font-size:10.2px}body{font-weight:400}.page{position:relative;width:210mm;height:297mm;background:#fff;border:1px solid #111;overflow:hidden;page-break-after:always}.page main{padding:3.2mm 6.2mm 13mm}.body-page{padding:0 1mm}.document-header{width:100%;height:35mm;border-collapse:collapse;border:1px solid #111;table-layout:fixed}.document-header td{border:1px solid #111;vertical-align:middle}.header-client{width:29%;text-align:center}.header-client .client-logo{max-width:53mm;max-height:27mm}.header-title{width:42%;text-align:center;font-size:10px;line-height:1.55}.header-title b{display:block;font-size:10px;margin-bottom:3px}.header-title strong{display:block;font-size:12px}.header-meta{width:29%;display:grid;grid-template-columns:1fr 1fr;align-items:center;text-align:center;font-size:9px}.header-meta div{grid-column:1 / -1;padding:2mm}.engserv-logo{width:49mm;max-height:15mm;object-fit:contain}.document-footer{position:absolute;left:12mm;right:12mm;bottom:5.2mm;display:flex;justify-content:space-between;gap:4mm;font-size:7.8px;white-space:nowrap}.cover-page{border:3px solid #050505;display:grid;grid-template-columns:34% 66%;background:#fff}.cover-left{border-right:3px solid #050505;border-radius:13px 0 0 13px;padding:13mm 3mm 5mm;display:flex;flex-direction:column;align-items:center;gap:2mm}.cover-brand{display:flex;flex-direction:column;align-items:center;gap:3mm;color:#0060a3;font-size:9.2px;text-align:center}.cover-engserv-logo{width:47mm;max-height:30mm;object-fit:contain}.nr13{width:47mm;height:47mm;background:#ffd91c;border:3px solid #050505;transform:rotate(45deg);border-radius:6px;margin:12mm 0 8mm;display:flex;flex-direction:column;align-items:center;justify-content:center}.nr13 span,.nr13 strong{transform:rotate(-45deg);font-weight:900;line-height:.8}.nr13 span{font-size:22px}.nr13 strong{font-size:42px;color:#e11919}.qr-caption{font-size:8px;font-weight:800;text-align:center;margin-top:4mm}.cover-qrs{display:flex;flex-direction:column;gap:1mm}.cover-qrs img{width:37mm;height:37mm;object-fit:contain;border:1px solid #ddd;border-radius:4px}.client-caption{font-size:11px;margin-top:0}.cover-client-logo{width:42mm;max-height:20mm;object-fit:contain}.cover-right{padding:15mm 6mm 5mm;text-align:center;background:linear-gradient(100deg,#fff 0%,#fff 56%,#d9f4fb 57%,#48bfe4 75%,#0f6e98 100%);position:relative}.cover-right:after{content:"";position:absolute;inset:0;background:linear-gradient(122deg,transparent 52%,rgba(255,255,255,.5) 53%,transparent 55%,transparent 63%,rgba(255,255,255,.25) 64%,transparent 67%);pointer-events:none}.cover-right>*{position:relative;z-index:1}.cover-right h1{font-size:18px;line-height:1.3;margin:6mm 0 14mm}.cover-right h2{font-size:15px;line-height:1.18;margin:0 0 20mm}.cover-tag{background:#fff;border:1px solid #ddd;border-radius:7px;padding:7mm 3mm;font-size:24px;font-weight:900;text-align:left;margin-bottom:32mm}.cover-date,.cover-expiry{font-size:11px;font-weight:800}.cover-date strong,.cover-expiry strong{display:block;font-size:17px;margin-top:5mm}.cover-expiry strong{margin-top:7mm}.cover-art{font-size:17px;font-weight:900;margin:10mm 0 7mm}.cover-class{border:2px solid #111;border-radius:4px;padding:5mm 2mm;font-size:13px;font-weight:900;background:rgba(255,255,255,.75)}.cover-class i{font-style:normal;padding:0 4mm}.title-page{padding:6mm 11mm 0;text-align:center;font-size:11px}.title-page h1{font-size:18px;line-height:1.3;margin:7mm 0}.title-page p{font-size:13px;line-height:1.6;margin:3mm}.title-page h2{font-size:15px;margin:5mm 0 2mm}.title-category{display:inline-block;background:#ffc000;font-size:24px;padding:3mm;margin:3mm}.equipment-diagram{display:block;width:155mm;height:68mm;object-fit:contain;margin:10mm auto 3mm}.title-client-logo{max-width:72mm;max-height:28mm;object-fit:contain}.title-footer{left:14mm;right:14mm}.index-page{padding:19mm 12mm}.index-page h1{text-align:center;font-size:18px;margin:0 0 17mm}.index-lines{display:flex;flex-direction:column;gap:4.2mm}.index-line{display:flex;align-items:baseline;gap:2mm;font-size:11px;font-weight:700}.index-line.subline{font-weight:400;padding-left:6mm}.index-line i{flex:1;border-bottom:2px dotted #111}.index-line b{min-width:10mm;text-align:right}.band{margin:3mm 0 2mm;padding:1.7mm 1mm;background:#dbe8f5;border-bottom:3px solid #111;text-align:center;font-weight:900;font-size:13px;line-height:1.1}.band.cyan{background:#20d0e5}.band.blue{background:#dbe8f5}.client-lines p{display:flex;justify-content:space-between;margin:3mm 2mm;font-size:10.5px}.data-table,.strip-table,.compact-table,.schedule-table{width:100%;border-collapse:collapse;margin:1.5mm 0 2.2mm}.data-table th,.data-table td,.strip-table td,.compact-table td,.schedule-table th,.schedule-table td{border:1px solid #777;padding:1.2mm 1.5mm;vertical-align:middle}.data-table th{background:#d9d9d9;font-weight:900}.strip-table td,.compact-table td{font-size:9.8px}.strip-table td{padding:1mm}.compact-table td{padding:1mm}.data-table th{font-size:9.8px}.data-table td{font-size:9.5px}.yellow,.yellow-table tbody td{background:#ffff00;font-weight:900}.blue-table thead th,.blue-table tbody td{background:#dbe8f5;text-align:center}.checklist td:nth-child(2){text-align:center;font-weight:900}.schedule-table th,.schedule-table td{text-align:center}.schedule-table .cyan{background:#20d0e5}.red{color:#e11;font-weight:900}.small{font-size:8px}.photo-frame{border:1px solid #111;padding:2mm;margin:3mm 1mm}.photo-frame.single img{width:100%;height:64mm;object-fit:cover}.photo-grid{display:grid;grid-template-columns:1fr 1fr;gap:3mm;margin:3mm 1mm}.photo-grid figure{margin:0;border:1px solid #111;padding:2mm}.photo-grid img{width:100%;height:62mm;object-fit:cover}.photo-grid figcaption{font-size:7px;text-align:center}.photo-empty,.annex-placeholder{border:1px solid #777;min-height:60mm;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;color:#555;margin:6mm}.minima{display:grid;grid-template-columns:1fr 1fr;gap:3mm;margin:4mm 0}.minima b,.minima strong{display:block;text-align:center}.register-line{display:flex;justify-content:space-around;border-bottom:3px solid #111;padding:2mm 0}.map-diagram{border:1px solid #111;height:74mm;padding:2mm}.map-diagram img{width:100%;height:100%;object-fit:contain;filter:hue-rotate(130deg) saturate(.7)}.map-table-wrap{max-height:58mm;overflow:hidden}.measurement-list{font-size:8px}.measurement-list th,.measurement-list td{padding:.8mm;text-align:center}.measurement-list th{background:#dbe8f5}.measurement-list tr:nth-child(even) td{background:#e4f4d8}.measurement-matrix td{text-align:center}.measurement-photos img{height:42mm}.equipment-table th,.equipment-table td{text-align:center;padding:1.7mm;font-size:8.5px}.recommendations{width:100%;border-collapse:collapse}.recommendations td,.recommendation-continuation td{border:1px solid #777;padding:2.2mm;line-height:1.45;font-size:10px}.recommendation-continuation{width:100%;border-collapse:collapse;margin-top:2mm}.narrative{width:100%;border-collapse:collapse}.narrative td{border:1px solid #777;padding:2.5mm;font-size:10.5px;line-height:1.42}.result-status{border:1px solid #111;margin-top:2mm;text-align:center}.result-status>b{display:block;background:#ffff00;padding:1.5mm}.result-status>strong{display:block;background:#08b64e;padding:2.5mm;font-size:15px}.result-status p{background:#42d65b;padding:4mm;margin:0;font-size:11px}.adoption-note{font-size:8px;font-style:italic}.conclusion-box{border:2px solid #111;background:#13d3ab;padding:4mm;line-height:1.55;font-size:11px}.conclusion-box span{color:#e11}.inspection-result th{background:#20d0e5;text-align:center}.inspection-result td{text-align:center;background:#ddd;font-weight:700}.signature{text-align:center;margin-top:16mm;font-size:10px;line-height:1.4}.signature>b{display:block;border-top:2px solid #111;padding-top:1mm;margin:0 auto 2mm;width:60%;font-size:13px}.signature strong{display:block;font-size:17px;margin-top:12mm}.annex-title-page{height:245mm;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:5mm;text-align:center}.annex-title-page>b{font-size:18px}.annex-title-page>u{font-size:18px;font-weight:900}.annex-title-page .band{width:100%;font-size:16px;padding:3mm;margin-top:3mm}.plate-card{width:165mm;margin:8mm auto;border:1px solid #777;padding:3mm}.plate-client-logo{display:block;width:65mm;max-height:23mm;object-fit:contain;margin:0 auto 3mm}.plate-card .data-table th{width:44%;background:#eee}.plate-card .data-table td{color:#0074c5;font-weight:900;text-align:center}.plate-company{background:#ffbf00;text-align:center;padding:2mm;font-size:10px;line-height:1.45;margin-top:3mm}.annex-document-page{text-align:center;padding-top:9mm}.annex-document-page h2{font-size:16px;margin:3mm 0 8mm}.annex-image{max-width:100%;max-height:214mm;object-fit:contain}.annex-placeholder{min-height:170mm;font-size:15px}.annex-placeholder p{font-size:10px}@media print{html,body{background:#fff}.page{margin:0;border:1px solid #111}}`;
