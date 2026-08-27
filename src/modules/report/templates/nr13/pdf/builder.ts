/**
 * NR-13 PDF Template — Builder (Orquestrador Principal)
 *
 * Orquestra todos os módulos de seção PDF para gerar o laudo completo.
 * Mesma estrutura de 5 páginas do preview HTML:
 *   Página 1: Capa
 *   Página 2: Cabeçalho 3 zonas + Faixa técnica + Dados técnicos
 *   Página 3: Cabeçalho compacto + Status + Medições
 *   Página 4: Cabeçalho compacto + Registro fotográfico
 *   Página 5: Cabeçalho compacto + Recomendações + Conclusão + Assinaturas
 */
import type { TechnicalReport } from '../../../types';
import type { CompanyInfo } from '../types';
import { MOCK_COMPANY } from '../mock-data';
import { createPdfContext, addNewPage, PdfRenderingContext } from './context';
import { drawCoverPdf } from './cover';
import { drawHeaderPdf, drawCompactHeaderPdf } from './header';
import { drawEquipmentDataPdf } from './equipment-data';
import { drawStatusSummaryPdf } from './status-summary';
import { drawMeasurementsPdf } from './measurements';
import { drawPhotoRegisterPdf } from './photo-register';
import { drawRecommendationsPdf, drawConclusionPdf } from './conclusion';
import { drawSignaturesPdf } from './signatures';
import { stampAllFooters } from './footer';

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

  const totalPages = estimatePageCount(report);

  // ============================================================
  // PÁGINA 1 — CAPA
  // ============================================================
  drawCoverPdf(ctx);

  // ============================================================
  // PÁGINA 2 — IDENTIFICAÇÃO E DADOS TÉCNICOS
  // ============================================================
  addNewPage(ctx);
  let y = ctx.y;
  y = drawHeaderPdf(ctx, 2, totalPages, y);
  y = drawEquipmentDataPdf(ctx, y);

  // ============================================================
  // PÁGINA 3 — STATUS GERAL E RESULTADOS TÉCNICOS
  // ============================================================
  addNewPage(ctx);
  y = ctx.y;
  y = drawCompactHeaderPdf(ctx, 3, totalPages, y);
  y = drawStatusSummaryPdf(ctx, y);
  y = drawMeasurementsPdf(ctx, y);

  // ============================================================
  // PÁGINA 4 — REGISTRO FOTOGRÁFICO
  // ============================================================
  addNewPage(ctx);
  y = ctx.y;
  y = drawCompactHeaderPdf(ctx, 4, totalPages, y);
  y = await drawPhotoRegisterPdf(ctx, y);

  // ============================================================
  // PÁGINA 5 — CONCLUSÃO E ASSINATURAS
  // ============================================================
  addNewPage(ctx);
  y = ctx.y;
  y = drawCompactHeaderPdf(ctx, 5, totalPages, y);
  y = drawRecommendationsPdf(ctx, y);
  y = drawConclusionPdf(ctx, y);
  y = drawSignaturesPdf(ctx, y);

  // ============================================================
  // STAMP FOOTERS ON ALL PAGES
  // ============================================================
  const actualTotalPages = ctx.doc.getPages().length;
  stampAllFooters(ctx, actualTotalPages);

  // ============================================================
  // SAVE
  // ============================================================
  const pdfBytes = await ctx.doc.save();
  return pdfBytes;
}

/**
 * Estimate the total number of pages.
 * Used for page numbering in headers/footers.
 */
function estimatePageCount(report: TechnicalReport): number {
  let pages = 5; // Base: cover + identification + status + photos + conclusion

  // Extra measurement pages if many measurements
  const measCount = report.inspectionData?.measurements?.length || 0;
  if (measCount > 15) pages += Math.ceil((measCount - 15) / 15);

  // Extra photo pages
  const photoCount = report.attachments?.photos?.length || 0;
  if (photoCount > 4) pages += Math.ceil((photoCount - 4) / 4);

  return pages;
}
