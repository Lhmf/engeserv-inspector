/**
 * NR-13 PDF Template — Builder (Orquestrador Principal)
 *
 * Orquestra todos os módulos de seção PDF para gerar o laudo completo.
 * Two-pass architecture:
 *   Pass 1: Render all content (cover + sections) without headers on pages 2-5
 *   Pass 2: Stamp headers (with correct page count) and footers on all pages
 *
 * This ensures header "X / Y" and footer "Pagina X de Y" always agree.
 */
import type { TechnicalReport } from '../../../types';
import type { CompanyInfo } from '../types';
import { MOCK_COMPANY } from '../mock-data';
import { createPdfContext, addNewPage, PdfRenderingContext, PDF_COLORS, drawLine, sanitizeTextForWinAnsi, drawRect } from './context';
import { drawCoverPdf } from './cover';
import { drawHeaderPdf, drawCompactHeaderPdf } from './header';
import { drawEquipmentDataPdf } from './equipment-data';
import { drawStatusSummaryPdf } from './status-summary';
import { drawMeasurementsPdf } from './measurements';
import { drawPhotoRegisterPdf } from './photo-register';
import { drawRecommendationsPdf, drawConclusionPdf } from './conclusion';
import { drawSignaturesPdf } from './signatures';
import { stampAllFooters } from './footer';
import { stampAllHeaders } from './header';

/**
 * Build the complete NR-13 PDF from a TechnicalReport.
 *
 * @param report - The technical report data (from database or mock)
 * @param company - Company info (defaults to MOCK_COMPANY)
 * @returns The PDF document bytes
 */
export async function buildNr13Pdf(
  report: TechnicalReport,
  company: CompanyInfo = MOCK_COMPANY
): Promise<Uint8Array> {
  // Create context with fonts and initial page
  const ctx = await createPdfContext(report, company);

  // ============================================================
  // PASS 1: RENDER ALL CONTENT
  // ============================================================

  // Página 1 — CAPA (no header needed — cover is its own design)
  drawCoverPdf(ctx);

  // Página 2 — IDENTIFICAÇÃO E DADOS TÉCNICOS
  // Draw content only (header will be stamped in pass 2)
  addNewPage(ctx);
  const page2ContentStart = ctx.y;
  let y = page2ContentStart;
  y = drawEquipmentDataPdf(ctx, y);

  // Página 3 — STATUS GERAL E RESULTADOS TÉCNICOS
  addNewPage(ctx);
  y = ctx.y;
  y = drawStatusSummaryPdf(ctx, y);
  y = drawMeasurementsPdf(ctx, y);

  // Página 4 — REGISTRO FOTOGRÁFICO
  addNewPage(ctx);
  y = ctx.y;
  y = await drawPhotoRegisterPdf(ctx, y);

  // Página 5 — CONCLUSÃO E ASSINATURAS
  addNewPage(ctx);
  y = ctx.y;
  y = drawRecommendationsPdf(ctx, y);
  y = drawConclusionPdf(ctx, y);
  y = drawSignaturesPdf(ctx, y);

  // ============================================================
  // PASS 2: STAMP HEADERS + FOOTERS WITH CORRECT PAGE COUNT
  // ============================================================
  const actualTotalPages = ctx.doc.getPages().length;

  // Stamp headers on pages 2-5 (page 1 is cover — no header)
  stampAllHeaders(ctx, actualTotalPages);

  // Stamp footers on all pages
  stampAllFooters(ctx, actualTotalPages);

  // ============================================================
  // SAVE
  // ============================================================
  const pdfBytes = await ctx.doc.save();
  return pdfBytes;
}
