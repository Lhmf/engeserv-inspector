/**
 * NR-13 PDF Template — Cover Page (Página 1)
 *
 * Capa profissional: brand bar navy, título, dados do laudo,
 * status badge, rodapé da capa.
 */
import { rgb } from 'pdf-lib';
import type { PdfRenderingContext } from './context';
import {
  PDF_COLORS, drawText, drawRect, drawLine,
  formatDateLong, getStatusDisplay, getStatusColors,
} from './context';

export function drawCoverPdf(ctx: PdfRenderingContext): void {
  const { page, pageWidth, pageHeight, margin, contentWidth, fonts, report, company } = ctx;
  const { identification, client, equipment, executiveSummary } = report;

  // ============================================================
  // BRAND BAR (navy)
  // ============================================================
  const brandBarHeight = 100;
  drawRect(ctx, 0, pageHeight - brandBarHeight, pageWidth, brandBarHeight, PDF_COLORS.navy);

  // Logo icon
  page.drawRectangle({
    x: margin,
    y: pageHeight - 75,
    width: 50,
    height: 50,
    color: PDF_COLORS.navyLight,
    borderColor: rgb(1, 1, 1),
    borderWidth: 1,
    opacity: 0.5,
  });
  page.drawText('ES', {
    x: margin + 14,
    y: pageHeight - 58,
    font: fonts.helveticaBold,
    size: 18,
    color: PDF_COLORS.white,
  });

  // Company name
  page.drawText(company.name, {
    x: margin + 60,
    y: pageHeight - 45,
    font: fonts.helveticaBold,
    size: 16,
    color: PDF_COLORS.white,
  });
  page.drawText(company.tagline, {
    x: margin + 60,
    y: pageHeight - 60,
    font: fonts.helvetica,
    size: 9,
    color: rgb(0.7, 0.8, 1),
  });

  // Document type
  page.drawText('DOCUMENTO TÉCNICO', {
    x: pageWidth - margin - fonts.helvetica.widthOfTextAtSize('DOCUMENTO TÉCNICO', 9),
    y: pageHeight - 50,
    font: fonts.helvetica,
    size: 9,
    color: rgb(0.6, 0.7, 0.85),
  });

  // ============================================================
  // TITLE BLOCK
  // ============================================================
  let y = pageHeight - brandBarHeight - 80;

  // Title
  page.drawText('LAUDO TÉCNICO', {
    x: margin,
    y,
    font: fonts.helveticaBold,
    size: 32,
    color: PDF_COLORS.navy,
  });
  y -= 38;
  page.drawText('DE INSPEÇÃO', {
    x: margin,
    y,
    font: fonts.helveticaBold,
    size: 32,
    color: PDF_COLORS.navy,
  });
  y -= 40;

  // NR-13 badge
  const badgeText = 'NR-13';
  const badgeWidth = fonts.helveticaBold.widthOfTextAtSize(badgeText, 18) + 40;
  const badgeX = (pageWidth - badgeWidth) / 2;
  page.drawRectangle({
    x: badgeX,
    y: y - 6,
    width: badgeWidth,
    height: 30,
    color: PDF_COLORS.navy,
  });
  page.drawText(badgeText, {
    x: badgeX + 20,
    y: y,
    font: fonts.helveticaBold,
    size: 18,
    color: PDF_COLORS.white,
  });
  y -= 50;

  // Decorative divider
  const dividerWidth = contentWidth * 0.6;
  const dividerX = (pageWidth - dividerWidth) / 2;
  ctx.page.drawLine({
    start: { x: dividerX, y },
    end: { x: dividerX + dividerWidth, y },
    thickness: 2,
    color: PDF_COLORS.navy,
  });
  ctx.page.drawLine({
    start: { x: dividerX + 10, y: y - 4 },
    end: { x: dividerX + dividerWidth - 10, y: y - 4 },
    thickness: 1,
    color: PDF_COLORS.blue500,
  });
  y -= 30;

  // ============================================================
  // INFO GRID (2 columns)
  // ============================================================
  const col1X = margin;
  const col2X = margin + contentWidth / 2 + 10;
  const labelSize = 8;
  const valueSize = 13;

  // Column 1
  let leftY = y;
  page.drawText('LAUDO N°', { x: col1X, y: leftY, font: fonts.helveticaBold, size: labelSize, color: PDF_COLORS.gray500 });
  leftY -= 14;
  page.drawText(identification.reportNumber, { x: col1X, y: leftY, font: fonts.courierBold, size: valueSize, color: PDF_COLORS.navy });
  leftY -= 28;
  page.drawText('CLIENTE', { x: col1X, y: leftY, font: fonts.helveticaBold, size: labelSize, color: PDF_COLORS.gray500 });
  leftY -= 14;
  const clientLines = wrapText(client.name, fonts.helvetica, valueSize, contentWidth / 2 - 10);
  for (const line of clientLines) {
    page.drawText(line, { x: col1X, y: leftY, font: fonts.helvetica, size: valueSize, color: PDF_COLORS.gray800 });
    leftY -= 16;
  }

  // Column 2
  let rightY = y;
  page.drawText('DATA DA INSPEÇÃO', { x: col2X, y: rightY, font: fonts.helveticaBold, size: labelSize, color: PDF_COLORS.gray500 });
  rightY -= 14;
  page.drawText(formatDateLong(identification.inspectionDate), { x: col2X, y: rightY, font: fonts.helvetica, size: valueSize, color: PDF_COLORS.gray800 });
  rightY -= 28;
  page.drawText('EQUIPAMENTO', { x: col2X, y: rightY, font: fonts.helveticaBold, size: labelSize, color: PDF_COLORS.gray500 });
  rightY -= 14;
  page.drawText(`${equipment.tag} — ${equipment.type.replace(/_/g, ' ')}`, {
    x: col2X, y: rightY, font: fonts.helvetica, size: valueSize, color: PDF_COLORS.gray800,
  });
  rightY -= 20;
  if (equipment.description) {
    const descLines = wrapText(equipment.description, fonts.helvetica, 9, contentWidth / 2 - 10);
    for (const line of descLines) {
      page.drawText(line, { x: col2X, y: rightY, font: fonts.helvetica, size: 9, color: PDF_COLORS.gray500 });
      rightY -= 12;
    }
  }

  y = Math.min(leftY, rightY) - 20;

  // ============================================================
  // STATUS BLOCK
  // ============================================================
  const statusInfo = getStatusDisplay(executiveSummary.overallStatus);
  const statusColors = getStatusColors(statusInfo.color);
  const statusBlockHeight = 60;
  const statusBlockWidth = contentWidth * 0.7;
  const statusBlockX = (pageWidth - statusBlockWidth) / 2;

  // Border
  page.drawRectangle({
    x: statusBlockX,
    y: y - statusBlockHeight,
    width: statusBlockWidth,
    height: statusBlockHeight,
    borderColor: PDF_COLORS.gray200,
    borderWidth: 1,
    color: PDF_COLORS.white,
  });

  // Status label
  page.drawText('STATUS GERAL DO EQUIPAMENTO', {
    x: statusBlockX,
    y: y - 16,
    font: fonts.helveticaBold,
    size: 8,
    color: PDF_COLORS.gray500,
  });

  // Status badge
  const statusBadgeTextWidth = fonts.helveticaBold.widthOfTextAtSize(statusInfo.label, 14);
  const statusBadgePadX = 16;
  const statusBadgeWidth = statusBadgeTextWidth + statusBadgePadX * 2;
  const statusBadgeX = statusBlockX + (statusBlockWidth - statusBadgeWidth) / 2;
  const badgeY = y - statusBlockHeight + 14;

  page.drawRectangle({
    x: statusBadgeX,
    y: badgeY,
    width: statusBadgeWidth,
    height: 28,
    color: statusColors.badgeBg,
    borderColor: statusColors.border,
    borderWidth: 1,
  });
  page.drawText(statusInfo.label, {
    x: statusBadgeX + statusBadgePadX,
    y: badgeY + 8,
    font: fonts.helveticaBold,
    size: 14,
    color: statusColors.text,
  });

  y -= statusBlockHeight + 30;

  // ============================================================
  // COVER FOOTER
  // ============================================================
  const coverFooterY = 60;
  ctx.page.drawLine({
    start: { x: margin, y: coverFooterY + 20 },
    end: { x: pageWidth - margin, y: coverFooterY + 20 },
    thickness: 1.5,
    color: PDF_COLORS.navy,
  });

  page.drawText(company.name, {
    x: margin, y: coverFooterY,
    font: fonts.helvetica, size: 8, color: PDF_COLORS.gray500,
  });
  if (company.cnpj) {
    page.drawText(`CNPJ: ${company.cnpj}`, {
      x: margin + 200, y: coverFooterY,
      font: fonts.helvetica, size: 8, color: PDF_COLORS.gray500,
    });
  }
  if (company.address) {
    page.drawText(company.address, {
      x: margin + 380, y: coverFooterY,
      font: fonts.helvetica, size: 8, color: PDF_COLORS.gray500,
    });
  }

  let contactY = coverFooterY - 12;
  const contactParts: string[] = [];
  if (company.phone) contactParts.push(`Tel: ${company.phone}`);
  if (company.email) contactParts.push(`Email: ${company.email}`);
  if (company.website) contactParts.push(company.website);
  if (contactParts.length > 0) {
    page.drawText(contactParts.join('   |   '), {
      x: margin, y: contactY,
      font: fonts.helvetica, size: 7, color: PDF_COLORS.gray400,
    });
  }
}

function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line + (line ? ' ' : '') + word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.length > 0 ? lines : [''];
}
