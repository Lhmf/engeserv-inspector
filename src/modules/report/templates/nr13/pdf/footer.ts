/**
 * NR-13 PDF Template — Footer (Compact Standardized Footer)
 *
 * Minimal footer: company | report number | page X de Y
 * Height: 20pt max, positioned at margin bottom
 */
import type { PdfRenderingContext } from './context';
import { PDF_COLORS, drawLine, LAYOUT } from './context';
import { sanitizeTextForWinAnsi } from './context';

/**
 * Stamp footers on all pages after content is complete.
 */
export function stampAllFooters(
  ctx: PdfRenderingContext,
  totalPages: number
): void {
  const pages = ctx.doc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const footerY = ctx.margin - 8;

    // Separator line
    page.drawLine({
      start: { x: ctx.margin, y: footerY + 10 },
      end: { x: ctx.pageWidth - ctx.margin, y: footerY + 10 },
      thickness: 0.5,
      color: PDF_COLORS.gray200,
    });

    // Left: company name + report number
    const leftText = `${ctx.company.name} | ${ctx.report.identification.reportNumber}`;
    page.drawText(sanitizeTextForWinAnsi(leftText), {
      x: ctx.margin, y: footerY,
      font: ctx.fonts.helvetica, size: 6, color: PDF_COLORS.gray400,
    });

    // Right: page number
    const rightText = `Pagina ${i + 1} de ${totalPages}`;
    const rightWidth = ctx.fonts.helvetica.widthOfTextAtSize(rightText, 6);
    page.drawText(sanitizeTextForWinAnsi(rightText), {
      x: ctx.pageWidth - ctx.margin - rightWidth, y: footerY,
      font: ctx.fonts.helvetica, size: 6, color: PDF_COLORS.gray400,
    });
  }
}
