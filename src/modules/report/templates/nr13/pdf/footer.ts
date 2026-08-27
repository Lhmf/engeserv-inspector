/**
 * NR-13 PDF Template — Footer (Rodapé Padronizado)
 *
 * Rodapé em todas as páginas internas:
 * linha separadora + empresa | documento | página X de Y | status
 */
import type { PdfRenderingContext } from './context';
import { PDF_COLORS, drawLine } from './context';

/**
 * Draw the standardized footer on the current page.
 * Call this at the bottom of each page after all content is drawn.
 */
export function drawFooterPdf(
  ctx: PdfRenderingContext,
  pageNumber: number,
  totalPages: number
): void {
  const { page, margin, pageWidth, fonts, report, company } = ctx;
  const { identification } = report;

  const footerY = ctx.margin - 10;

  // Separator line
  drawLine(ctx, margin, footerY + 10, pageWidth - margin, 0.5, PDF_COLORS.gray200);

  // Left: company name | document
  const leftText = `${company.name} | ${identification.reportNumber} — v${identification.version}`;
  page.drawText(leftText, {
    x: margin, y: footerY,
    font: fonts.helvetica, size: 7, color: PDF_COLORS.gray400,
  });

  // Right: page number | status
  const pageText = `Página ${pageNumber} de ${totalPages}`;
  const statusText = identification.status ? ` | ${identification.status}` : '';
  const rightText = pageText + statusText;
  const rightWidth = fonts.helvetica.widthOfTextAtSize(rightText, 7);
  page.drawText(rightText, {
    x: pageWidth - margin - rightWidth, y: footerY,
    font: fonts.helvetica, size: 7, color: PDF_COLORS.gray400,
  });
}

/**
 * Stamp footers on all pages after content is complete.
 * This should be called once after all pages are drawn.
 */
export function stampAllFooters(
  ctx: PdfRenderingContext,
  totalPages: number
): void {
  const pages = ctx.doc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const footerY = ctx.margin - 10;

    // Separator line
    page.drawLine({
      start: { x: ctx.margin, y: footerY + 10 },
      end: { x: ctx.pageWidth - ctx.margin, y: footerY + 10 },
      thickness: 0.5,
      color: PDF_COLORS.gray200,
    });

    // Left
    const leftText = `${ctx.company.name} | ${ctx.report.identification.reportNumber} — v${ctx.report.identification.version}`;
    page.drawText(leftText, {
      x: ctx.margin, y: footerY,
      font: ctx.fonts.helvetica, size: 7, color: PDF_COLORS.gray400,
    });

    // Right
    const pageText = `Página ${i + 1} de ${totalPages}`;
    const statusText = ctx.report.identification.status ? ` | ${ctx.report.identification.status}` : '';
    const rightText = pageText + statusText;
    const rightWidth = ctx.fonts.helvetica.widthOfTextAtSize(rightText, 7);
    page.drawText(rightText, {
      x: ctx.pageWidth - ctx.margin - rightWidth, y: footerY,
      font: ctx.fonts.helvetica, size: 7, color: PDF_COLORS.gray400,
    });
  }
}
