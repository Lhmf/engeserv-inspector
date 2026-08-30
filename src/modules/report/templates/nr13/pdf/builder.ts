/**
 * NR-13 PDF Template — Builder (Orquestrador Principal)
 *
 * Flow-based pagination architecture:
 *   Pass 1: Render all content, respecting header/footer zones
 *   Pass 2: Stamp headers and footers with correct page count
 *
 * Key principle: content is drawn BELOW the header zone.
 * Page 1 (cover) has no header. Pages 2+ reserve header space.
 * When content exceeds available space, a page break occurs.
 */
import type { TechnicalReport } from '../../../types';
import type { CompanyInfo } from '../types';
import { MOCK_COMPANY } from '../mock-data';
import { createPdfContext, addNewPage, PdfRenderingContext, LAYOUT, getAvailableHeight } from './context';
import { drawCoverPdf } from './cover';
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

  // PAGE 1 — COVER (no header needed)
  drawCoverPdf(ctx);

  // PAGE 2 — EQUIPMENT DATA (full header will be stamped later)
  // Content starts below where the full header will be drawn
  addNewPage(ctx, true); // withHeader=true reserves space
  let y = ctx.y;
  y = drawEquipmentDataPdf(ctx, y);

  // If equipment data didn't fill the page, check if status+measurements fit
  // on the same page. If yes, continue. If no, new page.
  const availableForStatus = getAvailableHeight(ctx);
  // Estimate status summary height: ~320pt for typical data
  const estimatedStatusHeight = 340;

  if (availableForStatus < estimatedStatusHeight) {
    // Status summary needs its own page
    addNewPage(ctx);
    y = ctx.y;
  }

  // STATUS + MEASUREMENTS — may span 1-2 pages
  y = drawStatusSummaryPdf(ctx, y);

  // Measurements continue on current page (may cause page break internally)
  y = drawMeasurementsPdf(ctx, y);

  // PAGE — PHOTO REGISTER
  addNewPage(ctx);
  y = ctx.y;
  y = await drawPhotoRegisterPdf(ctx, y);

  // PAGE — RECOMMENDATIONS + CONCLUSION + SIGNATURES
  addNewPage(ctx);
  y = ctx.y;
  y = drawRecommendationsPdf(ctx, y);
  y = drawConclusionPdf(ctx, y);
  y = drawSignaturesPdf(ctx, y);

  // ============================================================
  // PASS 2: STAMP HEADERS + FOOTERS WITH CORRECT PAGE COUNT
  // ============================================================
  const actualTotalPages = ctx.doc.getPages().length;

  // Stamp headers on pages 2-N (page 1 is cover)
  stampAllHeaders(ctx, actualTotalPages);

  // Stamp footers on all pages
  stampAllFooters(ctx, actualTotalPages);

  // ============================================================
  // SAVE
  // ============================================================
  const pdfBytes = await ctx.doc.save();
  return pdfBytes;
}
