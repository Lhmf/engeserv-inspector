/**
 * NR-13 PDF Template — Header
 *
 * Compact header (pages 3+): 36pt
 * Full header (page 2): 80pt
 *
 * Content is stamped in pass 2 over the reserved zone.
 * The reserved zone height is defined in LAYOUT constants.
 */
import type { PdfRenderingContext } from './context';
import { REPORT_DESIGN, drawRect, drawLine, LAYOUT } from './context';
import { sanitizeTextForWinAnsi, formatDateBR } from './context';

/**
 * Compact header for pages 3+.
 * Height: 36pt (logo + report info + separator).
 * Redesigned: thinner accent line, cleaner typography.
 */
export function drawCompactHeaderPdf(
  ctx: PdfRenderingContext,
  pageNumber: number,
  totalPages: number,
  y: number
): number {
  const { page, margin, contentWidth, fonts, report, company } = ctx;
  const { identification } = report;
  const D = REPORT_DESIGN;

  // Logo (16x16)
  page.drawRectangle({ x: margin, y: y - 16, width: 16, height: 16, color: D.colors.primary });
  page.drawText(sanitizeTextForWinAnsi('ES'), {
    x: margin + 3, y: y - 12,
    font: fonts.helveticaBold, size: 6, color: D.colors.white,
  });

  // Company name
  page.drawText(sanitizeTextForWinAnsi(company.name), {
    x: margin + 20, y: y - 10,
    font: fonts.helveticaBold, size: 8, color: D.colors.primary,
  });

  // Report number — centered
  const centerText = `Laudo Tecnico ${identification.reportNumber}`;
  const centerWidth = fonts.helvetica.widthOfTextAtSize(centerText, 7);
  page.drawText(sanitizeTextForWinAnsi(centerText), {
    x: margin + (contentWidth - centerWidth) / 2, y: y - 10,
    font: fonts.helvetica, size: 7, color: D.colors.gray500,
  });

  // NR-13 badge
  const nr13Text = 'NR-13';
  const nr13Width = fonts.helveticaBold.widthOfTextAtSize(nr13Text, 6) + 6;
  const nr13X = margin + (contentWidth - nr13Width) / 2;
  page.drawRectangle({ x: nr13X, y: y - 22, width: nr13Width, height: 9, color: D.colors.primary });
  page.drawText(sanitizeTextForWinAnsi(nr13Text), {
    x: nr13X + 3, y: y - 20,
    font: fonts.helveticaBold, size: 6, color: D.colors.white,
  });

  // Page number — right
  const pageText = `${pageNumber} / ${totalPages}`;
  const pageTextWidth = fonts.helvetica.widthOfTextAtSize(pageText, 8);
  page.drawText(sanitizeTextForWinAnsi(pageText), {
    x: margin + contentWidth - pageTextWidth, y: y - 10,
    font: fonts.helveticaBold, size: 8, color: D.colors.primary,
  });

  y -= 24;

  // Accent line
  drawLine(ctx, margin, y, margin + contentWidth, 0.5, D.colors.gray200);
  y -= 8;

  return y;
}

/**
 * Full header for page 2.
 * Height: 80pt (logo + title + control data + faixa tecnica).
 * Redesigned: cleaner control data, refined faixa.
 */
export function drawFullHeaderPdf(
  ctx: PdfRenderingContext,
  pageNumber: number,
  totalPages: number,
  y: number
): number {
  const { page, margin, contentWidth, fonts, report, company } = ctx;
  const { identification, equipment, client } = report;
  const D = REPORT_DESIGN;

  // Logo (20x20)
  page.drawRectangle({ x: margin, y: y - 20, width: 20, height: 20, color: D.colors.primary });
  page.drawText(sanitizeTextForWinAnsi('ES'), {
    x: margin + 4, y: y - 14,
    font: fonts.helveticaBold, size: 8, color: D.colors.white,
  });

  // Company name
  page.drawText(sanitizeTextForWinAnsi(company.name), {
    x: margin + 26, y: y - 10,
    font: fonts.helveticaBold, size: 10, color: D.colors.primary,
  });
  page.drawText(sanitizeTextForWinAnsi(company.tagline), {
    x: margin + 26, y: y - 19,
    font: fonts.helvetica, size: 6, color: D.colors.gray400,
  });

  y -= 24;
  drawLine(ctx, margin, y, margin + contentWidth, 0.5, D.colors.gray200);
  y -= 4;

  // Title
  const titleText = 'LAUDO TECNICO DE INSPECAO';
  const titleWidth = fonts.helveticaBold.widthOfTextAtSize(titleText, 11);
  page.drawText(sanitizeTextForWinAnsi(titleText), {
    x: margin + (contentWidth - titleWidth) / 2, y,
    font: fonts.helveticaBold, size: 11, color: D.colors.primary,
  });
  y -= 12;
  drawLine(ctx, margin, y, margin + contentWidth, 1.5, D.colors.primary);
  y -= 4;

  // Control data (4 columns)
  const colWidth = contentWidth / 4;
  const controlItems = [
    { label: 'LAUDO No', value: identification.reportNumber },
    { label: 'REVISAO', value: `v${identification.version}` },
    { label: 'DATA', value: formatDateBR(identification.inspectionDate) },
    { label: 'PAGINA', value: `${pageNumber} / ${totalPages}` },
  ];

  for (let i = 0; i < controlItems.length; i++) {
    const colX = margin + i * colWidth;
    page.drawText(sanitizeTextForWinAnsi(controlItems[i].label), {
      x: colX, y, font: fonts.helveticaBold, size: 6, color: D.colors.gray400,
    });
    page.drawText(sanitizeTextForWinAnsi(controlItems[i].value), {
      x: colX, y: y - 9, font: fonts.helveticaBold, size: 8, color: D.colors.gray800,
    });
  }
  y -= 16;

  // Faixa tecnica
  const bandHeight = 16;
  ctx.page.drawRectangle({
    x: margin, y: y - bandHeight, width: contentWidth, height: bandHeight,
    color: D.colors.gray50, borderColor: D.colors.gray200, borderWidth: 0.5,
  });

  const bandItems = [
    { label: 'CLIENTE', value: client.name },
    { label: 'EQUIPAMENTO', value: equipment.tag },
    { label: 'TAG', value: equipment.tag },
    { label: 'DATA INSPECAO', value: formatDateBR(identification.inspectionDate) },
  ];

  const bandColWidth = contentWidth / 4;
  for (let i = 0; i < bandItems.length; i++) {
    const item = bandItems[i];
    const colX = margin + i * bandColWidth + 6;
    page.drawText(sanitizeTextForWinAnsi(item.label), {
      x: colX, y: y - 6, font: fonts.helveticaBold, size: 5, color: D.colors.gray400,
    });
    let displayValue = item.value;
    while (fonts.helvetica.widthOfTextAtSize(displayValue, 7) > bandColWidth - 16 && displayValue.length > 3) {
      displayValue = displayValue.slice(0, -1);
    }
    if (displayValue !== item.value) displayValue += '...';
    page.drawText(sanitizeTextForWinAnsi(displayValue), {
      x: colX, y: y - 14, font: fonts.helveticaBold, size: 7, color: D.colors.gray800,
    });
    if (i < 3) {
      ctx.page.drawLine({
        start: { x: margin + (i + 1) * bandColWidth, y: y - 14 },
        end: { x: margin + (i + 1) * bandColWidth, y: y - 2 },
        thickness: 0.5, color: D.colors.gray300,
      });
    }
  }

  y -= bandHeight + 4;
  return y;
}

/**
 * Stamp headers on all content pages with correct page count.
 */
export function stampAllHeaders(ctx: PdfRenderingContext, totalPages: number): void {
  const pages = ctx.doc.getPages();
  for (let i = 1; i < pages.length; i++) {
    const pageNum = i + 1;
    const page = pages[i];
    const origPage = ctx.page;
    const origY = ctx.y;
    ctx.page = page;
    let y = ctx.pageHeight - ctx.margin;

    if (pageNum === 2) {
      y = drawFullHeaderPdf(ctx, pageNum, totalPages, y);
    } else {
      y = drawCompactHeaderPdf(ctx, pageNum, totalPages, y);
    }

    ctx.page = origPage;
    ctx.y = origY;
  }
}
