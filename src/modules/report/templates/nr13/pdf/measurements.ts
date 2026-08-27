/**
 * NR-13 PDF Template — Measurements Table (Tabela de Medições Dinâmica)
 *
 * Tabela dinâmica de medições ultrassônicas com condition badges.
 * Supports: zebra striping, proper column alignment, page break with header repeat.
 */
import type { PdfRenderingContext } from './context';
import { PDF_COLORS, drawSectionTitle, drawRect, drawLine, addNewPage } from './context';
import { sanitizeTextForWinAnsi } from './context';

const COL_WIDTHS_RATIO = [0.10, 0.40, 0.25, 0.25]; // Point, Location, Thickness, Condition
const ROW_HEIGHT = 16;
const HEADER_HEIGHT = 18;

export function drawMeasurementsPdf(ctx: PdfRenderingContext, y: number): number {
  const { page, margin, contentWidth, fonts, report } = ctx;
  const measurements = report.inspectionData.measurements;
  const minThickness = report.equipment.minThicknessMm;

  // Section title
  y = drawSectionTitle(ctx, 4, 'MEDICOES TECNICAS', y);

  if (!measurements || measurements.length === 0) {
    page.drawText(sanitizeTextForWinAnsi('Nenhuma medicao registrada para esta inspecao.'), {
      x: margin, y, font: fonts.helveticaOblique, size: 9, color: PDF_COLORS.gray400,
    });
    return y - 20;
  }

  // Column widths
  const colWidths = COL_WIDTHS_RATIO.map(r => contentWidth * r);

  // ============================================================
  // Draw table header (reusable function for page breaks)
  // ============================================================
  function drawTableHeader(startY: number): number {
    const headers = ['Ponto', 'Localizacao / Observacao', 'Espessura (mm)', 'Condicao'];

    drawRect(ctx, margin, startY - HEADER_HEIGHT + 4, contentWidth, HEADER_HEIGHT, PDF_COLORS.navy);

    let hx = margin;
    for (let i = 0; i < headers.length; i++) {
      // Center-align Point and Thickness columns, left-align others
      const align = (i === 0 || i === 2) ? 'center' : 'left';
      let textX = hx + 4;
      if (align === 'center') {
        const textWidth = fonts.helveticaBold.widthOfTextAtSize(headers[i], 8);
        textX = hx + (colWidths[i] - textWidth) / 2;
      }
      page.drawText(sanitizeTextForWinAnsi(headers[i]), {
        x: textX, y: startY - HEADER_HEIGHT + 10,
        font: fonts.helveticaBold, size: 8, color: PDF_COLORS.white,
      });
      hx += colWidths[i];
    }

    return startY - HEADER_HEIGHT - 2;
  }

  // Draw initial header
  y = drawTableHeader(y);

  // ============================================================
  // Draw table rows with zebra striping
  // ============================================================
  for (let idx = 0; idx < measurements.length; idx++) {
    const m = measurements[idx];

    // Check if enough space for this row + legend
    if (y < ctx.margin + 60) {
      // Page break — add new page and repeat header
      addNewPage(ctx);
      y = ctx.y;
      y = drawTableHeader(y);
    }

    const condition = getCondition(m.thicknessMm, minThickness);
    const bgColor = condition.class === 'critical' ? PDF_COLORS.red50 :
                     condition.class === 'attention' ? PDF_COLORS.yellow50 :
                     (idx % 2 === 0 ? PDF_COLORS.white : PDF_COLORS.gray50);

    // Row background
    drawRect(ctx, margin, y - ROW_HEIGHT + 4, contentWidth, ROW_HEIGHT, bgColor);

    // Bottom border
    drawLine(ctx, margin, y - ROW_HEIGHT + 4, margin + contentWidth, 0.5, PDF_COLORS.gray200);

    // Cells
    let x = margin;
    const cellY = y - ROW_HEIGHT + 8;

    // Point (centered)
    const pointWidth = fonts.helvetica.widthOfTextAtSize(m.point || '', 8);
    page.drawText(sanitizeTextForWinAnsi(m.point || ''), {
      x: x + (colWidths[0] - pointWidth) / 2, y: cellY,
      font: fonts.helvetica, size: 8, color: PDF_COLORS.gray800,
    });
    x += colWidths[0];

    // Location/Notes (left-aligned, truncated)
    const notes = truncateText(m.notes || '', fonts.helvetica, 8, colWidths[1] - 8);
    page.drawText(sanitizeTextForWinAnsi(notes || ''), {
      x: x + 4, y: cellY,
      font: fonts.helvetica, size: 8, color: PDF_COLORS.gray700,
    });
    x += colWidths[1];

    // Thickness (centered, monospace)
    const thickText = m.thicknessMm ? m.thicknessMm.toFixed(2) : '—';
    const thickWidth = fonts.courier.widthOfTextAtSize(thickText, 8);
    page.drawText(sanitizeTextForWinAnsi(thickText), {
      x: x + (colWidths[2] - thickWidth) / 2, y: cellY,
      font: fonts.courier, size: 8, color: PDF_COLORS.gray800,
    });
    x += colWidths[2];

    // Condition badge (centered)
    const badgeColors = condition.class === 'critical' ? { bg: PDF_COLORS.red100, text: PDF_COLORS.red700 } :
                        condition.class === 'attention' ? { bg: PDF_COLORS.yellow100, text: PDF_COLORS.yellow700 } :
                        { bg: PDF_COLORS.green100, text: PDF_COLORS.green700 };

    const badgeWidth = fonts.helveticaBold.widthOfTextAtSize(condition.label, 7) + 10;
    const badgeX = x + (colWidths[3] - badgeWidth) / 2;
    ctx.page.drawRectangle({
      x: badgeX, y: cellY - 2, width: badgeWidth, height: 12,
      color: badgeColors.bg,
    });
    page.drawText(sanitizeTextForWinAnsi(condition.label), {
      x: badgeX + 5, y: cellY,
      font: fonts.helveticaBold, size: 7, color: badgeColors.text,
    });

    y -= ROW_HEIGHT;
  }

  y -= 6;

  // ============================================================
  // LEGEND
  // ============================================================
  const legendY = y;
  const legends = [
    { label: 'OK', color: PDF_COLORS.green100, textColor: PDF_COLORS.green700, desc: 'Espessura >= 110% do minimo' },
    { label: 'ATENCAO', color: PDF_COLORS.yellow100, textColor: PDF_COLORS.yellow700, desc: 'Entre 100% e 110%' },
    { label: 'CRITICO', color: PDF_COLORS.red100, textColor: PDF_COLORS.red700, desc: 'Abaixo do minimo' },
  ];

  let legendX = margin;
  for (const leg of legends) {
    const badgeW = fonts.helveticaBold.widthOfTextAtSize(leg.label, 7) + 8;
    ctx.page.drawRectangle({
      x: legendX, y: legendY - 2, width: badgeW, height: 10,
      color: leg.color,
    });
    page.drawText(sanitizeTextForWinAnsi(leg.label), {
      x: legendX + 4, y: legendY, font: fonts.helveticaBold, size: 7, color: leg.textColor,
    });
    page.drawText(sanitizeTextForWinAnsi(leg.desc), {
      x: legendX + badgeW + 4, y: legendY, font: fonts.helvetica, size: 7, color: PDF_COLORS.gray500,
    });
    legendX += badgeW + fonts.helvetica.widthOfTextAtSize(leg.desc, 7) + 20;
  }

  y -= 16;

  // ============================================================
  // REFERENCE LINE
  // ============================================================
  if (minThickness) {
    ctx.page.drawRectangle({
      x: margin, y: y - 4, width: contentWidth, height: 14,
      color: PDF_COLORS.gray50,
    });
    const refText = `Espessura minima admissivel: ${minThickness} mm`;
    page.drawText(sanitizeTextForWinAnsi(refText), {
      x: margin + 6, y: y, font: fonts.helveticaBold, size: 8, color: PDF_COLORS.gray600,
    });

    if (report.equipment.originalThicknessMm) {
      const origText = ` | Espessura original: ${report.equipment.originalThicknessMm} mm`;
      const refWidth = fonts.helveticaBold.widthOfTextAtSize(refText, 8);
      page.drawText(sanitizeTextForWinAnsi(origText), {
        x: margin + 6 + refWidth, y: y, font: fonts.helvetica, size: 8, color: PDF_COLORS.gray500,
      });
    }

    y -= 14;
  }

  return y;
}

function getCondition(thickness: number, minThickness?: number): { label: string; class: string } {
  if (!minThickness || minThickness === 0) return { label: 'OK', class: 'ok' };
  const threshold = minThickness * 1.1;
  if (thickness < minThickness) return { label: 'CRITICO', class: 'critical' };
  if (thickness < threshold) return { label: 'ATENCAO', class: 'attention' };
  return { label: 'OK', class: 'ok' };
}

function truncateText(text: string, font: any, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 3 && font.widthOfTextAtSize(truncated + '...', size) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}
