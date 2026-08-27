/**
 * NR-13 PDF Template — Header (Cabeçalho Institucional)
 *
 * Zona 1: Identidade/logo EngeServ
 * Zona 2: Título do documento e identificação principal
 * Zona 3: Controle documental (nº laudo, revisão, data, página)
 * + Faixa técnica horizontal
 */
import type { PdfRenderingContext } from './context';
import { PDF_COLORS, drawRect, drawLine, formatDateBR } from './context';
import { sanitizeTextForWinAnsi } from './context';

/**
 * Draw the full institutional header (first content page).
 * Returns the new y position below the header.
 */
export function drawHeaderPdf(
  ctx: PdfRenderingContext,
  pageNumber: number,
  totalPages: number,
  y: number
): number {
  const { page, margin, contentWidth, fonts, report, company } = ctx;
  const { identification, equipment, client } = report;

  // ============================================================
  // ZONA 1: Identidade EngeServ
  // ============================================================
  // Logo icon
  page.drawRectangle({
    x: margin,
    y: y - 30,
    width: 30,
    height: 30,
    color: PDF_COLORS.navy,
  });
  page.drawText(sanitizeTextForWinAnsi('ES'), {
    x: margin + 8,
    y: y - 22,
    font: fonts.helveticaBold,
    size: 11,
    color: PDF_COLORS.white,
  });

  // Company name + tagline
  page.drawText(sanitizeTextForWinAnsi(company.name), {
    x: margin + 38,
    y: y - 14,
    font: fonts.helveticaBold,
    size: 12,
    color: PDF_COLORS.navy,
  });
  page.drawText(sanitizeTextForWinAnsi(company.tagline), {
    x: margin + 38,
    y: y - 26,
    font: fonts.helvetica,
    size: 8,
    color: PDF_COLORS.gray500,
  });

  y -= 38;

  // Separator
  drawLine(ctx, margin, y, margin + contentWidth, 0.5, PDF_COLORS.gray200);
  y -= 10;

  // ============================================================
  // ZONA 2: Título do documento
  // ============================================================
  const titleText = 'LAUDO TÉCNICO DE INSPEÇÃO';
  const titleWidth = fonts.helveticaBold.widthOfTextAtSize(titleText, 14);
  page.drawText(sanitizeTextForWinAnsi(titleText), {
    x: margin + (contentWidth - titleWidth) / 2,
    y,
    font: fonts.helveticaBold,
    size: 14,
    color: PDF_COLORS.navy,
  });
  y -= 16;

  // Subtitle: NR-13 + equipment type
  const nr13Text = 'NR-13';
  const equipType = equipment.type.replace(/_/g, ' ');
  const nr13Width = fonts.helveticaBold.widthOfTextAtSize(nr13Text, 9);
  const equipTypeWidth = fonts.helvetica.widthOfTextAtSize(equipType, 9);
  const totalSubWidth = nr13Width + 16 + equipTypeWidth;
  const subX = margin + (contentWidth - totalSubWidth) / 2;

  // NR-13 badge
  page.drawRectangle({
    x: subX,
    y: y - 2,
    width: nr13Width + 12,
    height: 14,
    color: PDF_COLORS.navy,
  });
  page.drawText(sanitizeTextForWinAnsi(nr13Text), {
    x: subX + 6,
    y,
    font: fonts.helveticaBold,
    size: 9,
    color: PDF_COLORS.white,
  });

  // Equipment type
  page.drawText(sanitizeTextForWinAnsi(equipType), {
    x: subX + nr13Width + 20,
    y,
    font: fonts.helvetica,
    size: 9,
    color: PDF_COLORS.gray500,
  });

  y -= 16;

  // Separator
  drawLine(ctx, margin, y, margin + contentWidth, 1.5, PDF_COLORS.navy);
  y -= 10;

  // ============================================================
  // ZONA 3: Controle documental (4 columns)
  // ============================================================
  const zone3Y = y;
  const colWidth = contentWidth / 4;

  const zone3Items = [
    { label: 'LAUDO N°', value: identification.reportNumber },
    { label: 'REVISÃO', value: `v${identification.version}` },
    { label: 'DATA', value: formatDateBR(identification.inspectionDate) },
    { label: 'PÁGINA', value: `${pageNumber} / ${totalPages}` },
  ];

  for (let i = 0; i < zone3Items.length; i++) {
    const item = zone3Items[i];
    const colX = margin + i * colWidth;
    page.drawText(sanitizeTextForWinAnsi(item.label), {
      x: colX,
      y: zone3Y,
      font: fonts.helveticaBold,
      size: 7,
      color: PDF_COLORS.gray400,
    });
    page.drawText(sanitizeTextForWinAnsi(item.value), {
      x: colX,
      y: zone3Y - 12,
      font: fonts.helveticaBold,
      size: 9,
      color: PDF_COLORS.gray800,
    });
  }

  y = zone3Y - 26;

  // ============================================================
  // FAIXA TÉCNICA
  // ============================================================
  // Background
  drawRect(ctx, margin, y - 30, contentWidth, 30, PDF_COLORS.gray100);
  ctx.page.drawRectangle({
    x: margin,
    y: y - 30,
    width: contentWidth,
    height: 30,
    borderColor: PDF_COLORS.gray200,
    borderWidth: 0.5,
    color: PDF_COLORS.gray100,
  });

  const bandItems = [
    { label: 'CLIENTE', value: client.name },
    { label: 'EQUIPAMENTO', value: `${equipment.tag}` },
    { label: 'TAG', value: equipment.tag },
    { label: 'DATA INSPEÇÃO', value: formatDateBR(identification.inspectionDate) },
  ];

  const bandColWidth = contentWidth / 4;
  for (let i = 0; i < bandItems.length; i++) {
    const item = bandItems[i];
    const colX = margin + i * bandColWidth + 8;

    page.drawText(sanitizeTextForWinAnsi(item.label), {
      x: colX,
      y: y - 10,
      font: fonts.helveticaBold,
      size: 6,
      color: PDF_COLORS.gray400,
    });

    // Truncate value if too long
    let displayValue = item.value;
    while (fonts.helvetica.widthOfTextAtSize(displayValue, 9) > bandColWidth - 20 && displayValue.length > 3) {
      displayValue = displayValue.slice(0, -1);
    }
    if (displayValue !== item.value) displayValue += '…';

    page.drawText(sanitizeTextForWinAnsi(displayValue), {
      x: colX,
      y: y - 22,
      font: fonts.helveticaBold,
      size: 9,
      color: PDF_COLORS.gray800,
    });

    // Separator line
    if (i < 3) {
      ctx.page.drawLine({ start: { x: margin + (i + 1) * bandColWidth, y: y - 28 }, end: { x: margin + (i + 1) * bandColWidth, y: y - 2 }, thickness: 0.5, color: PDF_COLORS.gray300 });
    }
  }

  y -= 40;
  return y;
}

/**
 * Draw a compact header for internal pages.
 * Returns the new y position below the header.
 */
export function drawCompactHeaderPdf(
  ctx: PdfRenderingContext,
  pageNumber: number,
  totalPages: number,
  y: number
): number {
  const { page, margin, contentWidth, fonts, report, company } = ctx;
  const { identification } = report;

  // Logo icon (small)
  page.drawRectangle({
    x: margin,
    y: y - 22,
    width: 22,
    height: 22,
    color: PDF_COLORS.navy,
  });
  page.drawText(sanitizeTextForWinAnsi('ES'), {
    x: margin + 5,
    y: y - 16,
    font: fonts.helveticaBold,
    size: 8,
    color: PDF_COLORS.white,
  });

  // Company name
  page.drawText(sanitizeTextForWinAnsi(company.name), {
    x: margin + 28,
    y: y - 10,
    font: fonts.helveticaBold,
    size: 9,
    color: PDF_COLORS.navy,
  });

  // Center: report title
  const centerTitle = `Laudo Técnico ${identification.reportNumber}`;
  const centerTitleWidth = fonts.helvetica.widthOfTextAtSize(centerTitle, 9);
  page.drawText(sanitizeTextForWinAnsi(centerTitle), {
    x: margin + (contentWidth - centerTitleWidth) / 2,
    y: y - 10,
    font: fonts.helvetica,
    size: 9,
    color: PDF_COLORS.gray800,
  });
  const centerSub = `NR-13 — v${identification.version}`;
  const centerSubWidth = fonts.helvetica.widthOfTextAtSize(centerSub, 8);
  page.drawText(sanitizeTextForWinAnsi(centerSub), {
    x: margin + (contentWidth - centerSubWidth) / 2,
    y: y - 22,
    font: fonts.helvetica,
    size: 8,
    color: PDF_COLORS.gray400,
  });

  // Right: page number
  const pageText = `${pageNumber} / ${totalPages}`;
  const pageTextWidth = fonts.helvetica.widthOfTextAtSize(pageText, 9);
  page.drawText(sanitizeTextForWinAnsi(pageText), {
    x: margin + contentWidth - pageTextWidth,
    y: y - 10,
    font: fonts.helvetica,
    size: 9,
    color: PDF_COLORS.gray500,
  });

  y -= 28;

  // Separator
  drawLine(ctx, margin, y, margin + contentWidth, 0.5, PDF_COLORS.gray200);
  y -= 10;

  return y;
}
