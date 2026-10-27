import type { TechnicalReport } from '@/modules/report/types';
import { buildOfficialMeasurementPoints, REGIONAL_ADOPTION_NOTE } from '@/modules/report/measurements/regional-adoption';

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

function measurementGrid(report: AnyRecord) {
  const measurements = Array.isArray(report.inspectionData?.measurements) ? report.inspectionData.measurements : [];
  const points = buildOfficialMeasurementPoints(measurements);
  const cells = points.map((point) => `<td><b>${point.label}</b><br>${point.value == null ? '-' : number(point.value)}${point.measured ? '' : point.value == null ? '' : '*'}</td>`);
  return `<table class="measurements"><tr><th colspan="10">CASCO - 10 PONTOS</th></tr><tr>${cells.slice(0, 5).join('')}</tr><tr>${cells.slice(5, 10).join('')}</tr><tr><th colspan="8">TAMPOS - 8 PONTOS</th></tr><tr>${cells.slice(10, 14).join('')}</tr><tr>${cells.slice(14, 18).join('')}</tr><tr><td colspan="18" class="adoption-note">${escapeHtml(REGIONAL_ADOPTION_NOTE)}</td></tr></table>`;
}

function pageHeader(report: AnyRecord, page: number, total: number) {
  const metadata = report.metadata || {};
  return `<table class="header"><tr><td>${image(metadata.clientLogoUrl, 'Logo do cliente', 'logo')}</td><td><b>LAUDO TECNICO DE INSPECAO PERIODICA<br>EM ATENDIMENTO NR-13</b></td><td>DOC: ${escapeHtml(report.identification?.reportNumber)}<br>PAGINA: ${page}/${total}<br>DATA: ${escapeHtml(date(report.identification?.inspectionDate))}</td></tr></table>`;
}

function page(content: string, report: AnyRecord, pageNumber: number, total: number) {
  return `<section class="page">${pageHeader(report, pageNumber, total)}${content}<footer>ART: ${escapeHtml(report.identification?.artNumber)} <span>${escapeHtml(text(report.metadata?.companySite, 'ENGSERV'))}</span></footer></section>`;
}

export function renderOfficialNr13Html(report: TechnicalReport): string {
  const data = report as AnyRecord;
  const client = data.client || {};
  const equipment = data.equipment || {};
  const inspection = data.inspectionData?.inspection || {};
  const nextInspection = data.nextInspection?.recommendedDate || data.identification?.expiresAt;
  const photos = Array.isArray(data.attachments?.photos) ? data.attachments.photos : [];
  const recommendations = Array.isArray(data.recommendations) ? data.recommendations : (data.recommendations?.immediate || []);
  const photoMarkup = photos.slice(0, 4).map((photo: AnyRecord) => `<figure>${image(photo.url, photo.caption || 'Foto da inspeção', 'photo')}<figcaption>${escapeHtml(photo.caption)}</figcaption></figure>`).join('');
  const recommendationMarkup = recommendations.map((item: AnyRecord) => `<li>${escapeHtml(item.description || item)}</li>`).join('');
  const equipmentRows = rows([
    ['Equipamento', equipment.description || equipment.type],
    ['TAG', equipment.tag],
    ['Fabricante / Fluido', text(equipment.manufacturer) + ' / ' + text(equipment.fluidType)],
    ['Codigo de projeto', equipment.designCode],
    ['Local de instalacao', equipment.siteName],
    ['Norma', 'NR-13'],
  ]);
  const projectRows = rows([
    ['Numero de serie', equipment.serialNumber],
    ['Pressao de projeto', equipment.designPressureBar ? number(equipment.designPressureBar) + ' bar' : '-'],
    ['Pressao de operacao', equipment.operatingPressureBar ? number(equipment.operatingPressureBar) + ' bar' : '-'],
    ['PMTA', equipment.mawpBar ? number(equipment.mawpBar) + ' bar' : '-'],
    ['Material do casco/tampos', text(equipment.bodyMaterial) + ' / ' + text(equipment.headMaterial)],
    ['Espessura nominal casco/tampos', number(equipment.originalThicknessMm) + ' / ' + number(equipment.headNominalThicknessMm) + ' mm'],
  ]);
  const clientRows = rows([
    ['Cliente', client.name],
    ['CNPJ', client.cnpj],
    ['Endereco', client.address],
    ['Cidade/UF', text(client.city) + ' / ' + text(client.state)],
  ]);
  const inspectionRows = rows([
    ['Tipo', inspection.type],
    ['Status', data.identification?.status],
    ['Data', date(data.identification?.inspectionDate)],
    ['Pontos registrados', (data.inspectionData?.measurements?.length || 0) + ' leituras reais / 18 posicoes no mapa'],
  ]);
  const conclusion = data.technicalConclusion?.justification || 'Conforme Norma ABNT NBR 15417 e NR-13, conclui-se que o equipamento ' + text(equipment.description || equipment.type) + ' TAG ' + text(equipment.tag) + ' foi inspecionado nas condicoes registradas neste documento.';
  const pages = [
    `<div class="cover"><div class="brand">${image(data.metadata?.inspectorLogoUrl, 'Logo EngeServ', 'inspector-logo')}</div><h1>LAUDO TECNICO DE<br>INSPECAO DE SEGURANCA<br>EM VASO DE PRESSAO</h1><h2>CERTIFICADO DA INSPECAO DE SEGURANCA</h2><div class="tag">TAG: ${escapeHtml(equipment.tag)}</div><p>Inspecao realizada em <b>${escapeHtml(date(data.identification?.inspectionDate))}</b></p><p>Proxima inspeção: <b>${escapeHtml(date(nextInspection))}</b></p><p>ART: <b>${escapeHtml(data.identification?.artNumber)}</b></p><p class="category">CLASSE ${escapeHtml(equipment.fluidClass)} | GRUPO ${escapeHtml(equipment.riskGroup)} | CATEGORIA ${escapeHtml(equipment.nr13Category)}</p></div>`,
    `<h2 class="title">LAUDO TECNICO DE INSPECAO PERIODICA PARA ATENDIMENTO DA NR-13</h2><div class="highlight">${escapeHtml(equipment.type)}<br>Fabricante: ${escapeHtml(equipment.manufacturer)}<br>Serie: ${escapeHtml(equipment.serialNumber)}<br>TAG: ${escapeHtml(equipment.tag)}</div><h3>Cliente</h3><p>${escapeHtml(client.name)}<br>${escapeHtml(client.address)}, ${escapeHtml(client.city)} - ${escapeHtml(client.state)}</p><div class="section-title">IDENTIFICACAO DO VASO DE PRESSAO</div><table>${equipmentRows}</table><div class="section-title">DADOS DO VASO E DO PROJETO</div><table>${projectRows}</table>`,
    `<div class="section-title">SOLICITANTE</div><table>${clientRows}</table><div class="section-title">MAPA DE MEDICAO DE ESPESSURA</div>${measurementGrid(data)}<div class="section-title green">PANORAMA DA INSPECAO</div><p>${escapeHtml(data.executiveSummary?.overview || inspection.notes || 'Inspecao realizada em campo com registro fotografico e medicoes de espessura.')}</p><table>${inspectionRows}</table>`,
    `<div class="section-title">REGISTRO FOTOGRAFICO</div><div class="photos">${photoMarkup || '<p>Nenhuma foto anexada.</p>'}</div><div class="section-title">RECOMENDACOES NECESSARIAS</div><ol>${recommendationMarkup || '<li>Manter os instrumentos de seguranca calibrados e o equipamento dentro das condicoes de operacao.</li>'}</ol><div class="section-title">CONCLUSAO</div><div class="conclusion">${escapeHtml(conclusion)}</div><div class="signature">${escapeHtml(data.identification?.engineerName || data.identification?.inspectorName)}<br>Responsavel tecnico<br>ART: ${escapeHtml(data.identification?.artNumber)}</div>`,
  ];
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Laudo NR-13 ${escapeHtml(data.identification?.reportNumber)}</title><style>${OFFICIAL_CSS}</style></head><body>${pages.map((content, index) => page(content, data, index + 1, pages.length)).join('')}</body></html>`;
}

const OFFICIAL_CSS = `@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;background:#eef1f5;color:#111;font:11px Arial,Helvetica,sans-serif}.page{position:relative;width:210mm;min-height:297mm;margin:0 auto 12px;padding:12mm 13mm 18mm;background:#fff;page-break-after:always;border:1px solid #111}.header{width:100%;height:24mm;border-collapse:collapse;margin-bottom:7mm}.header td{border:1px solid #111;padding:3mm;text-align:center;vertical-align:middle}.header td:first-child{width:25%}.header td:last-child{width:25%;font-size:9px;text-align:left}.logo{max-width:100%;max-height:18mm}.inspector-logo{max-width:70mm;max-height:25mm}.cover{text-align:center;padding-top:26mm}.cover h1{font-size:22px;line-height:1.35;margin:28mm 0 8mm}.cover h2{font-size:13px}.tag{display:inline-block;margin:18mm 0 8mm;padding:3mm 8mm;border:2px solid #111;background:#ffff00;font-size:25px;font-weight:700}.category{margin-top:18mm;font-size:15px;font-weight:700}.title{text-align:center;font-size:17px;margin:10mm 0}.highlight{text-align:center;font-size:15px;line-height:1.8}.section-title{margin:6mm 0 2mm;padding:2mm;background:#dbe7f5;border-bottom:2px solid #111;text-align:center;font-weight:700;font-size:12px}.section-title.green{background:#00d99b}.page table{width:100%;border-collapse:collapse}.page th,.page td{border:1px solid #111;padding:2mm;text-align:left}.page th{width:34%;background:#f2f2f2}.measurements th{text-align:center;width:auto}.measurements td{text-align:center;height:15mm;font-size:12px}.measurements .adoption-note{height:auto;text-align:left;font-size:9px;font-style:italic}.photos{display:grid;grid-template-columns:1fr 1fr;gap:4mm}.photos figure{margin:0;border:1px solid #111;padding:2mm;text-align:center}.photo{width:100%;height:62mm;object-fit:contain}.photos figcaption{min-height:5mm}.conclusion{padding:4mm;border:2px solid #111;background:#d9f5e8;font-size:12px;line-height:1.5}.signature{margin:24mm auto 0;padding-top:2mm;border-top:2px solid #111;width:70%;text-align:center;font-size:12px}footer{position:absolute;left:13mm;right:13mm;bottom:6mm;border-top:1px solid #111;padding-top:2mm;font-size:9px;font-weight:700}footer span{float:right}@media print{body{background:#fff}.page{margin:0;border:0}}`;
