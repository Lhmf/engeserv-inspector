/**
 * NR-13 Template — Main Orchestrator
 * 
 * Combina todos os módulos do template NR-13 em um relatório HTML completo.
 * 
 * Estrutura:
 *   TechnicalReport → HTML Template → Preview → PDF
 * 
 * Arquitetura modular:
 *   - Cada seção é um módulo independente
 *   - O template apenas consome dados preparados pelo TechnicalReport
 *   - Nenhuma regra de negócio é executada aqui
 */

import type { TechnicalReport } from '../../types';
import type { Nr13TemplateData, CompanyInfo } from './types';
import { renderCover } from './cover';
import { renderHeader } from './header';
import { renderTechnicalBand } from './technical-band';
import { renderEquipmentData } from './equipment-data';
import { renderStatusSummary } from './status-summary';
import { renderMeasurements } from './measurements';
import { renderPhotoRegister } from './photo-register';
import { renderConclusion, renderRecommendations } from './conclusion';
import { renderSignatures } from './signatures';
import { renderFooter } from './footer';

// ============================================================
// MAIN RENDER FUNCTION
// ============================================================

/**
 * Renderiza o Laudo Técnico NR-13 como HTML completo.
 * 
 * @param data - Dados do template (report + company)
 * @returns HTML completo do laudo pronto para preview ou conversão a PDF
 */
export function renderNr13Report(data: Nr13TemplateData): string {
  const { report, company } = data;
  const totalPages = estimatePageCount(report);

  const sections = [
    // Página 1 — Capa
    renderCover({ report, company }),

    // Página 2 — Identificação e Dados Técnicos
    `<div class="nr13-page nr13-content" data-page="2">
      ${renderHeader({ report, company, pageNumber: 2, totalPages })}
      ${renderEquipmentData({ report })}
      ${renderFooter({ report, company, pageNumber: 2, totalPages })}
    </div>`,

    // Página 3 — Status Geral e Resultados Técnicos
    `<div class="nr13-page nr13-content" data-page="3">
      ${renderHeader({ report, company, pageNumber: 3, totalPages })}
      ${renderStatusSummary({ report })}
      ${renderMeasurements({
        measurements: report.inspectionData.measurements,
        minThicknessMm: report.equipment.minThicknessMm,
        originalThicknessMm: report.equipment.originalThicknessMm,
      })}
      ${renderFooter({ report, company, pageNumber: 3, totalPages })}
    </div>`,

    // Página 4 — Registro Fotográfico
    `<div class="nr13-page nr13-content" data-page="4">
      ${renderHeader({ report, company, pageNumber: 4, totalPages })}
      ${renderPhotoRegister({ photos: report.attachments.photos })}
      ${renderFooter({ report, company, pageNumber: 4, totalPages })}
    </div>`,

    // Página 5 — Conclusão e Assinaturas
    `<div class="nr13-page nr13-content" data-page="5">
      ${renderHeader({ report, company, pageNumber: 5, totalPages })}
      ${renderRecommendations({ report })}
      ${renderConclusion({ report })}
      ${renderSignatures({ report })}
      ${renderFooter({ report, company, pageNumber: 5, totalPages })}
    </div>`,
  ];

  return sections.join('\n');
}

// ============================================================
// HTML WRAPPER (includes CSS)
// ============================================================

/**
 * Renderiza o relatório completo com CSS embutido, pronto para preview.
 */
export function renderNr13ReportWithStyles(data: Nr13TemplateData): string {
  const body = renderNr13Report(data);

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Laudo Técnico ${data.report.identification.reportNumber} — NR-13</title>
  <style>${NR13_STYLES}</style>
</head>
<body>
  <div class="nr13-report">
    ${body}
  </div>
</body>
</html>
  `.trim();
}

// ============================================================
// PAGE COUNT ESTIMATION
// ============================================================

function estimatePageCount(report: TechnicalReport): number {
  let pages = 5; // Base: cover + identification + status + photos + conclusion
  
  // Extra measurement pages if many measurements
  const measCount = report.inspectionData.measurements.length;
  if (measCount > 15) pages += Math.ceil((measCount - 15) / 15);
  
  // Extra photo pages
  const photoCount = report.attachments.photos.length;
  if (photoCount > 4) pages += Math.ceil((photoCount - 4) / 4);
  
  return pages;
}

// ============================================================
// CSS STYLES
// ============================================================

const NR13_STYLES = `
/* ============================================================
   NR-13 REPORT TEMPLATE — STYLES
   ============================================================ */

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 10pt;
  color: #1e293b;
  background: #f1f5f9;
  line-height: 1.4;
}

.nr13-report {
  max-width: 210mm;
  margin: 20px auto;
  background: white;
  box-shadow: 0 4px 24px rgba(0,0,0,0.1);
}

/* ---- PAGE ---- */
.nr13-page {
  width: 210mm;
  min-height: 297mm;
  padding: 50px 50px 60px 50px;
  position: relative;
  page-break-after: always;
  background: white;
}

.nr13-page:last-child { page-break-after: auto; }

/* ============================================================
   COVER PAGE
   ============================================================ */
.nr13-cover {
  padding: 0;
  display: flex;
  flex-direction: column;
}

.cover-brand-bar {
  background: #1a2744;
  padding: 24px 50px;
}

.cover-brand-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cover-logo-area {
  display: flex;
  align-items: center;
  gap: 16px;
}

.cover-logo-icon {
  width: 56px;
  height: 56px;
  background: rgba(255,255,255,0.15);
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  color: white;
}

.cover-logo-text { display: flex; flex-direction: column; }

.cover-company-name {
  color: white;
  font-size: 18px;
  font-weight: 700;
}

.cover-company-tagline {
  color: rgba(255,255,255,0.7);
  font-size: 11px;
}

.cover-doc-type {
  color: rgba(255,255,255,0.6);
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.cover-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 60px 50px;
}

.cover-title-block {
  text-align: center;
  margin-bottom: 30px;
}

.cover-title {
  font-size: 36px;
  font-weight: 700;
  color: #1a2744;
  line-height: 1.2;
  margin-bottom: 16px;
}

.cover-nr13-badge {
  display: inline-block;
  background: #1a2744;
  color: white;
  font-size: 20px;
  font-weight: 700;
  padding: 8px 24px;
  border-radius: 8px;
  letter-spacing: 3px;
}

.cover-divider {
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #1a2744 0%, #3b82f6 50%, #1a2744 100%);
  margin: 20px 0 30px;
}

.cover-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.cover-info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cover-info-label {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #64748b;
  font-weight: 600;
}

.cover-info-value {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.cover-info-value--large {
  font-size: 18px;
  font-family: 'Courier New', monospace;
  color: #1a2744;
}

.cover-info-sub {
  font-size: 11px;
  color: #64748b;
}

.cover-status-block {
  text-align: center;
  padding: 24px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  margin-top: 20px;
}

.cover-status-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #64748b;
  margin-bottom: 8px;
}

.cover-status-badge {
  font-size: 20px;
  font-weight: 700;
  padding: 8px 24px;
  border-radius: 8px;
  display: inline-block;
}

.cover-status-badge--green { background: #dcfce7; color: #15803d; border: 2px solid #bbf7d0; }
.cover-status-badge--yellow { background: #fef9c3; color: #a16207; border: 2px solid #fef08a; }
.cover-status-badge--red { background: #fee2e2; color: #b91c1c; border: 2px solid #fecaca; }
.cover-status-badge--gray { background: #f1f5f9; color: #475569; border: 2px solid #e2e8f0; }

.cover-footer {
  padding: 20px 50px;
  border-top: 2px solid #e2e8f0;
}

.cover-footer-line {
  height: 2px;
  background: #1a2744;
  margin-bottom: 12px;
}

.cover-footer-content {
  display: flex;
  gap: 24px;
  font-size: 9px;
  color: #64748b;
}

.cover-footer-contact {
  display: flex;
  gap: 24px;
  font-size: 9px;
  color: #94a3b8;
  margin-top: 4px;
}

/* ============================================================
   HEADER (Institutional — 3 zones)
   ============================================================ */
.nr13-header {
  border-bottom: 2px solid #1a2744;
  margin-bottom: 24px;
}

.header-zone1 {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 12px;
}

.header-logo-icon {
  width: 36px;
  height: 36px;
  background: #1a2744;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: white;
}

.header-logo-icon--sm { width: 28px; height: 28px; font-size: 11px; }

.header-logo-text { display: flex; flex-direction: column; }

.header-company {
  font-size: 13px;
  font-weight: 700;
  color: #1a2744;
}

.header-tagline {
  font-size: 9px;
  color: #64748b;
}

.header-zone2 {
  text-align: center;
  padding: 8px 0;
  margin-bottom: 12px;
}

.header-doc-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a2744;
  letter-spacing: 1px;
}

.header-doc-subtitle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 4px;
}

.header-nr13 {
  background: #1a2744;
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 4px;
  letter-spacing: 1px;
}

.header-equip-type {
  font-size: 11px;
  color: #64748b;
}

.header-zone3 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 8px 0;
}

.header-ctrl-item { display: flex; flex-direction: column; gap: 2px; }

.header-ctrl-label {
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #94a3b8;
}

.header-ctrl-value {
  font-size: 11px;
  font-weight: 600;
  color: #1e293b;
}

/* Technical Band */
.header-tech-band {
  display: flex;
  align-items: center;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px 16px;
  margin-top: 12px;
  gap: 0;
}

.tech-band-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 12px;
}

.tech-band-label {
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #94a3b8;
}

.tech-band-value {
  font-size: 11px;
  font-weight: 600;
  color: #1e293b;
}

.tech-band-sep {
  width: 1px;
  height: 28px;
  background: #cbd5e1;
  flex-shrink: 0;
}

/* Compact Header */
.nr13-header--compact {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
}

.header-compact-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-company-sm {
  font-size: 11px;
  font-weight: 600;
  color: #1a2744;
}

.header-compact-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 10px;
}

.header-compact-title {
  font-weight: 600;
  color: #1e293b;
}

.header-compact-sub {
  color: #94a3b8;
  font-size: 9px;
}

.header-page-num {
  font-size: 10px;
  color: #64748b;
}

/* ============================================================
   SECTIONS
   ============================================================ */
.nr13-section {
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 700;
  color: #1a2744;
  padding-bottom: 8px;
  border-bottom: 2px solid #1a2744;
  margin-bottom: 16px;
}

.section-number {
  background: #1a2744;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}

.subsection-title {
  font-size: 12px;
  font-weight: 700;
  color: #334155;
  margin-bottom: 8px;
  padding-left: 4px;
}

/* ============================================================
   EQUIPMENT DATA TABLES
   ============================================================ */
.eq-table-group {
  margin-bottom: 16px;
}

.eq-table-title {
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  background: #f8fafc;
  padding: 6px 12px;
  border-left: 3px solid #1a2744;
  margin-bottom: 1px;
}

.eq-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
}

.eq-table td {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
}

.eq-label {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  width: 25%;
}

.eq-value {
  color: #1e293b;
}

.eq-value--wide {
  width: auto;
}

/* ============================================================
   STATUS SUMMARY
   ============================================================ */
.status-highlight {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 24px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.status-highlight--green { background: #f0fdf4; border: 2px solid #bbf7d0; }
.status-highlight--yellow { background: #fefce8; border: 2px solid #fef08a; }
.status-highlight--red { background: #fef2f2; border: 2px solid #fecaca; }
.status-highlight--gray { background: #f8fafc; border: 2px solid #e2e8f0; }

.status-highlight-icon {
  font-size: 32px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-highlight--green .status-highlight-icon { background: #dcfce7; color: #15803d; }
.status-highlight--yellow .status-highlight-icon { background: #fef9c3; color: #a16207; }
.status-highlight--red .status-highlight-icon { background: #fee2e2; color: #b91c1c; }

.status-highlight-content { flex: 1; }

.status-highlight-label {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #64748b;
  margin-bottom: 4px;
}

.status-highlight-value {
  font-size: 22px;
  font-weight: 700;
}

.status-highlight--green .status-highlight-value { color: #15803d; }
.status-highlight--yellow .status-highlight-value { color: #a16207; }
.status-highlight--red .status-highlight-value { color: #b91c1c; }

.status-highlight-detail {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
}

.criticality-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 6px;
  text-transform: uppercase;
}

.criticality-badge--low { background: #dcfce7; color: #15803d; }
.criticality-badge--medium { background: #fef9c3; color: #a16207; }
.criticality-badge--high { background: #fee2e2; color: #b91c1c; }
.criticality-badge--critical { background: #b91c1c; color: white; }

.indicators-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.indicator-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
}

.indicator-label {
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #94a3b8;
  margin-bottom: 4px;
}

.indicator-value {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.measurement-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.summary-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.summary-card--success { border-color: #bbf7d0; background: #f0fdf4; }
.summary-card--danger { border-color: #fecaca; background: #fef2f2; }

.summary-card-value {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.summary-card--success .summary-card-value { color: #15803d; }
.summary-card--danger .summary-card-value { color: #b91c1c; }

.summary-card-label {
  font-size: 9px;
  text-transform: uppercase;
  color: #64748b;
  margin-top: 4px;
}

/* ============================================================
   MEASUREMENTS TABLE
   ============================================================ */
.meas-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
  margin-bottom: 12px;
}

.meas-th {
  background: #1a2744;
  color: white;
  padding: 8px 12px;
  text-align: left;
  font-weight: 600;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.meas-cell {
  padding: 6px 12px;
  border-bottom: 1px solid #e2e8f0;
}

.meas-cell--number {
  font-family: 'Courier New', monospace;
  text-align: right;
}

.meas-row--ok { }
.meas-row--attention { background: #fefce8; }
.meas-row--critical { background: #fef2f2; }

.condition-badge {
  font-size: 8px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
}

.condition-badge--ok { background: #dcfce7; color: #15803d; }
.condition-badge--attention { background: #fef9c3; color: #a16207; }
.condition-badge--critical { background: #fee2e2; color: #b91c1c; }

.meas-legend {
  display: flex;
  gap: 16px;
  font-size: 9px;
  color: #64748b;
  margin-bottom: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meas-ref {
  font-size: 9px;
  color: #475569;
  padding: 6px 12px;
  background: #f8fafc;
  border-radius: 4px;
}

/* ============================================================
   PHOTO REGISTER
   ============================================================ */
.photos-intro {
  font-size: 10px;
  color: #64748b;
  margin-bottom: 12px;
}

.photo-page-continuation-label {
  font-size: 9px;
  color: #94a3b8;
  font-style: italic;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px dashed #e2e8f0;
}

.photo-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.photo-record {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.photo-record-image {
  height: 120px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #94a3b8;
}

.photo-placeholder-icon { font-size: 24px; }

.photo-placeholder-text {
  font-size: 10px;
  color: #64748b;
}

.photo-record-info {
  padding: 8px 12px;
}

.photo-record-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.photo-record-number {
  font-size: 10px;
  font-weight: 700;
  color: #1a2744;
}

.photo-record-category {
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 3px;
}

.photo-record-description {
  font-size: 10px;
  color: #334155;
}

.photo-record-meta {
  font-size: 9px;
  color: #94a3b8;
  margin-top: 4px;
}

/* ============================================================
   CONCLUSION & RECOMMENDATIONS
   ============================================================ */
.conclusion-block,
.conclusion-compliance,
.conclusion-restrictions,
.conclusion-risks {
  margin-bottom: 16px;
}

.conclusion-label {
  font-size: 10px;
  font-weight: 700;
  color: #475569;
  margin-bottom: 4px;
}

.conclusion-text {
  font-size: 10px;
  color: #1e293b;
  line-height: 1.5;
}

.conclusion-text--compliance {
  font-style: italic;
  color: #475569;
}

.conclusion-restrictions-list {
  list-style: none;
  padding: 0;
}

.conclusion-restrictions-list li {
  font-size: 10px;
  color: #b91c1c;
  padding: 4px 0 4px 16px;
  position: relative;
}

.conclusion-restrictions-list li::before {
  content: '⚠';
  position: absolute;
  left: 0;
}

.risks-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9px;
}

.risks-table th {
  background: #f8fafc;
  padding: 6px 10px;
  text-align: left;
  border: 1px solid #e2e8f0;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  font-size: 8px;
  letter-spacing: 0.5px;
}

.risk-cell {
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  color: #334155;
}

.severity-badge {
  font-size: 8px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}

.severity-badge--low { background: #dcfce7; color: #15803d; }
.severity-badge--medium { background: #fef9c3; color: #a16207; }
.severity-badge--high { background: #fee2e2; color: #b91c1c; }
.severity-badge--critical { background: #b91c1c; color: white; }

.rec-section {
  margin-bottom: 12px;
}

.rec-section-title {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-left: 3px solid;
  margin-bottom: 6px;
}

.rec-section-title--red { color: #b91c1c; border-color: #b91c1c; background: #fef2f2; }
.rec-section-title--orange { color: #a16207; border-color: #a16207; background: #fef9c3; }
.rec-section-title--blue { color: #2563eb; border-color: #2563eb; background: #eff6ff; }
.rec-section-title--gray { color: #475569; border-color: #475569; background: #f8fafc; }
.rec-section-title--navy { color: #1a2744; border-color: #1a2744; background: #f1f5f9; }

.rec-list {
  list-style: none;
  padding: 0;
}

.rec-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 0 4px 8px;
  font-size: 10px;
  color: #334155;
}

.priority-badge {
  font-size: 7px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 3px;
  flex-shrink: 0;
  margin-top: 1px;
}

.priority-badge--critical { background: #b91c1c; color: white; }
.priority-badge--high { background: #fee2e2; color: #b91c1c; }
.priority-badge--medium { background: #fef9c3; color: #a16207; }
.priority-badge--low { background: #f1f5f9; color: #64748b; }

.rec-ref {
  font-size: 8px;
  color: #94a3b8;
}

.rec-next-inspection {
  margin-top: 16px;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.next-insp-details { display: flex; flex-direction: column; gap: 4px; }

.next-insp-row {
  display: flex;
  gap: 8px;
  font-size: 10px;
}

.next-insp-label {
  font-weight: 600;
  color: #475569;
  min-width: 140px;
}

.next-insp-value { color: #1e293b; }

.next-inspection-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 8px;
}

.next-insp-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px 12px;
}

/* ============================================================
   SIGNATURES
   ============================================================ */
.signatures-intro {
  font-size: 10px;
  color: #64748b;
  margin-bottom: 16px;
}

.signatures-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.signature-block {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.signature-block--signed { border-color: #bbf7d0; background: #f0fdf4; }
.signature-block--pending { border-style: dashed; }

.signature-role {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #1a2744;
  margin-bottom: 12px;
}

.signature-line {
  width: 80%;
  height: 1px;
  background: #cbd5e1;
  margin: 0 auto 12px;
}

.signature-name {
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.signature-title {
  font-size: 9px;
  color: #64748b;
}

.signature-registration {
  font-size: 9px;
  color: #475569;
  font-weight: 600;
  margin-top: 4px;
}

.signature-date {
  font-size: 9px;
  color: #94a3b8;
  margin-top: 8px;
}

.signature-status {
  margin-top: 8px;
}

.sig-status {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}

.sig-status--signed { background: #dcfce7; color: #15803d; }
.sig-status--pending { background: #f1f5f9; color: #94a3b8; }

.signatures-art {
  text-align: center;
  font-size: 10px;
  color: #475569;
  padding: 8px 16px;
  background: #f8fafc;
  border-radius: 6px;
}

/* ============================================================
   FOOTER
   ============================================================ */
.nr13-footer {
  position: absolute;
  bottom: 20px;
  left: 50px;
  right: 50px;
}

.footer-line {
  height: 1px;
  background: #e2e8f0;
  margin-bottom: 6px;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  font-size: 8px;
  color: #94a3b8;
}

.footer-left, .footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-sep { color: #cbd5e1; }

.footer-company { font-weight: 600; }

/* ============================================================
   UTILITIES
   ============================================================ */
.no-data {
  font-size: 10px;
  color: #94a3b8;
  font-style: italic;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 6px;
  text-align: center;
}

/* ============================================================
   PRINT STYLES
   ============================================================ */
@media print {
  body { background: white; }
  .nr13-report { box-shadow: none; margin: 0; }
  .nr13-page { page-break-after: always; }
  .nr13-page:last-child { page-break-after: auto; }
}
`;

// Re-export sub-modules for direct access
export { renderCover } from './cover';
export { renderHeader } from './header';
export { renderTechnicalBand } from './technical-band';
export { renderEquipmentData } from './equipment-data';
export { renderStatusSummary } from './status-summary';
export { renderMeasurements } from './measurements';
export { renderPhotoRegister } from './photo-register';
export { renderConclusion, renderRecommendations } from './conclusion';
export { renderSignatures } from './signatures';
export { renderFooter } from './footer';
export type { Nr13TemplateData, CompanyInfo } from './types';
export { MOCK_REPORT, MOCK_COMPANY, MOCK_TEMPLATE_DATA, createMockTechnicalReport } from './mock-data';
