/**
 * NR-13 PDF Template — Equipment Data (Dados Tecnicos)
 *
 * 4 separate grouped tables with zebra striping.
 * Exports estimateHeight for builder space planning.
 */
import type { PdfRenderingContext } from './context';
import { PDF_COLORS, drawSectionTitle, drawRect, drawLine, safeStr, LAYOUT, getAvailableHeight, addNewPage } from './context';
import { sanitizeTextForWinAnsi, truncateText } from './context';

interface TableRow {
  label: string;
  value: string;
  label2?: string;
  value2?: string;
}

const ROW_HEIGHT = 22;
const GROUP_TITLE_HEIGHT = 18;
const TABLE_ROW_HEIGHT = 22;

/**
 * Estimate total height of the equipment data section.
 */
export function estimateEquipmentDataHeight(ctx: PdfRenderingContext): number {
  const { report } = ctx;
  const { equipment } = report;

  // Section title: 26pt
  let height = 26;

  // Group 1: Identificacao — 5 rows (4 two-col, 1 full)
  height += GROUP_TITLE_HEIGHT + 5 * TABLE_ROW_HEIGHT + 4;

  // Group 2: Pressoes — 3 rows
  height += GROUP_TITLE_HEIGHT + 3 * TABLE_ROW_HEIGHT + 4;

  // Group 3: Material — 4 rows
  height += GROUP_TITLE_HEIGHT + 4 * TABLE_ROW_HEIGHT + 4;

  // Group 4: Fluidos — 1 row
  height += GROUP_TITLE_HEIGHT + 1 * TABLE_ROW_HEIGHT + 4;

  return height;
}

export function drawEquipmentDataPdf(ctx: PdfRenderingContext, y: number): number {
  const { page, margin, contentWidth, fonts, report } = ctx;
  const { equipment } = report;

  y = drawSectionTitle(ctx, 2, 'DADOS TECNICOS DO EQUIPAMENTO', y);
  y -= 2;

  y = drawTableGroup(ctx, 'Identificacao', [
    { label: 'TAG', value: safeStr(equipment.tag), label2: 'Tipo', value2: formatType(equipment.type) },
    { label: 'Descricao', value: safeStr(equipment.description) },
    { label: 'Fabricante', value: safeStr(equipment.manufacturer), label2: 'Ano Fabricacao', value2: safeStr(equipment.manufactureYear) },
    { label: 'No Serie', value: safeStr(equipment.serialNumber), label2: 'Codigo de Projeto', value2: safeStr(equipment.designCode) },
    { label: 'Categoria NR-13', value: safeStr(equipment.nr13Category), label2: 'Grupo de Risco', value2: safeStr(equipment.riskGroup) },
  ], y);

  y -= 4;

  y = drawTableGroup(ctx, 'Pressoes e Temperaturas', [
    { label: 'Pressao de Projeto', value: equipment.designPressureBar ? `${equipment.designPressureBar} bar` : '', label2: 'Temperatura de Projeto', value2: equipment.designTemperatureC ? `${equipment.designTemperatureC} oC` : '' },
    { label: 'Pressao de Operacao', value: equipment.operatingPressureBar ? `${equipment.operatingPressureBar} bar` : '', label2: 'Temperatura de Operacao', value2: equipment.operatingTemperatureC ? `${equipment.operatingTemperatureC} oC` : '' },
    { label: 'PMTA (MAWP)', value: equipment.mawpBar ? `${equipment.mawpBar} bar` : '', label2: 'PTH (Hidrostatica)', value2: equipment.hydroTestPressureBar ? `${equipment.hydroTestPressureBar} bar` : '' },
  ], y);

  y -= 4;

  y = drawTableGroup(ctx, 'Material e Dimensoes', [
    { label: 'Material do Casco', value: safeStr(equipment.bodyMaterial), label2: 'Material da Tampa', value2: safeStr(equipment.headMaterial) },
    { label: 'Tipo de Tampa', value: safeStr(equipment.headType), label2: 'Eficiencia de Solda', value2: equipment.jointEfficiency ? `${(equipment.jointEfficiency * 100).toFixed(0)}%` : '' },
    { label: 'Espessura Original', value: equipment.originalThicknessMm ? `${equipment.originalThicknessMm} mm` : '', label2: 'Espessura Minima', value2: equipment.minThicknessMm ? `${equipment.minThicknessMm} mm` : '' },
    { label: 'Sobra de Corrosao', value: equipment.corrosionAllowanceMm ? `${equipment.corrosionAllowanceMm} mm` : '', label2: 'Volume', value2: equipment.volumeLiters ? `${equipment.volumeLiters} L` : '' },
  ], y);

  y -= 4;

  y = drawTableGroup(ctx, 'Fluidos e Classificacao', [
    { label: 'Fluido', value: safeStr(equipment.fluidType), label2: 'Classe do Fluido', value2: safeStr(equipment.fluidClass) },
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

  // Check space for title + at least 2 rows
  const needed = GROUP_TITLE_HEIGHT + Math.min(rows.length, 2) * TABLE_ROW_HEIGHT + 4;
  if (getAvailableHeight(ctx) < needed) {
    addNewPage(ctx);
    y = ctx.y;
  }

  drawRect(ctx, margin, y - 1, 3, 12, PDF_COLORS.navy);
  page.drawText(sanitizeTextForWinAnsi(title), {
    x: margin + 8, y,
    font: fonts.helveticaBold, size: 9, color: PDF_COLORS.gray600,
  });
  y -= 16;

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    if (getAvailableHeight(ctx) < TABLE_ROW_HEIGHT) {
      addNewPage(ctx);
      y = ctx.y;
    }
    if (row.label2) {
      y = drawTableRow2Col(ctx, row.label, row.value, row.label2, row.value2 || '', y, idx % 2 === 0);
    } else {
      y = drawTableRowFull(ctx, row.label, row.value || '', y, idx % 2 === 0);
    }
  }

  y -= 2;
  ctx.y = y;
  return y;
}

function drawTableRow2Col(
  ctx: PdfRenderingContext,
  label1: string, value1: string,
  label2: string, value2: string,
  y: number, isEven: boolean
): number {
  const { page, margin, contentWidth, fonts } = ctx;
  const halfWidth = contentWidth / 2;
  const bgColor = isEven ? PDF_COLORS.white : PDF_COLORS.gray50;

  drawRect(ctx, margin, y - ROW_HEIGHT + 4, halfWidth, ROW_HEIGHT, bgColor);
  drawRect(ctx, margin + halfWidth, y - ROW_HEIGHT + 4, halfWidth, ROW_HEIGHT, bgColor);
  ctx.page.drawRectangle({ x: margin, y: y - ROW_HEIGHT + 4, width: contentWidth, height: ROW_HEIGHT, borderColor: PDF_COLORS.gray200, borderWidth: 0.5 });
  ctx.page.drawLine({ start: { x: margin + halfWidth, y: y - ROW_HEIGHT + 4 }, end: { x: margin + halfWidth, y: y + 4 }, thickness: 0.5, color: PDF_COLORS.gray200 });

  page.drawText(sanitizeTextForWinAnsi(truncateText(label1, fonts.helveticaBold, 7, halfWidth - 8)), {
    x: margin + 4, y: y, font: fonts.helveticaBold, size: 7, color: PDF_COLORS.gray400,
  });
  drawValueCell(ctx, margin + 4, y - 12, halfWidth - 8, value1);

  page.drawText(sanitizeTextForWinAnsi(truncateText(label2, fonts.helveticaBold, 7, halfWidth - 8)), {
    x: margin + halfWidth + 4, y: y, font: fonts.helveticaBold, size: 7, color: PDF_COLORS.gray400,
  });
  drawValueCell(ctx, margin + halfWidth + 4, y - 12, halfWidth - 8, value2);

  return y - ROW_HEIGHT;
}

function drawTableRowFull(
  ctx: PdfRenderingContext,
  label: string, value: string,
  y: number, isEven: boolean
): number {
  const { page, margin, contentWidth, fonts } = ctx;
  const labelWidth = contentWidth * 0.30;
  const valueWidth = contentWidth * 0.70;
  const bgColor = isEven ? PDF_COLORS.white : PDF_COLORS.gray50;

  drawRect(ctx, margin, y - ROW_HEIGHT + 4, labelWidth, ROW_HEIGHT, PDF_COLORS.gray50);
  drawRect(ctx, margin + labelWidth, y - ROW_HEIGHT + 4, valueWidth, ROW_HEIGHT, bgColor);
  ctx.page.drawRectangle({ x: margin, y: y - ROW_HEIGHT + 4, width: contentWidth, height: ROW_HEIGHT, borderColor: PDF_COLORS.gray200, borderWidth: 0.5 });

  page.drawText(sanitizeTextForWinAnsi(truncateText(label, fonts.helveticaBold, 7, labelWidth - 8)), {
    x: margin + 4, y: y, font: fonts.helveticaBold, size: 7, color: PDF_COLORS.gray400,
  });
  drawValueCell(ctx, margin + labelWidth + 4, y, valueWidth - 8, value);

  return y - ROW_HEIGHT;
}

function drawValueCell(ctx: PdfRenderingContext, x: number, y: number, maxWidth: number, value: string): void {
  const { page, fonts } = ctx;
  if (!value || value === '') {
    page.drawText(sanitizeTextForWinAnsi('nao informado'), {
      x, y, font: fonts.helveticaOblique, size: 8, color: PDF_COLORS.gray300,
    });
  } else {
    page.drawText(sanitizeTextForWinAnsi(truncateText(value, fonts.helvetica, 8, maxWidth)), {
      x, y, font: fonts.helvetica, size: 8, color: PDF_COLORS.gray800,
    });
  }
}

function formatType(type: string): string {
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
