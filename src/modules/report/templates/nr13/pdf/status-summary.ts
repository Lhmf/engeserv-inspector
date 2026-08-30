/**
 * NR-13 PDF Template — Status Summary
 *
 * Status highlight, indicators (2x4 grid), measurement summaries, next inspection.
 * Exports estimateHeight for builder space planning.
 */
import type { PdfRenderingContext } from './context';
import {
  PDF_COLORS, drawSectionTitle, drawRect, drawLine,
  getStatusDisplay, getStatusColors, getCriticalityColors,
  formatDateLong, truncateText, LAYOUT, getAvailableHeight, addNewPage,
} from './context';
import { sanitizeTextForWinAnsi } from './context';

const STATUS_BOX_HEIGHT = 50;
const INDICATOR_CARD_HEIGHT = 32;
const SUMMARY_CARD_HEIGHT = 36;
const NEXT_INSPECTION_HEIGHT = 30;

/**
 * Estimate total height of the status summary section.
 */
export function estimateStatusSummaryHeight(ctx: PdfRenderingContext): number {
  // Section title: 26pt
  // Status box: 50pt + 12pt gap
  // Indicators title: 12pt + 2 rows * (32+4)pt + 10pt gap
  // Summaries title: 12pt + 36pt + 12pt gap
  // Next inspection title: 12pt + 30pt + 38pt
  return 26 + 4 + STATUS_BOX_HEIGHT + 12
    + 12 + 2 * (INDICATOR_CARD_HEIGHT + 4) + 10
    + 12 + SUMMARY_CARD_HEIGHT + 12
    + 12 + NEXT_INSPECTION_HEIGHT + 38;
}

export function drawStatusSummaryPdf(ctx: PdfRenderingContext, y: number): number {
  const { page, margin, contentWidth, fonts, report } = ctx;
  const { executiveSummary, inspectionData, equipment, nextInspection } = report;
  const stats = inspectionData.measurementStats;

  y = drawSectionTitle(ctx, 3, 'STATUS GERAL E RESULTADOS TECNICOS', y);
  y -= 2;

  // === STATUS HIGHLIGHT BOX ===
  const statusInfo = getStatusDisplay(executiveSummary.overallStatus);
  const statusColors = getStatusColors(statusInfo.color);
  const boxHeight = STATUS_BOX_HEIGHT;

  ctx.page.drawRectangle({
    x: margin, y: y - boxHeight, width: contentWidth, height: boxHeight,
    color: statusColors.bg, borderColor: statusColors.border, borderWidth: 1,
  });

  const iconX = margin + 22;
  const iconY = y - boxHeight / 2;
  ctx.page.drawCircle({ x: iconX, y: iconY, size: 16, color: statusColors.badgeBg });

  if (statusInfo.color === 'green') {
    ctx.page.drawLine({ start: { x: iconX - 6, y: iconY }, end: { x: iconX - 1, y: iconY - 5 }, thickness: 2.5, color: PDF_COLORS.green700 });
    ctx.page.drawLine({ start: { x: iconX - 1, y: iconY - 5 }, end: { x: iconX + 7, y: iconY + 4 }, thickness: 2.5, color: PDF_COLORS.green700 });
  } else if (statusInfo.color === 'red') {
    ctx.page.drawLine({ start: { x: iconX - 5, y: iconY + 5 }, end: { x: iconX + 5, y: iconY - 5 }, thickness: 2.5, color: PDF_COLORS.red700 });
    ctx.page.drawLine({ start: { x: iconX + 5, y: iconY + 5 }, end: { x: iconX - 5, y: iconY - 5 }, thickness: 2.5, color: PDF_COLORS.red700 });
  } else {
    ctx.page.drawLine({ start: { x: iconX, y: iconY + 4 }, end: { x: iconX, y: iconY - 1 }, thickness: 2.5, color: PDF_COLORS.yellow700 });
    ctx.page.drawCircle({ x: iconX, y: iconY - 5, size: 1.5, color: PDF_COLORS.yellow700 });
  }

  const textX = margin + 50;
  page.drawText(sanitizeTextForWinAnsi('RESULTADO DA INSPECAO'), {
    x: textX, y: y - 12, font: fonts.helveticaBold, size: 7, color: PDF_COLORS.gray500,
  });
  page.drawText(sanitizeTextForWinAnsi(statusInfo.label), {
    x: textX, y: y - 28, font: fonts.helveticaBold, size: 16, color: statusColors.text,
  });

  const critColors = getCriticalityColors(executiveSummary.criticalityLevel);
  const critText = executiveSummary.criticalityLevel;
  const critWidth = fonts.helveticaBold.widthOfTextAtSize(critText, 7) + 14;
  const critX = margin + contentWidth - critWidth - 8;
  ctx.page.drawRectangle({ x: critX, y: y - boxHeight + 8, width: critWidth, height: 14, color: critColors.bg });
  page.drawText(sanitizeTextForWinAnsi(critText), {
    x: critX + 7, y: y - boxHeight + 11, font: fonts.helveticaBold, size: 7, color: critColors.text,
  });

  y -= boxHeight + 12;

  // === INDICATORS ===
  const indicatorsHeight = 12 + 2 * (INDICATOR_CARD_HEIGHT + 4) + 10;
  if (getAvailableHeight(ctx) < indicatorsHeight) {
    addNewPage(ctx); y = ctx.y;
  }

  page.drawText(sanitizeTextForWinAnsi('Indicadores Tecnicos'), {
    x: margin + 4, y, font: fonts.helveticaBold, size: 9, color: PDF_COLORS.gray700,
  });
  y -= 12;

  const indicators = [
    { label: 'Esp. Nominal', value: equipment.originalThicknessMm ? `${equipment.originalThicknessMm} mm` : '-' },
    { label: 'Esp. Minima Req.', value: equipment.minThicknessMm ? `${equipment.minThicknessMm} mm` : '-' },
    { label: 'Menor Esp. Encontrada', value: stats.minThicknessMm ? `${stats.minThicknessMm.toFixed(2)} mm` : '-' },
    { label: 'Espessura Media', value: stats.avgThicknessMm ? `${stats.avgThicknessMm.toFixed(2)} mm` : '-' },
    { label: 'Taxa Corrosao', value: '-' },
    { label: 'Vida Util Rem.', value: '-' },
    { label: 'PMTA Calculada', value: '-' },
    { label: '% Abaixo Min.', value: `${(stats.belowMinPercentage || 0).toFixed(1)}%` },
  ];

  const cardWidth = contentWidth / 4;

  for (let i = 0; i < indicators.length; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const cardX = margin + col * cardWidth;
    const cardY = y - row * (INDICATOR_CARD_HEIGHT + 4);

    ctx.page.drawRectangle({
      x: cardX + 2, y: cardY - INDICATOR_CARD_HEIGHT, width: cardWidth - 4, height: INDICATOR_CARD_HEIGHT,
      color: PDF_COLORS.gray50, borderColor: PDF_COLORS.gray200, borderWidth: 0.5,
    });
    page.drawText(sanitizeTextForWinAnsi(truncateText(indicators[i].label, fonts.helveticaBold, 6, cardWidth - 10)), {
      x: cardX + 6, y: cardY - 10, font: fonts.helveticaBold, size: 6, color: PDF_COLORS.gray400,
    });
    page.drawText(sanitizeTextForWinAnsi(truncateText(indicators[i].value, fonts.helveticaBold, 10, cardWidth - 10)), {
      x: cardX + 6, y: cardY - 24, font: fonts.helveticaBold, size: 10, color: PDF_COLORS.gray800,
    });
  }

  y -= 2 * (INDICATOR_CARD_HEIGHT + 4) + 10;

  // === MEASUREMENT SUMMARIES ===
  const summaryHeight = 12 + SUMMARY_CARD_HEIGHT + 12;
  if (getAvailableHeight(ctx) < summaryHeight) {
    addNewPage(ctx); y = ctx.y;
  }

  page.drawText(sanitizeTextForWinAnsi('Resumo das Medicoes'), {
    x: margin + 4, y, font: fonts.helveticaBold, size: 9, color: PDF_COLORS.gray700,
  });
  y -= 12;

  const summaries = [
    { label: 'Pontos Medidos', value: String(stats.count), isDanger: false },
    { label: 'Abaixo do Min.', value: String(stats.belowMinCount), isDanger: stats.belowMinCount > 0 },
    { label: '% Abaixo Min.', value: `${(stats.belowMinPercentage || 0).toFixed(1)}%`, isDanger: (stats.belowMinPercentage || 0) > 0 },
    { label: 'Margem s/ Minimo',
      value: equipment.minThicknessMm && stats.minThicknessMm
        ? `${Math.max(0, (stats.minThicknessMm - equipment.minThicknessMm) / equipment.minThicknessMm * 100).toFixed(1)}%`
        : '-', isDanger: false },
  ];

  for (let i = 0; i < summaries.length; i++) {
    const cardX = margin + i * cardWidth;
    const bgColor = summaries[i].isDanger ? PDF_COLORS.red50 : PDF_COLORS.gray50;
    const textColor = summaries[i].isDanger ? PDF_COLORS.red700 : PDF_COLORS.gray800;

    ctx.page.drawRectangle({
      x: cardX + 2, y: y - SUMMARY_CARD_HEIGHT, width: cardWidth - 4, height: SUMMARY_CARD_HEIGHT,
      color: bgColor, borderColor: summaries[i].isDanger ? PDF_COLORS.red100 : PDF_COLORS.gray200, borderWidth: 0.5,
    });
    const valWidth = fonts.helveticaBold.widthOfTextAtSize(summaries[i].value, 18);
    page.drawText(sanitizeTextForWinAnsi(summaries[i].value), {
      x: cardX + (cardWidth - valWidth) / 2, y: y - 20,
      font: fonts.helveticaBold, size: 18, color: textColor,
    });
    page.drawText(sanitizeTextForWinAnsi(truncateText(summaries[i].label, fonts.helvetica, 6, cardWidth - 10)), {
      x: cardX + 6, y: y - 30, font: fonts.helvetica, size: 6, color: PDF_COLORS.gray500,
    });
  }

  y -= SUMMARY_CARD_HEIGHT + 12;

  // === NEXT INSPECTION ===
  const nextHeight = 12 + NEXT_INSPECTION_HEIGHT + 38;
  if (getAvailableHeight(ctx) < nextHeight) {
    addNewPage(ctx); y = ctx.y;
  }

  page.drawText(sanitizeTextForWinAnsi('Proxima Inspecao Recomendada'), {
    x: margin + 4, y, font: fonts.helveticaBold, size: 9, color: PDF_COLORS.gray700,
  });
  y -= 12;

  ctx.page.drawRectangle({
    x: margin, y: y - NEXT_INSPECTION_HEIGHT, width: contentWidth, height: NEXT_INSPECTION_HEIGHT,
    color: PDF_COLORS.gray50, borderColor: PDF_COLORS.gray200, borderWidth: 0.5,
  });

  const nextItems = [
    { label: 'Data Recomendada:', value: formatDateLong(nextInspection.recommendedDate) },
    { label: 'Intervalo Maximo:', value: `${nextInspection.maxIntervalMonths} meses` },
    { label: 'Tipo:', value: nextInspection.type },
  ];

  for (let i = 0; i < nextItems.length; i++) {
    const itemX = margin + 8 + i * (contentWidth / 3);
    page.drawText(sanitizeTextForWinAnsi(nextItems[i].label), {
      x: itemX, y: y - 10, font: fonts.helveticaBold, size: 6, color: PDF_COLORS.gray500,
    });
    page.drawText(sanitizeTextForWinAnsi(truncateText(nextItems[i].value, fonts.helvetica, 8, contentWidth / 3 - 10)), {
      x: itemX, y: y - 20, font: fonts.helvetica, size: 8, color: PDF_COLORS.gray800,
    });
  }

  y -= NEXT_INSPECTION_HEIGHT + 38;
  // Update ctx.y so the builder and other modules see the correct position
  ctx.y = y;
  return y;
}
