/**
 * NR-13 PDF Template — Header (Compact Institutional Header)
 *
 * Design: 3 zones, max 70pt height
 * Zone 1: Logo + Company (22pt)
 * Zone 2: Document title (18pt)
 * Zone 3: Control data (14pt) + separator (2pt) + faixa tecnica (22pt)
 *
 * Full header: page 2 only (88pt)
 * Compact header: pages 3+ (70pt)
 */
import type { PdfRenderingContext } from './context';
import { PDF_COLORS, drawRect, drawLine, LAYOUT } from './context';
import { sanitizeTextForWinAnsi } from './context';

/**
 * Draw compact header for content pages.
 * Returns new y position below the header.
 */
export function drawCompactHeaderPdf(
  ctx: PdfRenderingContext,
  pageNumber: number,
  totalPages: number,
  y: number
): number {
  const { page, margin, contentWidth, fonts, report, company } = ctx;
  const { identification, equipment, client } = report;

  // ============================================================
  // ZONE 1: Logo + Company + Report Info (22pt)
  // ============================================================
  // Logo square
  page.drawRectangle({
    x: margin,
    y: y - 18,
    width: 18,
    height: 18,
    color: PDF_COLORS.navy,
  });
  page.drawText(sanitizeTextForWinAnsi('ES'), {
    x: margin + 4,
    y: y - 13,
    font: fonts.helveticaBold,
    size: 7,
    color: PDF_COLORS.white,
  });

  // Company name
  page.drawText(sanitizeTextForWinAnsi(company.name), {
    x: margin + 22,
    y: y - 10,
    font: fonts.helveticaBold,
    size: 9,
    color: PDF_COLORS.navy,
  });

  // Report number - centered
  const centerText = `Laudo Tecnico ${identification.reportNumber}`;
  const centerWidth = fonts.helvetica.widthOfTextAtSize(centerText, 8);
  page.drawText(sanitizeTextForWinAnsi(centerText), {
    x: margin + (contentWidth - centerWidth) / 2,
    y: y - 10,
    font: fonts.helvetica,
    size: 8,
    color: PDF_COLORS.gray600,
  });

  // NR-13 badge - small
  const nr13Text = 'NR-13';
  const nr13Width = fonts.helveticaBold.widthOfTextAtSize(nr13Text, 7) + 8;
  const nr13X = margin + (contentWidth - nr13Width) / 2;
  page.drawRectangle({
    x: nr13X,
    y: y - 21,
    width: nr13Width,
    height: 10,
    color: PDF_COLORS.navy,
  });
  page.drawText(sanitizeTextForWinAnsi(nr13Text), {
    x: nr13X + 4,
    y: y - 19,
    font: fonts.helveticaBold,
    size: 7,
    color: PDF_COLORS.white,
  });

  // Version
  page.drawText(sanitizeTextForWinAnsi(`v${identification.version}`), {
    x: nr13X + nr13Width + 6,
    y: y - 19,
    font: fonts.helvetica,
    size: 7,
    color: PDF_COLORS.gray400,
  });

  // Page number - right
  const pageText = `${pageNumber} / ${totalPages}`;
  const pageTextWidth = fonts.helvetica.widthOfTextAtSize(pageText, 9);
  page.drawText(sanitizeTextForWinAnsi(pageText), {
    x: margin + contentWidth - pageTextWidth,
    y: y - 10,
    font: fonts.helveticaBold,
    size: 9,
    color: PDF_COLORS.navy,
  });

  y -= 24;

  // Separator
  drawLine(ctx, margin, y, margin + contentWidth, 0.5, PDF_COLORS.gray200);
  y -= 8;

  return y;
}

/**
 * Draw full header for page 2 (with faixa tecnica).
 * Returns new y position below the header.
 */
export function drawFullHeaderPdf(
  ctx: PdfRenderingContext,
  pageNumber: number,
  totalPages: number,
  y: number
): number {
  const { page, margin, contentWidth, fonts, report, company } = ctx;
  const { identification, equipment, client } = report;

  // ============================================================
  // ZONE 1: Logo + Company (22pt)
  // ============================================================
  page.drawRectangle({
    x: margin,
    y: y - 20,
    width: 22,
    height: 22,
    color: PDF_COLORS.navy,
  });
  page.drawText(sanitizeTextForWinAnsi('ES'), {
    x: margin + 5,
    y: y - 14,
    font: fonts.helveticaBold,
    size: 9,
    color: PDF_COLORS.white,
  });

  // Company name
  page.drawText(sanitizeTextForWinAnsi(company.name), {
    x: margin + 28,
    y: y - 12,
    font: fonts.helveticaBold,
    size: 11,
    color: PDF_COLORS.navy,
  });

  // Tagline
  page.drawText(sanitizeTextForWinAnsi(company.tagline), {
    x: margin + 28,
    y: y - 22,
    font: fonts.helvetica,
    size: 7,
    color: PDF_COLORS.gray400,
  });

  y -= 28;

  // Separator
  drawLine(ctx, margin, y, margin + contentWidth, 0.5, PDF_COLORS.gray200);
  y -= 6;

  // ============================================================
  // ZONE 2: Document Title (18pt)
  // ============================================================
  const titleText = 'LAUDO TECNICO DE INSPECAO';
  const titleWidth = fonts.helveticaBold.widthOfTextAtSize(titleText, 12);
  page.drawText(sanitizeTextForWinAnsi(titleText), {
    x: margin + (contentWidth - titleWidth) / 2,
    y,
    font: fonts.helveticaBold,
    size: 12,
    color: PDF_COLORS.navy,
  });
  y -= 14;

  // Separator
  drawLine(ctx, margin, y, margin + contentWidth, 1.5, PDF_COLORS.navy);
  y -= 6;

  // ============================================================
  // ZONE 3: Control Data (14pt)
  // ============================================================
  const colWidth = contentWidth / 4;
  const controlItems = [
    { label: 'LAUDO No', value: identification.reportNumber },
    { label: 'REVISAO', value: `v${identification.version}` },
    { label: 'DATA', value: formatDateBR(identification.inspectionDate) },
    { label: 'PAGINA', value: `${pageNumber} / ${totalPages}` },
  ];

  for (let i = 0; i < controlItems.length; i++) {
    const item = controlItems[i];
    const colX = margin + i * colWidth;
    page.drawText(sanitizeTextForWinAnsi(item.label), {
      x: colX,
      y,
      font: fonts.helveticaBold,
      size: 6,
      color: PDF_COLORS.gray400,
    });
    page.drawText(sanitizeTextForWinAnsi(item.value), {
      x: colX,
      y: y - 10,
      font: fonts.helveticaBold,
      size: 8,
      color: PDF_COLORS.gray800,
    });
  }
  y -= 18;

  // ============================================================
  // FAIXA TECNICA (22pt)
  // ============================================================
  drawRect(ctx, margin, y - 22, contentWidth, 22, PDF_COLORS.gray100);
  ctx.page.drawRectangle({
    x: margin,
    y: y - 22,
    width: contentWidth,
    height: 22,
    borderColor: PDF_COLORS.gray200,
    borderWidth: 0.5,
    color: PDF_COLORS.gray100,
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
      x: colX,
      y: y - 8,
      font: fonts.helveticaBold,
      size: 5,
      color: PDF_COLORS.gray400,
    });

    let displayValue = item.value;
    while (fonts.helvetica.widthOfTextAtSize(displayValue, 8) > bandColWidth - 16 && displayValue.length > 3) {
      displayValue = displayValue.slice(0, -1);
    }
    if (displayValue !== item.value) displayValue += '...';

    page.drawText(sanitizeTextForWinAnsi(displayValue), {
      x: colX,
      y: y - 17,
      font: fonts.helveticaBold,
      size: 8,
      color: PDF_COLORS.gray800,
    });

    if (i < 3) {
      ctx.page.drawLine({
        start: { x: margin + (i + 1) * bandColWidth, y: y - 20 },
        end: { x: margin + (i + 1) * bandColWidth, y: y - 2 },
        thickness: 0.5,
        color: PDF_COLORS.gray300,
      });
    }
  }

  y -= 28;
  return y;
}

/**
 * Stamp headers on all content pages (pages 2-N) with correct page count.
 * Called in pass 2 after all content is rendered.
 */
export function stampAllHeaders(
  ctx: PdfRenderingContext,
  totalPages: number
): void {
  const pages = ctx.doc.getPages();
  for (let i = 1; i < pages.length; i++) {
    const pageNum = i + 1;
    const page = pages[i];

    const origPage = ctx.page;
    const origY = ctx.y;
    ctx.page = page;
    // Content starts below header
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

function formatDateBR(date: Date | string | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
