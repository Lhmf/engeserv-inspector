/**
 * NR-13 PDF Template — Equipment Data (Dados Técnicos)
 *
 * Tabelas organizadas: Identificação, Pressões/Temperaturas,
 * Material/Dimensões, Fluidos/Classificação.
 */
import type { PdfRenderingContext } from './context';
import { PDF_COLORS, drawSectionTitle, drawRect, drawLine } from './context';
import { sanitizeTextForWinAnsi } from './context';

interface TableRow {
  label: string;
  value: string;
  label2?: string;
  value2?: string;
}

export function drawEquipmentDataPdf(ctx: PdfRenderingContext, y: number): number {
  const { page, margin, contentWidth, fonts, report } = ctx;
  const { equipment } = report;

  // Section title
  y = drawSectionTitle(ctx, 2, 'DADOS TÉCNICOS DO EQUIPAMENTO', y);

  // Table: Identificação
  y = drawTableGroup(ctx, 'Identificação', [
    { label: 'TAG', value: equipment.tag || '—', label2: 'Tipo', value2: formatType(equipment.type) },
    { label: 'Descrição', value: equipment.description || '—' },
    { label: 'Fabricante', value: equipment.manufacturer || '—', label2: 'Ano Fabricação', value2: String(equipment.manufactureYear || '—') },
    { label: 'Nº Série', value: equipment.serialNumber || '—', label2: 'Código de Projeto', value2: equipment.designCode || '—' },
    { label: 'Categoria NR-13', value: equipment.nr13Category || '—', label2: 'Grupo de Risco', value2: String(equipment.riskGroup || '—') },
  ], y);

  // Table: Pressões e Temperaturas
  y = drawTableGroup(ctx, 'Pressões e Temperaturas', [
    { label: 'Pressão de Projeto', value: equipment.designPressureBar ? `${equipment.designPressureBar} bar` : '—', label2: 'Temperatura de Projeto', value2: equipment.designTemperatureC ? `${equipment.designTemperatureC} °C` : '—' },
    { label: 'Pressão de Operação', value: equipment.operatingPressureBar ? `${equipment.operatingPressureBar} bar` : '—', label2: 'Temperatura de Operação', value2: equipment.operatingTemperatureC ? `${equipment.operatingTemperatureC} °C` : '—' },
    { label: 'PMTA (MAWP)', value: equipment.mawpBar ? `${equipment.mawpBar} bar` : '—', label2: 'PTH (Hidrostática)', value2: equipment.hydroTestPressureBar ? `${equipment.hydroTestPressureBar} bar` : '—' },
  ], y);

  // Table: Material e Dimensões
  y = drawTableGroup(ctx, 'Material e Dimensões', [
    { label: 'Material do Casco', value: equipment.bodyMaterial || '—', label2: 'Material da Tampa', value2: equipment.headMaterial || '—' },
    { label: 'Tipo de Tampa', value: equipment.headType || '—', label2: 'Eficiência de Solda', value2: equipment.jointEfficiency ? `${(equipment.jointEfficiency * 100).toFixed(0)}%` : '—' },
    { label: 'Espessura Original', value: equipment.originalThicknessMm ? `${equipment.originalThicknessMm} mm` : '—', label2: 'Espessura Mínima', value2: equipment.minThicknessMm ? `${equipment.minThicknessMm} mm` : '—' },
    { label: 'Sobra de Corrosão', value: equipment.corrosionAllowanceMm ? `${equipment.corrosionAllowanceMm} mm` : '—', label2: 'Volume', value2: equipment.volumeLiters ? `${equipment.volumeLiters} L` : '—' },
  ], y);

  // Table: Fluidos e Classificação
  y = drawTableGroup(ctx, 'Fluidos e Classificação', [
    { label: 'Fluido', value: equipment.fluidType || '—', label2: 'Classe do Fluido', value2: equipment.fluidClass || '—' },
  ], y);

  return y;
}

function drawTableGroup(
  ctx: PdfRenderingContext,
  title: string,
  rows: TableRow[],
  y: number
): number {
  const { page, margin, contentWidth, fonts } = ctx;

  // Table group title
  page.drawText(sanitizeTextForWinAnsi(title), {
    x: margin + 6,
    y,
    font: fonts.helveticaBold,
    size: 9,
    color: PDF_COLORS.gray600,
  });

  // Left border
  drawRect(ctx, margin, y - 2, 3, 14, PDF_COLORS.navy);

  y -= 16;

  const halfWidth = contentWidth / 2;

  for (const row of rows) {
    if (row.label2) {
      // Two-column row
      drawTableRow2Col(ctx, row.label, row.value || '—', row.label2, row.value2 || '—', y);
      y -= 20;
    } else {
      // Full-width row
      drawTableRowFull(ctx, row.label, row.value || '—', y);
      y -= 20;
    }
  }

  y -= 4;
  return y;
}

function drawTableRow2Col(
  ctx: PdfRenderingContext,
  label1: string, value1: string,
  label2: string, value2: string,
  y: number
): void {
  const { page, margin, contentWidth, fonts } = ctx;
  const halfWidth = contentWidth / 2;

  // Background for labels
  drawRect(ctx, margin, y - 2, halfWidth, 18, PDF_COLORS.gray50);
  drawRect(ctx, margin + halfWidth, y - 2, halfWidth, 18, PDF_COLORS.gray50);

  // Borders
  ctx.page.drawRectangle({
    x: margin, y: y - 2, width: contentWidth, height: 18,
    borderColor: PDF_COLORS.gray200, borderWidth: 0.5,
  });
  ctx.page.drawLine({
    start: { x: margin + halfWidth, y: y - 2 },
    end: { x: margin + halfWidth, y: y + 16 },
    thickness: 0.5, color: PDF_COLORS.gray200,
  });

  // Left cell: Label 1 on top, Value 1 below
  page.drawText(sanitizeTextForWinAnsi(truncateText(label1, fonts.helveticaBold, 8, halfWidth - 8)), {
    x: margin + 4, y: y + 2, font: fonts.helveticaBold, size: 8, color: PDF_COLORS.gray600,
  });
  page.drawText(sanitizeTextForWinAnsi(truncateText(value1, fonts.helvetica, 9, halfWidth - 8)), {
    x: margin + 4, y: y - 12, font: fonts.helvetica, size: 9, color: PDF_COLORS.gray800,
  });
  // Right cell: Label 2 on top, Value 2 below
  page.drawText(sanitizeTextForWinAnsi(truncateText(label2, fonts.helveticaBold, 8, halfWidth - 8)), {
    x: margin + halfWidth + 4, y: y + 2, font: fonts.helveticaBold, size: 8, color: PDF_COLORS.gray600,
  });
  page.drawText(sanitizeTextForWinAnsi(truncateText(value2, fonts.helvetica, 9, halfWidth - 8)), {
    x: margin + halfWidth + 4, y: y - 12, font: fonts.helvetica, size: 9, color: PDF_COLORS.gray800,
  });
}

function drawTableRowFull(
  ctx: PdfRenderingContext,
  label: string,
  value: string,
  y: number
): void {
  const { page, margin, contentWidth, fonts } = ctx;
  const labelWidth = contentWidth * 0.25;
  const valueWidth = contentWidth * 0.75;

  // Label background
  drawRect(ctx, margin, y - 2, labelWidth, 18, PDF_COLORS.gray50);

  // Border
  ctx.page.drawRectangle({
    x: margin, y: y - 2, width: contentWidth, height: 18,
    borderColor: PDF_COLORS.gray200, borderWidth: 0.5,
  });

  // Label
  page.drawText(sanitizeTextForWinAnsi(truncateText(label, fonts.helveticaBold, 8, labelWidth - 8)), {
    x: margin + 4, y: y + 2, font: fonts.helveticaBold, size: 8, color: PDF_COLORS.gray600,
  });
  // Value
  page.drawText(sanitizeTextForWinAnsi(truncateText(value, fonts.helvetica, 9, valueWidth - 8)), {
    x: margin + labelWidth + 4, y: y + 2, font: fonts.helvetica, size: 9, color: PDF_COLORS.gray800,
  });
}

function formatType(type: string): string {
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function truncateText(text: string, font: any, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 3 && font.widthOfTextAtSize(truncated + '…', size) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '…';
}
