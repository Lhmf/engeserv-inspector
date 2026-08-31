/**
 * NR-13 PDF Template — Measurements Table
 *
 * Truly paginated table with:
 * - Clean table header repeated on each page
 * - Refined zebra striping
 * - Dot indicators for condition
 * - Proper column alignment
 * - Legend on last page only
 * - Reference line on last page only
 *
 * The table handles its own internal page breaks.
 * Builder should ensure at least the title + header + 2 rows fit.
 */
import type { PdfRenderingContext } from './context';
import {
  REPORT_DESIGN, PDF_COLORS, drawSectionTitle, drawRect, drawLine,
  addNewPage, getAvailableHeight, LAYOUT, SECTION_TITLE_HEIGHT,
} from './context';
import { sanitizeTextForWinAnsi, truncateText } from './context';

const COL_WIDTHS_RATIO = [0.10, 0.40, 0.25, 0.25];
const ROW_HEIGHT = 16;
const HEADER_HEIGHT = 18;
const LEGEND_HEIGHT = 16;
const REF_HEIGHT = 14;

export function drawMeasurementsPdf(ctx: PdfRenderingContext, y: number): number {
  // NOTE: Do NOT destructure `page` here — ctx.page changes after addNewPage.
  const { margin, contentWidth, fonts, report } = ctx;
  const D = REPORT_DESIGN;
  const measurements = report.inspectionData.measurements;
  const minThickness = report.equipment.minThicknessMm;

  // Check space BEFORE drawing the title to avoid orphaned titles at page bottom
  // Use local y for accurate space calculation (ctx.y may be stale)
  if ((y - LAYOUT.footerReserve) < SECTION_TITLE_HEIGHT + HEADER_HEIGHT + 2 * ROW_HEIGHT + 40) {
    addNewPage(ctx);
    y = ctx.y;
  }

  y = drawSectionTitle(ctx, 4, 'MEDICOES TECNICAS', y);

  // After drawing the title, verify we have enough space for table header + rows.
  if ((y - LAYOUT.footerReserve) < HEADER_HEIGHT + 2 * ROW_HEIGHT) {
    addNewPage(ctx);
    y = ctx.y;
    y = drawSectionTitle(ctx, 4, 'MEDICOES TECNICAS', y);
  }

  if (!measurements || measurements.length === 0) {
    ctx.page.drawText(sanitizeTextForWinAnsi('Nenhuma medicao registrada para esta inspecao.'), {
      x: margin, y, font: fonts.helveticaOblique, size: 9, color: D.colors.gray400,
    });
    return y - 20;
  }

  const colWidths = COL_WIDTHS_RATIO.map(r => contentWidth * r);

  // Draw table header (reusable)
  function drawTableHeader(startY: number): number {
    const headers = ['Ponto', 'Localizacao / Observacao', 'Espessura (mm)', 'Condicao'];
    drawRect(ctx, margin, startY - HEADER_HEIGHT + 4, contentWidth, HEADER_HEIGHT, D.colors.tableHeader);

    let hx = margin;
    for (let i = 0; i < headers.length; i++) {
      const align = (i === 0 || i === 2) ? 'center' : 'left';
      let textX = hx + 4;
      if (align === 'center') {
        const tw = fonts.helveticaBold.widthOfTextAtSize(headers[i], D.tableHeaderSize);
        textX = hx + (colWidths[i] - tw) / 2;
      }
      ctx.page.drawText(sanitizeTextForWinAnsi(headers[i]), {
        x: textX, y: startY - HEADER_HEIGHT + 10,
        font: fonts.helveticaBold, size: D.tableHeaderSize, color: D.colors.tableHeaderText,
      });
      hx += colWidths[i];
    }
    return startY - HEADER_HEIGHT - 2;
  }

  // Draw initial header
  y = drawTableHeader(y);

  // Draw rows with internal pagination
  // IMPORTANT: We use local `y` for space calculations, NOT getAvailableHeight(ctx)
  // because ctx.y is stale inside this loop — only local `y` tracks position.
  for (let idx = 0; idx < measurements.length; idx++) {
    const m = measurements[idx];

    // Check space using LOCAL y (not ctx.y which is stale)
    const availableHeight = y - LAYOUT.footerReserve;
    const remainingMeasurements = measurements.length - idx;
    const isLast = remainingMeasurements === 1;
    const neededForThisRow = ROW_HEIGHT + (isLast ? LEGEND_HEIGHT + REF_HEIGHT + 20 : 0);

    if (availableHeight < neededForThisRow) {
      // Page break
      addNewPage(ctx);
      y = ctx.y;
      // Draw continuation title on new page
      y = drawSectionTitle(ctx, 4, 'MEDICOES TECNICAS', y, 'CONTINUACAO');
      y = drawTableHeader(y);
    }

    const condition = getCondition(m.thicknessMm, minThickness);
    const bgColor = condition.class === 'critical' ? D.colors.statusRedBg :
                     condition.class === 'attention' ? D.colors.statusYellowBg :
                     (idx % 2 === 0 ? D.colors.tableRowEven : D.colors.tableRowOdd);

    // Row background
    drawRect(ctx, margin, y - ROW_HEIGHT + 4, contentWidth, ROW_HEIGHT, bgColor);
    // Row border (subtle bottom line)
    drawLine(ctx, margin, y - ROW_HEIGHT + 4, margin + contentWidth, 0.5, D.colors.tableBorder);

    let x = margin;
    const cellY = y - ROW_HEIGHT + 8;

    // Point (centered)
    const pointWidth = fonts.helvetica.widthOfTextAtSize(m.point || '', D.tableCellSize);
    ctx.page.drawText(sanitizeTextForWinAnsi(m.point || ''), {
      x: x + (colWidths[0] - pointWidth) / 2, y: cellY,
      font: fonts.helvetica, size: D.tableCellSize, color: D.colors.gray800,
    });
    x += colWidths[0];

    // Location/Notes
    const notes = truncateText(m.notes || '', fonts.helvetica, D.tableCellSize, colWidths[1] - 8);
    ctx.page.drawText(sanitizeTextForWinAnsi(notes || ''), {
      x: x + 4, y: cellY,
      font: fonts.helvetica, size: D.tableCellSize, color: D.colors.gray700,
    });
    x += colWidths[1];

    // Thickness (centered, monospace)
    const thickText = m.thicknessMm ? m.thicknessMm.toFixed(2) : '-';
    const thickWidth = fonts.courier.widthOfTextAtSize(thickText, D.tableCellSize);
    ctx.page.drawText(sanitizeTextForWinAnsi(thickText), {
      x: x + (colWidths[2] - thickWidth) / 2, y: cellY,
      font: fonts.courier, size: D.tableCellSize, color: D.colors.gray800,
    });
    x += colWidths[2];

    // Condition — dot indicator + text
    const dotColor = condition.class === 'critical' ? D.colors.statusRed :
                     condition.class === 'attention' ? D.colors.statusYellow :
                     D.colors.statusGreen;

    // Dot
    ctx.page.drawCircle({
      x: x + 8, y: cellY + 2, size: 3,
      color: dotColor,
    });

    // Condition text
    ctx.page.drawText(sanitizeTextForWinAnsi(condition.label), {
      x: x + 14, y: cellY,
      font: fonts.helveticaBold, size: 7, color: dotColor,
    });

    y -= ROW_HEIGHT;
  }

  y -= 6;

  // === LEGEND (only after all rows) ===
  if ((y - LAYOUT.footerReserve) < LEGEND_HEIGHT + REF_HEIGHT + 20) {
    addNewPage(ctx);
    y = ctx.y;
  }

  const legends = [
    { label: 'OK', color: D.colors.statusGreen, desc: 'Espessura >= 110% do minimo' },
    { label: 'ATENCAO', color: D.colors.statusYellow, desc: 'Entre 100% e 110%' },
    { label: 'CRITICO', color: D.colors.statusRed, desc: 'Abaixo do minimo' },
  ];

  let legendX = margin;
  for (const leg of legends) {
    // Dot + text legend
    ctx.page.drawCircle({ x: legendX + 4, y: y + 1, size: 3, color: leg.color });
    ctx.page.drawText(sanitizeTextForWinAnsi(leg.label), {
      x: legendX + 10, y: y, font: fonts.helveticaBold, size: 7, color: leg.color,
    });
    const labelWidth = fonts.helveticaBold.widthOfTextAtSize(leg.label, 7);
    ctx.page.drawText(sanitizeTextForWinAnsi(leg.desc), {
      x: legendX + 10 + labelWidth + 6, y: y, font: fonts.helvetica, size: 7, color: D.colors.gray500,
    });
    legendX += 10 + labelWidth + 6 + fonts.helvetica.widthOfTextAtSize(leg.desc, 7) + 20;
  }

  y -= LEGEND_HEIGHT;

  // === REFERENCE LINE ===
  if (minThickness) {
    ctx.page.drawRectangle({ x: margin, y: y - 4, width: contentWidth, height: 14, color: D.colors.gray50 });
    const refText = `Espessura minima admissivel: ${minThickness} mm`;
    ctx.page.drawText(sanitizeTextForWinAnsi(refText), {
      x: margin + 6, y: y, font: fonts.helveticaBold, size: 8, color: D.colors.gray600,
    });
    if (report.equipment.originalThicknessMm) {
      const origText = ` | Espessura original: ${report.equipment.originalThicknessMm} mm`;
      const refWidth = fonts.helveticaBold.widthOfTextAtSize(refText, 8);
      ctx.page.drawText(sanitizeTextForWinAnsi(origText), {
        x: margin + 6 + refWidth, y: y, font: fonts.helvetica, size: 8, color: D.colors.gray500,
      });
    }
    y -= REF_HEIGHT;
  }

  ctx.y = y;
  return y;
}

function getCondition(thickness: number, minThickness?: number): { label: string; class: string } {
  if (!minThickness || minThickness === 0) return { label: 'OK', class: 'ok' };
  const threshold = minThickness * 1.1;
  if (thickness < minThickness) return { label: 'CRITICO', class: 'critical' };
  if (thickness < threshold) return { label: 'ATENCAO', class: 'attention' };
  return { label: 'OK', class: 'ok' };
}
