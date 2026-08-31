/**
 * NR-13 PDF Template — Footer (Institutional Standardized Footer)
 *
 * Clean institutional footer:
 * - Thin separator line
 * - Company name | Report number
 * - Page X de Y
 * Height: 20pt max, positioned at margin bottom
 */
import type { PdfRenderingContext } from './context';
import { REPORT_DESIGN, drawLine, LAYOUT } from './context';
import { sanitizeTextForWinAnsi } from './context';

/**
 * Stamp footers on all pages after content is complete.
 */
export function stampAllFooters(
  ctx: PdfRenderingContext,
  totalPages: number
): void {
  const pages = ctx.doc.getPages();
  const D = REPORT_DESIGN;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const footerY = ctx.margin - 8;

    // Thin separator line
    page.drawLine({
      start: { x: ctx.margin, y: footerY + 10 },
      end: { x: ctx.pageWidth - ctx.margin, y: footerY + 10 },
      thickness: D.footerLineWeight,
      color: D.colors.gray200,
    });

    // Left: company name | report number
    const leftText = `${ctx.company.name} | ${ctx.report.identification.reportNumber}`;
    page.drawText(sanitizeTextForWinAnsi(leftText), {
      x: ctx.margin, y: footerY,
      font: ctx.fonts.helvetica, size: D.footerSize, color: D.colors.gray400,
    });

    // Right: page number
    const rightText = `Página ${i + 1} de ${totalPages}`;
    const rightWidth = ctx.fonts.helvetica.widthOfTextAtSize(rightText, D.footerSize);
    page.drawText(sanitizeTextForWinAnsi(rightText), {
      x: ctx.pageWidth - ctx.margin - rightWidth, y: footerY,
      font: ctx.fonts.helvetica, size: D.footerSize, color: D.colors.gray400,
    });
  }
}
