/**
 * NR-13 PDF Template — Builder (Section-Based Flow Pagination)
 *
 * Architecture:
 *   Pass 1: Render all content with flow-based pagination
 *   Pass 2: Stamp headers and footers with correct page count
 *
 * Key principles:
 * - Content determines the number of pages
 * - Each section checks available space before drawing
 * - Section titles stay with their content (no orphans)
 * - Tables and photo grids paginate internally
 * - Footer zone is always preserved
 */
import type { TechnicalReport } from '../../../types';
import type { CompanyInfo } from '../types';
import { isDefinitiveCompanyInfo } from '../../../company-info';
import {
  EmissionMode,
  EmissionBarrierError,
  assessTechnicalReportEmission,
  sanitizeForEmission,
} from '../../../safety/emission';
import { stampDemoBanners, drawEmissionWarningsBlock, estimateEmissionWarningsHeight } from './emission-banners';
import {
  createPdfContext, addNewPage, addNewPageFullHeader, getAvailableHeight,
  PdfRenderingContext, LAYOUT, SECTION_TITLE_HEIGHT,
} from './context';
import { drawCoverPdf } from './cover';
import { drawEquipmentDataPdf, estimateEquipmentDataHeight } from './equipment-data';
import { drawStatusSummaryPdf, estimateStatusSummaryHeight } from './status-summary';
import { drawMeasurementsPdf } from './measurements';
import { drawPhotoRegisterPdf } from './photo-register';
import { drawRecommendationsPdf, drawConclusionPdf, estimateRecommendationsHeight, estimateConclusionHeight } from './conclusion';
import { drawSignaturesPdf, estimateSignaturesHeight } from './signatures';
import { stampAllFooters } from './footer';
import { stampAllHeaders } from './header';

/**
 * Ensure there is space for `estimatedHeight` pt of content.
 * If not enough space, create a new page.
 * Returns the (possibly updated) y position.
 */
function ensureSpaceFor(ctx: PdfRenderingContext, estimatedHeight: number): number {
  if (getAvailableHeight(ctx) < estimatedHeight) {
    addNewPage(ctx);
  }
  return ctx.y;
}

/**
 * Build the complete NR-13 PDF from a TechnicalReport.
 */
export interface BuildNr13PdfOptions {
  mode?: EmissionMode;
}

export async function buildNr13Pdf(
  report: TechnicalReport,
  company: CompanyInfo,
  options: BuildNr13PdfOptions = {}
): Promise<Uint8Array> {
  const mode: EmissionMode = options.mode ?? 'DEFINITIVE';
  const assessment = assessTechnicalReportEmission(report);

  if (mode === 'DEFINITIVE') {
    if (!isDefinitiveCompanyInfo(company)) {
      throw new EmissionBarrierError(assessment, true, [
        'Empresa emitente não configurada com dados reais (nome + CNPJ).',
      ]);
    }
    if (!assessment.canEmitDefinitive) {
      throw new EmissionBarrierError(assessment, false, assessment.reasons);
    }
  }

  const safeReport = sanitizeForEmission(report, mode, assessment) as TechnicalReport;

  const ctx = await createPdfContext(safeReport, company);

  // ============================================================
  // PASS 1: RENDER ALL CONTENT (flow-based)
  // ============================================================

  // PAGE 1 — COVER (no header needed)
  drawCoverPdf(ctx);

  // PAGE 2 — First content page (full header reserved by builder)
  addNewPageFullHeader(ctx);

  // --- Equipment Data ---
  // Estimate height before drawing to check if it fits
  const equipHeight = estimateEquipmentDataHeight(ctx);
  if (getAvailableHeight(ctx) < equipHeight + SECTION_TITLE_HEIGHT + 20) {
    // If equipment data alone is too big for remaining space, start new page
    addNewPage(ctx);
  }
  let y = ctx.y;
  y = drawEquipmentDataPdf(ctx, y);
  ctx.y = y; // Keep ctx.y in sync with local y

  // --- Status Summary ---
  const statusHeight = estimateStatusSummaryHeight(ctx);
  if (getAvailableHeight(ctx) < statusHeight) {
    addNewPage(ctx);
    y = ctx.y;
  }
  y = drawStatusSummaryPdf(ctx, y);
  ctx.y = y; // Keep ctx.y in sync

  // --- Measurements ---
  // Measurements handle their own internal pagination.
  const measurements = safeReport.inspectionData.measurements;
  if (measurements && measurements.length > 0) {
    const minMeasureHeight = SECTION_TITLE_HEIGHT + 58 + 40;
    if (getAvailableHeight(ctx) < minMeasureHeight) {
      addNewPage(ctx);
      y = ctx.y;
    }
  }
  y = drawMeasurementsPdf(ctx, y);
  ctx.y = y; // Keep ctx.y in sync

  // --- Photo Register ---
  const photos = safeReport.attachments.photos;
  if (photos && photos.length > 0) {
    const photoHeight = 50;
    if (getAvailableHeight(ctx) < photoHeight) {
      addNewPage(ctx);
      y = ctx.y;
    }
  }
  y = await drawPhotoRegisterPdf(ctx, y);
  ctx.y = y; // Keep ctx.y in sync

  // --- Recommendations ---
  const recsHeight = estimateRecommendationsHeight(ctx);
  if (getAvailableHeight(ctx) < recsHeight) {
    addNewPage(ctx);
    y = ctx.y;
  }
  y = drawRecommendationsPdf(ctx, y);
  ctx.y = y; // Keep ctx.y in sync

  // --- Conclusion ---
  const conclusionHeight = estimateConclusionHeight(ctx);
  if (getAvailableHeight(ctx) < conclusionHeight) {
    addNewPage(ctx);
    y = ctx.y;
  }
  y = drawConclusionPdf(ctx, y);
  ctx.y = y; // Keep ctx.y in sync

  // Avisos de emissão para documentos de demonstração / laudos não definitivos
  if (mode === 'DEMO' || !assessment.canEmitDefinitive) {
    const warningsHeight = estimateEmissionWarningsHeight(ctx, assessment);
    if (getAvailableHeight(ctx) < warningsHeight) {
      addNewPage(ctx);
      y = ctx.y;
    }
    y = drawEmissionWarningsBlock(ctx, y, assessment);
    ctx.y = y;
  }

  // --- Signatures (keep-together: move entire block if needed) ---
  const sigHeight = estimateSignaturesHeight(ctx);
  if (getAvailableHeight(ctx) < sigHeight) {
    addNewPage(ctx);
    y = ctx.y;
  }
  y = drawSignaturesPdf(ctx, y);
  ctx.y = y;

  // ============================================================
  // PASS 2: STAMP HEADERS + FOOTERS
  // ============================================================
  const actualTotalPages = ctx.doc.getPages().length;
  stampAllHeaders(ctx, actualTotalPages);
  stampAllFooters(ctx, actualTotalPages);
  if (mode === 'DEMO') {
    stampDemoBanners(ctx);
  }

  return await ctx.doc.save();
}
