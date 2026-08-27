/**
 * NR-13 PDF Template — Measurements Table (Tabela de Medições Dinâmica)
 *
 * Tabela dinâmica de medições ultrassônicas com condition badges.
 * Suporta qualquer quantidade de linhas.
 */
import type { PdfRenderingContext } from './context';
import { PDF_COLORS, drawSectionTitle, drawRect, drawLine } from './context';
import type { MeasurementPoint } from '@/modules/engineering/types';

export function drawMeasurementsPdf(
  ctx: PdfRenderingContext,
  y: number
): number {
  const { page, margin, contentWidth, fonts, report } = ctx;
  const measurements = report.inspectionData.measurements;
  const minThickness = report.equipment.minThicknessMm;
  const stats = report.inspectionData.measurementStats;

  // Section title
  y = drawSectionTitle(ctx, 6, 'MEDIÇÕES TÉCNICAS', y);

  if (!measurements || measurements.length === 0) {
    page.drawText('Nenhuma medição registrada para esta inspeção.', {
      x: margin, y, font: fonts.helveticaOblique, size: 9, color: PDF_COLORS.gray400,
    });
    return y - 20;
  }

  // ============================================================
  // TABLE HEADER
  // ============================================================
  const colWidths = [50, contentWidth * 0.35, contentWidth * 0.2, contentWidth * 0.15];
  const headers = ['Ponto', 'Localização / Observação', 'Espessura (mm)', 'Condição'];
  const headerHeight = 18;

  let x = margin;
  drawRect(ctx, margin, y - headerHeight + 4, contentWidth, headerHeight, PDF_COLORS.navy);

  for (let i = 0; i < headers.length; i++) {
    page.drawText(headers[i], {
      x: x + 4, y: y - headerHeight + 10,
      font: fonts.helveticaBold, size: 8, color: PDF_COLORS.white,
    });
    x += colWidths[i];
  }

  y -= headerHeight + 2;

  // ============================================================
  // TABLE ROWS
  // ============================================================
  const rowHeight = 16;

  for (let idx = 0; idx < measurements.length; idx++) {
    const m = measurements[idx];

    // Check if enough space for this row + legend
    if (y < ctx.margin + 60) {
      // Add page
      const { addNewPage } = require('./context');
      addNewPage(ctx);
      y = ctx.y;

      // Re-draw header
      x = margin;
      drawRect(ctx, margin, y - headerHeight + 4, contentWidth, headerHeight, PDF_COLORS.navy);
      for (let i = 0; i < headers.length; i++) {
        page.drawText(headers[i], {
          x: x + 4, y: y - headerHeight + 10,
          font: fonts.helveticaBold, size: 8, color: PDF_COLORS.white,
        });
        x += colWidths[i];
      }
      y -= headerHeight + 2;
    }

    const condition = getCondition(m.thicknessMm, minThickness);
    const bgColor = condition.class === 'critical' ? PDF_COLORS.red50 :
                     condition.class === 'attention' ? PDF_COLORS.yellow50 :
                     PDF_COLORS.white;

    // Row background
    drawRect(ctx, margin, y - rowHeight + 4, contentWidth, rowHeight, bgColor);

    // Bottom border
    drawLine(ctx, margin, y - rowHeight + 4, margin + contentWidth, 0.5, PDF_COLORS.gray200);

    // Cells
    x = margin;
    const cellY = y - rowHeight + 8;

    // Point
    page.drawText(m.point || '', {
      x: x + 4, y: cellY, font: fonts.helvetica, size: 8, color: PDF_COLORS.gray800,
    });
    x += colWidths[0];

    // Location/Notes
    const notes = truncateText(m.notes || '—', fonts.helvetica, 8, colWidths[1] - 8);
    page.drawText(notes, {
      x: x + 4, y: cellY, font: fonts.helvetica, size: 8, color: PDF_COLORS.gray700,
    });
    x += colWidths[1];

    // Thickness
    const thickText = m.thicknessMm ? m.thicknessMm.toFixed(2) : '—';
    page.drawText(thickText, {
      x: x + 4, y: cellY, font: fonts.courier, size: 8, color: PDF_COLORS.gray800,
    });
    x += colWidths[2];

    // Condition badge
    const badgeColors = condition.class === 'critical' ? { bg: PDF_COLORS.red100, text: PDF_COLORS.red700 } :
                        condition.class === 'attention' ? { bg: PDF_COLORS.yellow100, text: PDF_COLORS.yellow700 } :
                        { bg: PDF_COLORS.green100, text: PDF_COLORS.green700 };

    const badgeWidth = fonts.helveticaBold.widthOfTextAtSize(condition.label, 7) + 10;
    ctx.page.drawRectangle({
      x: x + 2, y: cellY - 2, width: badgeWidth, height: 12,
      color: badgeColors.bg,
    });
    page.drawText(condition.label, {
      x: x + 7, y: cellY, font: fonts.helveticaBold, size: 7, color: badgeColors.text,
    });

    y -= rowHeight;
  }

  y -= 6;

  // ============================================================
  // LEGEND
  // ============================================================
  const legendY = y;
  const legends = [
    { label: 'OK', color: PDF_COLORS.green100, textColor: PDF_COLORS.green700, desc: 'Espessura ≥ 110% do mínimo' },
    { label: 'ATENÇÃO', color: PDF_COLORS.yellow100, textColor: PDF_COLORS.yellow700, desc: 'Entre 100% e 110%' },
    { label: 'CRÍTICO', color: PDF_COLORS.red100, textColor: PDF_COLORS.red700, desc: 'Abaixo do mínimo' },
  ];

  let legendX = margin;
  for (const leg of legends) {
    const badgeW = fonts.helveticaBold.widthOfTextAtSize(leg.label, 7) + 8;
    ctx.page.drawRectangle({
      x: legendX, y: legendY - 2, width: badgeW, height: 10,
      color: leg.color,
    });
    page.drawText(leg.label, {
      x: legendX + 4, y: legendY, font: fonts.helveticaBold, size: 7, color: leg.textColor,
    });
    page.drawText(leg.desc, {
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
    const refText = `Espessura mínima admissível: ${minThickness} mm`;
    page.drawText(refText, {
      x: margin + 6, y: y, font: fonts.helveticaBold, size: 8, color: PDF_COLORS.gray600,
    });

    if (report.equipment.originalThicknessMm) {
      const origText = ` | Espessura original: ${report.equipment.originalThicknessMm} mm`;
      const refWidth = fonts.helveticaBold.widthOfTextAtSize(refText, 8);
      page.drawText(origText, {
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
  if (thickness < minThickness) return { label: 'CRÍTICO', class: 'critical' };
  if (thickness < threshold) return { label: 'ATENÇÃO', class: 'attention' };
  return { label: 'OK', class: 'ok' };
}

function truncateText(text: string, font: any, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 3 && font.widthOfTextAtSize(truncated + '…', size) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '…';
}
