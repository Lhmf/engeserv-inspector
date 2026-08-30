/**
 * NR-13 PDF Template — Conclusion (Conclusao e Recomendacoes)
 *
 * Recommendations, next inspection, and technical conclusion.
 * Clean layout with proper spacing between sections.
 */
import type { PdfRenderingContext } from './context';
import {
  PDF_COLORS, drawSectionTitle, drawRect, drawLine,
  getStatusDisplay, getStatusColors, formatDateLong,
  wrapTextLines, truncateText, LAYOUT, ensureSpace,
} from './context';
import { sanitizeTextForWinAnsi } from './context';

export function drawRecommendationsPdf(ctx: PdfRenderingContext, y: number): number {
  const { page, margin, contentWidth, fonts, report } = ctx;
  const { recommendations: recs } = report;

  y = drawSectionTitle(ctx, 6, 'RECOMENDACOES', y);

  const allSections = [
    { title: 'Acoes Imediatas (Criticas)', items: recs.immediate, color: PDF_COLORS.red700, bgColor: PDF_COLORS.red50 },
    { title: 'Curto Prazo (ate 6 meses)', items: recs.shortTerm, color: PDF_COLORS.yellow700, bgColor: PDF_COLORS.yellow50 },
    { title: 'Medio Prazo (6-18 meses)', items: recs.mediumTerm, color: PDF_COLORS.blue600, bgColor: PDF_COLORS.blue50 },
    { title: 'Longo Prazo (18+ meses)', items: recs.longTerm, color: PDF_COLORS.gray600, bgColor: PDF_COLORS.gray50 },
  ];

  const hasAny = allSections.some(s => s.items.length > 0);
  if (!hasAny) {
    page.drawText(sanitizeTextForWinAnsi('Nenhuma recomendacao registrada.'), {
      x: margin, y, font: fonts.helveticaOblique, size: 9, color: PDF_COLORS.gray400,
    });
    y -= 16;
  }

  for (const section of allSections) {
    if (section.items.length === 0) continue;

    drawRect(ctx, margin, y - 1, 3, 12, section.color);
    drawRect(ctx, margin + 3, y - 1, contentWidth - 3, 12, section.bgColor);
    page.drawText(sanitizeTextForWinAnsi(section.title), {
      x: margin + 8, y, font: fonts.helveticaBold, size: 8, color: section.color,
    });
    y -= 16;

    for (const rec of section.items) {
      const priColors = getPriorityColors(rec.priority);
      const priText = rec.priority;
      const priWidth = fonts.helveticaBold.widthOfTextAtSize(priText, 6) + 6;
      ctx.page.drawRectangle({
        x: margin + 8, y: y - 1, width: priWidth, height: 10, color: priColors.bg,
      });
      page.drawText(sanitizeTextForWinAnsi(priText), {
        x: margin + 11, y: y, font: fonts.helveticaBold, size: 6, color: priColors.text,
      });

      const descText = truncateText(rec.description, fonts.helvetica, 8, contentWidth - priWidth - 30);
      page.drawText(sanitizeTextForWinAnsi(descText), {
        x: margin + priWidth + 16, y, font: fonts.helvetica, size: 8, color: PDF_COLORS.gray700,
      });
      y -= 12;

      if (rec.referencedStandard) {
        page.drawText(sanitizeTextForWinAnsi(`(${rec.referencedStandard})`), {
          x: margin + priWidth + 16, y, font: fonts.helveticaOblique, size: 7, color: PDF_COLORS.gray400,
        });
        y -= 10;
      }
    }
    y -= 4;
  }

  // NEXT INSPECTION
  y -= 6;
  drawRect(ctx, margin, y - 1, 3, 12, PDF_COLORS.navy);
  drawRect(ctx, margin + 3, y - 1, contentWidth - 3, 12, PDF_COLORS.gray100);
  page.drawText(sanitizeTextForWinAnsi('Proxima Inspecao'), {
    x: margin + 8, y, font: fonts.helveticaBold, size: 8, color: PDF_COLORS.navy,
  });
  y -= 16;

  const boxHeight = 52;
  ctx.page.drawRectangle({
    x: margin, y: y - boxHeight, width: contentWidth, height: boxHeight,
    color: PDF_COLORS.gray50, borderColor: PDF_COLORS.gray200, borderWidth: 0.5,
  });

  const inspDetails = [
    { label: 'Data Recomendada:', value: formatDateLong(recs.inspection.nextInspectionDate) },
    { label: 'Intervalo:', value: `${recs.inspection.intervalMonths} meses` },
    { label: 'Tipo:', value: recs.inspection.type },
    { label: 'Escopo:', value: recs.inspection.scope.join('; ') },
    { label: 'Criterios:', value: recs.inspection.criteria },
  ];

  let detailY = y - 10;
  for (const detail of inspDetails) {
    page.drawText(sanitizeTextForWinAnsi(detail.label), {
      x: margin + 8, y: detailY, font: fonts.helveticaBold, size: 7, color: PDF_COLORS.gray600,
    });
    const labelWidth = fonts.helveticaBold.widthOfTextAtSize(detail.label, 7);
    const value = truncateText(detail.value, fonts.helvetica, 7, contentWidth - labelWidth - 24);
    page.drawText(sanitizeTextForWinAnsi(value), {
      x: margin + labelWidth + 12, y: detailY, font: fonts.helvetica, size: 7, color: PDF_COLORS.gray800,
    });
    detailY -= 9;
  }

  y -= boxHeight + 8;
  return y;
}

export function drawConclusionPdf(ctx: PdfRenderingContext, y: number): number {
  const { page, margin, contentWidth, fonts, report } = ctx;
  const { technicalConclusion } = report;

  y = drawSectionTitle(ctx, 7, 'CONCLUSAO TECNICA', y);

  const statusInfo = getStatusDisplay(technicalConclusion.conclusion);
  const statusColors = getStatusColors(statusInfo.color);

  page.drawText(sanitizeTextForWinAnsi('Conclusao:'), {
    x: margin, y, font: fonts.helveticaBold, size: 9, color: PDF_COLORS.gray600,
  });

  const badgeX = margin + fonts.helveticaBold.widthOfTextAtSize('Conclusao: ', 9);
  const badgeText = statusInfo.label;
  const badgeWidth = fonts.helveticaBold.widthOfTextAtSize(badgeText, 9) + 12;
  ctx.page.drawRectangle({
    x: badgeX, y: y - 2, width: badgeWidth, height: 14, color: statusColors.badgeBg,
  });
  page.drawText(sanitizeTextForWinAnsi(badgeText), {
    x: badgeX + 6, y, font: fonts.helveticaBold, size: 9, color: statusColors.text,
  });
  y -= 20;

  if (technicalConclusion.justification) {
    page.drawText(sanitizeTextForWinAnsi('Justificativa:'), {
      x: margin, y, font: fonts.helveticaBold, size: 8, color: PDF_COLORS.gray600,
    });
    y -= 12;
    y = drawWrappedText(ctx, technicalConclusion.justification, margin + 6, y, contentWidth - 6, {
      font: fonts.helvetica, size: 8, color: PDF_COLORS.gray800,
    });
    y -= 6;
  }

  if (technicalConclusion.complianceStatement) {
    y = drawWrappedText(ctx, technicalConclusion.complianceStatement, margin, y, contentWidth, {
      font: fonts.helveticaOblique, size: 7, color: PDF_COLORS.gray500,
    });
    y -= 6;
  }

  if (technicalConclusion.restrictions && technicalConclusion.restrictions.length > 0) {
    page.drawText(sanitizeTextForWinAnsi('Restricoes de Operacao:'), {
      x: margin, y, font: fonts.helveticaBold, size: 8, color: PDF_COLORS.gray600,
    });
    y -= 12;

    for (const r of technicalConclusion.restrictions) {
      ctx.page.drawCircle({ x: margin + 4, y: y + 2, size: 2, color: PDF_COLORS.red500 });
      y = drawWrappedText(ctx, r, margin + 12, y, contentWidth - 12, {
        font: fonts.helvetica, size: 8, color: PDF_COLORS.red700,
      });
      y -= 4;
    }
  }

  return y;
}

function drawWrappedText(
  ctx: PdfRenderingContext,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  options: { font: any; size: number; color: any }
): number {
  const { page, fonts } = ctx;
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (const word of words) {
    const testLine = line + (line ? ' ' : '') + word;
    const width = options.font.widthOfTextAtSize(testLine, options.size);
    if (width > maxWidth && line) {
      page.drawText(sanitizeTextForWinAnsi(line), { x, y: currentY, font: options.font, size: options.size, color: options.color });
      currentY -= options.size * 1.35;
      line = word;
      if (currentY < ctx.margin + LAYOUT.footerHeight) {
        addNewPage(ctx);
        currentY = ctx.y;
      }
    } else {
      line = testLine;
    }
  }
  if (line) {
    page.drawText(sanitizeTextForWinAnsi(line), { x, y: currentY, font: options.font, size: options.size, color: options.color });
    currentY -= options.size * 1.35;
  }
  return currentY;
}

function getPriorityColors(priority: string): { bg: any; text: any } {
  switch (priority) {
    case 'CRITICAL': return { bg: PDF_COLORS.red700, text: PDF_COLORS.white };
    case 'HIGH': return { bg: PDF_COLORS.red100, text: PDF_COLORS.red700 };
    case 'MEDIUM': return { bg: PDF_COLORS.yellow100, text: PDF_COLORS.yellow700 };
    default: return { bg: PDF_COLORS.gray100, text: PDF_COLORS.gray600 };
  }
}

function addNewPage(ctx: PdfRenderingContext): void {
  ctx.page = ctx.doc.addPage([ctx.pageWidth, ctx.pageHeight]);
  ctx.pageNumber++;
  ctx.y = ctx.pageHeight - ctx.margin - LAYOUT.headerHeight;
}
