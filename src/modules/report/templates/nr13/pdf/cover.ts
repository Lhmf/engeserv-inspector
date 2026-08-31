/**
 * NR-13 PDF Template — Cover Page (Página 1)
 *
 * Professional cover with:
 * - Clean brand bar with logo
 * - Large title with strong hierarchy
 * - NR-13 badge
 * - Equipment/client info in clean columns
 * - Status highlight
 * - Institutional footer
 *
 * Height: full page (no header needed)
 */
import { rgb } from 'pdf-lib';
import type { PdfRenderingContext } from './context';
import {
  REPORT_DESIGN, PDF_COLORS, drawRect, drawLine,
  formatDateLong, getStatusDisplay, getStatusColors,
  wrapTextLines, sanitizeTextForWinAnsi, LAYOUT,
} from './context';

export function drawCoverPdf(ctx: PdfRenderingContext): void {
  const { page, pageWidth, pageHeight, margin, contentWidth, fonts, report, company } = ctx;
  const { identification, client, equipment, executiveSummary } = report;
  const D = REPORT_DESIGN;

  // === BRAND BAR (top 80pt) ===
  const brandBarHeight = 80;
  drawRect(ctx, 0, pageHeight - brandBarHeight, pageWidth, brandBarHeight, D.colors.primary);

  // Subtle accent line at bottom of brand bar
  drawRect(ctx, 0, pageHeight - brandBarHeight - 3, pageWidth, 3, D.colors.accent);

  // Logo square
  page.drawRectangle({
    x: margin, y: pageHeight - 60, width: 40, height: 40,
    color: D.colors.primaryDark, borderColor: rgb(1, 1, 1), borderWidth: 0.5,
  });
  page.drawText(sanitizeTextForWinAnsi('ES'), {
    x: margin + 11, y: pageHeight - 44,
    font: fonts.helveticaBold, size: 14, color: D.colors.white,
  });

  // Company name
  page.drawText(sanitizeTextForWinAnsi(company.name), {
    x: margin + 50, y: pageHeight - 38,
    font: fonts.helveticaBold, size: 14, color: D.colors.white,
  });
  page.drawText(sanitizeTextForWinAnsi(company.tagline), {
    x: margin + 50, y: pageHeight - 50,
    font: fonts.helvetica, size: 8, color: rgb(0.7, 0.8, 1),
  });

  // === TITLE BLOCK ===
  let y = pageHeight - brandBarHeight - 80;

  // Large title
  page.drawText(sanitizeTextForWinAnsi('LAUDO TÉCNICO'), {
    x: margin, y, font: fonts.helveticaBold, size: 36, color: D.colors.primary,
  });
  y -= 42;
  page.drawText(sanitizeTextForWinAnsi('DE INSPEÇÃO'), {
    x: margin, y, font: fonts.helveticaBold, size: 36, color: D.colors.primary,
  });
  y -= 44;

  // NR-13 badge — centered
  const badgeText = 'NR-13';
  const badgeWidth = fonts.helveticaBold.widthOfTextAtSize(badgeText, 18) + 40;
  const badgeX = (pageWidth - badgeWidth) / 2;
  page.drawRectangle({
    x: badgeX, y: y - 4, width: badgeWidth, height: 28, color: D.colors.primary,
  });
  page.drawText(sanitizeTextForWinAnsi(badgeText), {
    x: badgeX + 20, y: y + 2,
    font: fonts.helveticaBold, size: 18, color: D.colors.white,
  });
  y -= 50;

  // Decorative divider — centered
  const dividerWidth = contentWidth * 0.5;
  const dividerX = (pageWidth - dividerWidth) / 2;
  ctx.page.drawLine({
    start: { x: dividerX, y }, end: { x: dividerX + dividerWidth, y },
    thickness: 2, color: D.colors.primary,
  });
  y -= 30;

  // === INFO BLOCK — 2 columns ===
  const col1X = margin;
  const col2X = margin + contentWidth / 2 + 10;
  const labelSize = D.coverLabel;
  const valueSize = D.coverValue;

  // Column 1: CLIENTE + LAUDO No
  let leftY = y;
  page.drawText(sanitizeTextForWinAnsi('CLIENTE'), {
    x: col1X, y: leftY, font: fonts.helveticaBold, size: labelSize, color: D.colors.gray400,
  });
  leftY -= 14;
  const clientLines = wrapTextLines(client.name, fonts.helvetica, valueSize, contentWidth / 2 - 10);
  for (const line of clientLines) {
    page.drawText(sanitizeTextForWinAnsi(line), {
      x: col1X, y: leftY, font: fonts.helveticaBold, size: valueSize, color: D.colors.gray800,
    });
    leftY -= 16;
  }
  leftY -= 10;
  page.drawText(sanitizeTextForWinAnsi('LAUDO No'), {
    x: col1X, y: leftY, font: fonts.helveticaBold, size: labelSize, color: D.colors.gray400,
  });
  leftY -= 14;
  page.drawText(sanitizeTextForWinAnsi(identification.reportNumber), {
    x: col1X, y: leftY, font: fonts.courierBold, size: valueSize, color: D.colors.primary,
  });

  // Column 2: EQUIPAMENTO + DATA
  let rightY = y;
  page.drawText(sanitizeTextForWinAnsi('EQUIPAMENTO'), {
    x: col2X, y: rightY, font: fonts.helveticaBold, size: labelSize, color: D.colors.gray400,
  });
  rightY -= 14;
  const equipText = `${equipment.tag} - ${equipment.type.replace(/_/g, ' ')}`;
  page.drawText(sanitizeTextForWinAnsi(equipText), {
    x: col2X, y: rightY, font: fonts.helveticaBold, size: valueSize, color: D.colors.gray800,
  });
  rightY -= 18;
  if (equipment.description) {
    const descLines = wrapTextLines(equipment.description, fonts.helvetica, 9, contentWidth / 2 - 10);
    for (const line of descLines) {
      page.drawText(sanitizeTextForWinAnsi(line), {
        x: col2X, y: rightY, font: fonts.helvetica, size: 9, color: D.colors.gray500,
      });
      rightY -= 12;
    }
  }
  rightY -= 10;
  page.drawText(sanitizeTextForWinAnsi('DATA DA INSPEÇÃO'), {
    x: col2X, y: rightY, font: fonts.helveticaBold, size: labelSize, color: D.colors.gray400,
  });
  rightY -= 14;
  page.drawText(sanitizeTextForWinAnsi(formatDateLong(identification.inspectionDate)), {
    x: col2X, y: rightY, font: fonts.helvetica, size: valueSize, color: D.colors.gray800,
  });

  y = Math.min(leftY, rightY) - 30;

  // === STATUS BLOCK ===
  const statusInfo = getStatusDisplay(executiveSummary.overallStatus);
  const statusColors = getStatusColors(statusInfo.color);
  const blockWidth = contentWidth * 0.65;
  const blockHeight = 55;
  const blockX = (pageWidth - blockWidth) / 2;

  // Status background
  page.drawRectangle({
    x: blockX, y: y - blockHeight, width: blockWidth, height: blockHeight,
    color: statusColors.bg, borderColor: statusColors.border, borderWidth: 1,
  });

  // Status label
  page.drawText(sanitizeTextForWinAnsi('STATUS GERAL DO EQUIPAMENTO'), {
    x: blockX, y: y - 14,
    font: fonts.helveticaBold, size: 7, color: D.colors.gray500,
  });

  // Status badge
  const badgeTextWidth = fonts.helveticaBold.widthOfTextAtSize(statusInfo.label, 13);
  const badgePadX = 14;
  const statusBadgeWidth = badgeTextWidth + badgePadX * 2;
  const statusBadgeX = blockX + (blockWidth - statusBadgeWidth) / 2;
  const badgeY = y - blockHeight + 10;

  page.drawRectangle({
    x: statusBadgeX, y: badgeY, width: statusBadgeWidth, height: 24,
    color: statusColors.badgeBg, borderColor: statusColors.border, borderWidth: 1,
  });
  page.drawText(sanitizeTextForWinAnsi(statusInfo.label), {
    x: statusBadgeX + badgePadX, y: badgeY + 6,
    font: fonts.helveticaBold, size: 13, color: statusColors.text,
  });

  // === COVER FOOTER ===
  const coverFooterY = 50;
  ctx.page.drawLine({
    start: { x: margin, y: coverFooterY + 16 },
    end: { x: pageWidth - margin, y: coverFooterY + 16 },
    thickness: 0.5, color: D.colors.gray300,
  });

  page.drawText(sanitizeTextForWinAnsi(company.name), {
    x: margin, y: coverFooterY, font: fonts.helvetica, size: D.coverSmall, color: D.colors.gray500,
  });
  if (company.cnpj) {
    page.drawText(sanitizeTextForWinAnsi(`CNPJ: ${company.cnpj}`), {
      x: margin + 180, y: coverFooterY, font: fonts.helvetica, size: D.coverSmall, color: D.colors.gray500,
    });
  }
  if (company.address) {
    page.drawText(sanitizeTextForWinAnsi(company.address), {
      x: margin + 340, y: coverFooterY, font: fonts.helvetica, size: D.coverSmall, color: D.colors.gray500,
    });
  }

  const contactParts: string[] = [];
  if (company.phone) contactParts.push(`Tel: ${company.phone}`);
  if (company.email) contactParts.push(company.email);
  if (company.website) contactParts.push(company.website);
  if (contactParts.length > 0) {
    page.drawText(sanitizeTextForWinAnsi(contactParts.join('  |  ')), {
      x: margin, y: coverFooterY - 10, font: fonts.helvetica, size: 6, color: D.colors.gray400,
    });
  }
}
