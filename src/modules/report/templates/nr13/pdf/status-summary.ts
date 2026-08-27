/**
 * NR-13 PDF Template — Status Summary (Status Geral e Resultados Técnicos)
 *
 * Página 3: Status highlight (verde/amarelo/vermelho), indicadores técnicos,
 * resumo das medições, próxima inspeção.
 */
import type { PdfRenderingContext } from './context';
import {
  PDF_COLORS, drawSectionTitle, drawRect, drawLine,
  getStatusDisplay, getStatusColors, getCriticalityColors,
  formatDateLong,
} from './context';
import { sanitizeTextForWinAnsi } from './context';

export function drawStatusSummaryPdf(ctx: PdfRenderingContext, y: number): number {
  const { page, margin, contentWidth, fonts, report } = ctx;
  const { executiveSummary, inspectionData, engineeringResults, equipment, nextInspection } = report;
  const stats = inspectionData.measurementStats;

  // Section title
  y = drawSectionTitle(ctx, 3, 'STATUS GERAL E RESULTADOS TECNICOS', y);

  // ============================================================
  // STATUS HIGHLIGHT BOX
  // ============================================================
  const statusInfo = getStatusDisplay(executiveSummary.overallStatus);
  const statusColors = getStatusColors(statusInfo.color);
  const boxHeight = 55;
  const boxWidth = contentWidth;

  // Background
  ctx.page.drawRectangle({
    x: margin,
    y: y - boxHeight,
    width: boxWidth,
    height: boxHeight,
    color: statusColors.bg,
    borderColor: statusColors.border,
    borderWidth: 1,
  });

  // Icon circle
  const iconX = margin + 20;
  const iconY = y - boxHeight / 2;
  ctx.page.drawCircle({
    x: iconX,
    y: iconY,
    size: 18,
    color: statusColors.badgeBg,
  });

  // Icon symbol — draw as vector shapes instead of Unicode text
  if (statusInfo.color === 'green') {
    ctx.page.drawLine({ start: { x: iconX - 7, y: iconY }, end: { x: iconX - 2, y: iconY - 6 }, thickness: 2.5, color: PDF_COLORS.green700 });
    ctx.page.drawLine({ start: { x: iconX - 2, y: iconY - 6 }, end: { x: iconX + 8, y: iconY + 5 }, thickness: 2.5, color: PDF_COLORS.green700 });
  } else if (statusInfo.color === 'red') {
    ctx.page.drawLine({ start: { x: iconX - 6, y: iconY + 6 }, end: { x: iconX + 6, y: iconY - 6 }, thickness: 2.5, color: PDF_COLORS.red700 });
    ctx.page.drawLine({ start: { x: iconX + 6, y: iconY + 6 }, end: { x: iconX - 6, y: iconY - 6 }, thickness: 2.5, color: PDF_COLORS.red700 });
  } else {
    ctx.page.drawLine({ start: { x: iconX, y: iconY + 5 }, end: { x: iconX, y: iconY - 2 }, thickness: 2.5, color: PDF_COLORS.yellow700 });
    ctx.page.drawCircle({ x: iconX, y: iconY - 6, size: 1.5, color: PDF_COLORS.yellow700 });
  }

  // Status text
  const textX = margin + 55;
  page.drawText(sanitizeTextForWinAnsi('RESULTADO DA INSPECAO'), {
    x: textX, y: y - 14, font: fonts.helveticaBold, size: 7, color: PDF_COLORS.gray500,
  });
  page.drawText(sanitizeTextForWinAnsi(statusInfo.label), {
    x: textX, y: y - 30, font: fonts.helveticaBold, size: 18, color: statusColors.text,
  });

  // Criticality badge
  const critColors = getCriticalityColors(executiveSummary.criticalityLevel);
  const critText = executiveSummary.criticalityLevel;
  const critWidth = fonts.helveticaBold.widthOfTextAtSize(critText, 8) + 16;
  const critX = margin + contentWidth - critWidth - 10;
  ctx.page.drawRectangle({
    x: critX, y: y - boxHeight + 10, width: critWidth, height: 16,
    color: critColors.bg,
  });
  page.drawText(sanitizeTextForWinAnsi(critText), {
    x: critX + 8, y: y - boxHeight + 14, font: fonts.helveticaBold, size: 8, color: critColors.text,
  });

  y -= boxHeight + 15;

  // ============================================================
  // INDICADORES TÉCNICOS (8 cards, 2 rows x 4 cols)
  // ============================================================
  page.drawText(sanitizeTextForWinAnsi('Indicadores Tecnicos'), {
    x: margin + 6, y, font: fonts.helveticaBold, size: 10, color: PDF_COLORS.gray700,
  });
  y -= 14;

  const indicators = [
    { label: 'Esp. Nominal', value: equipment.originalThicknessMm ? `${equipment.originalThicknessMm} mm` : '-' },
    { label: 'Esp. Minima Req.', value: equipment.minThicknessMm ? `${equipment.minThicknessMm} mm` : '-' },
    { label: 'Menor Esp. Encontrada', value: stats.minThicknessMm ? `${stats.minThicknessMm.toFixed(2)} mm` : '-' },
    { label: 'Espessura Media', value: stats.avgThicknessMm ? `${stats.avgThicknessMm.toFixed(2)} mm` : '-' },
    { label: 'Taxa Corrosao', value: '- ' },
    { label: 'Vida Util Rem.', value: '- ' },
    { label: 'PMTA Calculada', value: '- ' },
    { label: '% Abaixo Min.', value: `${(stats.belowMinPercentage || 0).toFixed(1)}%` },
  ];

  const cardWidth = contentWidth / 4;
  const cardHeight = 36;
  for (let i = 0; i < indicators.length; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const cardX = margin + col * cardWidth;
    const cardY = y - row * (cardHeight + 6);

    // Card background
    ctx.page.drawRectangle({
      x: cardX + 2, y: cardY - cardHeight, width: cardWidth - 4, height: cardHeight,
      color: PDF_COLORS.gray50,
      borderColor: PDF_COLORS.gray200, borderWidth: 0.5,
    });

    // Label
    page.drawText(sanitizeTextForWinAnsi(truncateText(indicators[i].label, fonts.helveticaBold, 7, cardWidth - 12)), {
      x: cardX + 6, y: cardY - 12, font: fonts.helveticaBold, size: 7, color: PDF_COLORS.gray400,
    });
    // Value
    page.drawText(sanitizeTextForWinAnsi(truncateText(indicators[i].value, fonts.helveticaBold, 11, cardWidth - 12)), {
      x: cardX + 6, y: cardY - 26, font: fonts.helveticaBold, size: 11, color: PDF_COLORS.gray800,
    });
  }

  y -= Math.ceil(indicators.length / 4) * (cardHeight + 6) + 10;

  // ============================================================
  // RESUMO DAS MEDIÇÕES (4 summary cards)
  // ============================================================
  page.drawText(sanitizeTextForWinAnsi('Resumo das Medicoes'), {
    x: margin + 6, y, font: fonts.helveticaBold, size: 10, color: PDF_COLORS.gray700,
  });
  y -= 14;

  const summaries = [
    { label: 'Pontos Medidos', value: String(stats.count), isDanger: false },
    { label: 'Abaixo do Min.', value: String(stats.belowMinCount), isDanger: stats.belowMinCount > 0 },
    { label: '% Abaixo Min.', value: `${(stats.belowMinPercentage || 0).toFixed(1)}%`, isDanger: (stats.belowMinPercentage || 0) > 0 },
    { label: 'Margem s/ Minimo',
      value: equipment.minThicknessMm && stats.minThicknessMm ? `${Math.max(0, (stats.minThicknessMm - equipment.minThicknessMm) / equipment.minThicknessMm * 100).toFixed(1)}%` : '-',
      isDanger: false },
  ];

  for (let i = 0; i < summaries.length; i++) {
    const cardX = margin + i * cardWidth;
    const bgColor = summaries[i].isDanger ? PDF_COLORS.red50 : PDF_COLORS.gray50;
    const textColor = summaries[i].isDanger ? PDF_COLORS.red700 : PDF_COLORS.gray800;

    ctx.page.drawRectangle({
      x: cardX + 2, y: y - 40, width: cardWidth - 4, height: 40,
      color: bgColor,
      borderColor: summaries[i].isDanger ? PDF_COLORS.red100 : PDF_COLORS.gray200, borderWidth: 0.5,
    });

    // Center value
    const valWidth = fonts.helveticaBold.widthOfTextAtSize(summaries[i].value, 20);
    page.drawText(sanitizeTextForWinAnsi(summaries[i].value), {
      x: cardX + (cardWidth - valWidth) / 2, y: y - 22, font: fonts.helveticaBold, size: 20, color: textColor,
    });

    // Label
    page.drawText(sanitizeTextForWinAnsi(truncateText(summaries[i].label, fonts.helvetica, 7, cardWidth - 12)), {
      x: cardX + 6, y: y - 34, font: fonts.helvetica, size: 7, color: PDF_COLORS.gray500,
    });
  }

  y -= 55;

  // ============================================================
  // PRÓXIMA INSPEÇÃO
  // ============================================================
  page.drawText(sanitizeTextForWinAnsi('Proxima Inspecao Recomendada'), {
    x: margin + 6, y, font: fonts.helveticaBold, size: 10, color: PDF_COLORS.gray700,
  });
  y -= 14;

  ctx.page.drawRectangle({
    x: margin, y: y - 35, width: contentWidth, height: 35,
    color: PDF_COLORS.gray50,
    borderColor: PDF_COLORS.gray200, borderWidth: 0.5,
  });

  const nextItems = [
    { label: 'Data Recomendada:', value: formatDateLong(nextInspection.recommendedDate) },
    { label: 'Intervalo Maximo:', value: `${nextInspection.maxIntervalMonths} meses` },
    { label: 'Tipo:', value: nextInspection.type },
  ];

  for (let i = 0; i < nextItems.length; i++) {
    const itemX = margin + 8 + i * (contentWidth / 3);
    page.drawText(sanitizeTextForWinAnsi(nextItems[i].label), {
      x: itemX, y: y - 12, font: fonts.helveticaBold, size: 7, color: PDF_COLORS.gray500,
    });
    page.drawText(sanitizeTextForWinAnsi(truncateText(nextItems[i].value, fonts.helvetica, 9, contentWidth / 3 - 10)), {
      x: itemX, y: y - 24, font: fonts.helvetica, size: 9, color: PDF_COLORS.gray800,
    });
  }

  y -= 45;
  return y;
}

function truncateText(text: string, font: any, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 3 && font.widthOfTextAtSize(truncated + '...', size) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}
