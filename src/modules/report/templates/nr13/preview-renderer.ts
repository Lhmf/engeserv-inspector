/**
 * NR-13 Report HTML Preview Renderer
 * 
 * Re-exports the main render functions from index.ts.
 * Provides CSS styles for the report preview.
 */

// Re-export the main render functions
export { renderNr13Report, renderNr13ReportWithStyles } from './index';
export type { Nr13TemplateData, CompanyInfo } from './types';
export { MOCK_REPORT, MOCK_COMPANY, MOCK_TEMPLATE_DATA, createMockTechnicalReport } from './mock-data';

/**
 * Core CSS styles for the NR-13 report template.
 * This ensures visual consistency between HTML preview and PDF.
 */
export const REPORT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  :root {
    --navy: #0f1729;
    --navy-light: #1a2744;
    --accent-blue: #2563eb;
    --accent-green: #059669;
    --accent-amber: #d97706;
    --accent-red: #dc2626;
    --text-primary: #1e293b;
    --text-secondary: #475569;
    --text-muted: #94a3b8;
    --border: #e2e8f0;
    --bg-page: #ffffff;
    --bg-section: #f8fafc;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: var(--text-primary);
    line-height: 1.6;
    background: #e2e8f0;
  }

  .report-preview {
    max-width: 210mm;
    margin: 0 auto;
    background: var(--bg-page);
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
  }

  .report-page {
    width: 210mm;
    min-height: 297mm;
    padding: 20mm 25mm;
    position: relative;
    page-break-after: always;
    background: white;
  }

  .report-page:last-child {
    page-break-after: auto;
  }

  /* Cover page special layout */
  .report-page.cover {
    padding: 0;
    display: flex;
    flex-direction: column;
    min-height: 297mm;
  }

  /* Header zones */
  .header-zone {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 25mm;
    border-bottom: 2px solid var(--border);
  }

  .header-zone-1 {
    background: var(--navy);
    color: white;
    padding: 16px 25mm;
    border-bottom: none;
  }

  .header-zone-2 {
    background: var(--bg-section);
    padding: 12px 25mm;
  }

  .header-zone-3 {
    padding: 8px 25mm;
    font-size: 10px;
    color: var(--text-muted);
    border-bottom: 1px solid var(--border);
  }

  /* Technical band */
  .technical-band {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    padding: 16px 25mm;
    background: var(--bg-section);
    border-bottom: 1px solid var(--border);
  }

  .technical-band-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .technical-band-label {
    font-size: 10px;
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .technical-band-value {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-primary);
  }

  /* Section titles */
  .section-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--navy);
    padding-bottom: 8px;
    margin-bottom: 16px;
    border-bottom: 2px solid var(--accent-blue);
  }

  .section-subtitle {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    margin-top: 16px;
    margin-bottom: 8px;
  }

  /* Data tables */
  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
    font-size: 11px;
  }

  .data-table th {
    background: var(--navy);
    color: white;
    padding: 8px 12px;
    text-align: left;
    font-weight: 600;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .data-table td {
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
  }

  .data-table tr:nth-child(even) {
    background: var(--bg-section);
  }

  .data-table tr:hover {
    background: #f1f5f9;
  }

  /* Status badges */
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .status-approved {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #6ee7b7;
  }

  .status-approved-restrictions {
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fcd34d;
  }

  .status-rejected {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
  }

  .status-indeterminate {
    background: #e2e8f0;
    color: #475569;
    border: 1px solid #cbd5e1;
  }

  /* Status highlight box */
  .status-highlight {
    padding: 24px;
    border-radius: 12px;
    text-align: center;
    margin-bottom: 24px;
  }

  .status-highlight h3 {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .status-highlight p {
    font-size: 12px;
    opacity: 0.8;
  }

  /* Measurement stats */
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }

  .stat-card {
    background: var(--bg-section);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px;
    text-align: center;
  }

  .stat-card .value {
    font-size: 18px;
    font-weight: 700;
    color: var(--navy);
  }

  .stat-card .label {
    font-size: 10px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 4px;
  }

  /* Photo grid */
  .photo-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .photo-card {
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }

  .photo-card img {
    width: 100%;
    height: 150px;
    object-fit: cover;
    background: var(--bg-section);
  }

  .photo-card .photo-info {
    padding: 8px 12px;
  }

  .photo-card .photo-number {
    font-size: 10px;
    font-weight: 600;
    color: var(--accent-blue);
    text-transform: uppercase;
  }

  .photo-card .photo-description {
    font-size: 11px;
    color: var(--text-secondary);
    margin-top: 4px;
  }

  .photo-card .photo-location {
    font-size: 10px;
    color: var(--text-muted);
    margin-top: 2px;
  }

  /* Signature blocks */
  .signature-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    margin-top: 24px;
  }

  .signature-block {
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px;
    text-align: center;
  }

  .signature-block .signature-line {
    width: 100%;
    height: 1px;
    background: var(--text-primary);
    margin: 40px 0 8px;
  }

  .signature-block .signature-name {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .signature-block .signature-role {
    font-size: 10px;
    color: var(--text-muted);
  }

  .signature-block .signature-crea {
    font-size: 10px;
    color: var(--text-muted);
    margin-top: 4px;
  }

  /* Footer */
  .report-footer {
    position: absolute;
    bottom: 20mm;
    left: 25mm;
    right: 25mm;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 8px;
    border-top: 1px solid var(--border);
    font-size: 9px;
    color: var(--text-muted);
  }

  /* Recommendation lists */
  .recommendation-list {
    list-style: none;
    padding: 0;
  }

  .recommendation-list li {
    padding: 8px 12px;
    border-left: 3px solid var(--accent-blue);
    background: var(--bg-section);
    margin-bottom: 8px;
    border-radius: 0 6px 6px 0;
    font-size: 11px;
  }

  .recommendation-list li.critical {
    border-left-color: var(--accent-red);
  }

  .recommendation-list li.warning {
    border-left-color: var(--accent-amber);
  }

  .recommendation-list li.info {
    border-left-color: var(--accent-green);
  }

  /* Priority badges */
  .priority-badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    margin-right: 6px;
  }

  .priority-critical { background: #fee2e2; color: #991b1b; }
  .priority-high { background: #fef3c7; color: #92400e; }
  .priority-medium { background: #dbeafe; color: #1e40af; }
  .priority-low { background: #e2e8f0; color: #475569; }

  /* Print styles */
  @media print {
    body { background: white; }
    .report-preview { box-shadow: none; }
    .report-page { box-shadow: none; margin: 0; }
  }

  /* Utility classes */
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .mt-4 { margin-top: 16px; }
  .mt-8 { margin-top: 32px; }
  .mb-4 { margin-bottom: 16px; }
  .mb-8 { margin-bottom: 32px; }
  .font-bold { font-weight: 700; }
  .text-sm { font-size: 12px; }
  .text-xs { font-size: 10px; }
  .text-muted { color: var(--text-muted); }
`;

/**
 * Generates inline CSS for the report preview.
 * Useful when embedding in existing pages.
 */
export function getReportStyles(): string {
  return REPORT_STYLES;
}
