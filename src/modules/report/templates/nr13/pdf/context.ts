/**
 * NR-13 PDF Template — Shared Rendering Context
 *
 * Provides fonts, colors, helper functions and page management
 * for all PDF section modules.
 */
import { PDFDocument, PDFPage, rgb, StandardFonts, PageSizes, RGB, PDFDict } from 'pdf-lib';
import type { TechnicalReport } from '../../../types';
import type { CompanyInfo } from '../types';
import { NR13_COLORS, NR13_LAYOUT } from '../types';

// ============================================================
// PDF-RGB COLORS (converted from hex in NR13_COLORS)
// ============================================================
export const PDF_COLORS = {
  navy: rgb(0.102, 0.153, 0.267),          // #1a2744
  navyLight: rgb(0.165, 0.247, 0.431),     // #2a3f6e
  white: rgb(1, 1, 1),
  gray50: rgb(0.973, 0.984, 0.992),        // #f8fafc
  gray100: rgb(0.945, 0.961, 0.976),       // #f1f5f9
  gray200: rgb(0.886, 0.906, 0.937),       // #e2e8f0
  gray300: rgb(0.796, 0.835, 0.878),       // #cbd5e1
  gray400: rgb(0.580, 0.639, 0.722),       // #94a3b8
  gray500: rgb(0.392, 0.455, 0.545),       // #64748b
  gray600: rgb(0.278, 0.337, 0.412),       // #475569
  gray700: rgb(0.200, 0.255, 0.333),       // #334155
  gray800: rgb(0.118, 0.161, 0.231),       // #1e293b
  green50: rgb(0.941, 0.988, 0.957),       // #f0fdf4
  green100: rgb(0.859, 0.973, 0.898),      // #dcfce7
  green500: rgb(0.133, 0.773, 0.369),      // #22c55e
  green600: rgb(0.086, 0.639, 0.290),      // #16a34a
  green700: rgb(0.082, 0.502, 0.239),      // #15803d
  yellow50: rgb(0.996, 0.988, 0.910),      // #fefce8
  yellow100: rgb(0.992, 0.976, 0.765),     // #fef9c3
  yellow500: rgb(0.918, 0.702, 0.031),     // #eab308
  yellow600: rgb(0.792, 0.541, 0.016),     // #ca8a04
  yellow700: rgb(0.631, 0.384, 0.027),     // #a16207
  red50: rgb(0.992, 0.949, 0.949),         // #fef2f2
  red100: rgb(0.980, 0.890, 0.890),        // #fee2e2
  red500: rgb(0.937, 0.267, 0.267),        // #ef4444
  red600: rgb(0.863, 0.149, 0.149),        // #dc2626
  red700: rgb(0.725, 0.106, 0.106),        // #b91c1c
  blue50: rgb(0.941, 0.969, 1.0),          // #eff6ff
  blue500: rgb(0.231, 0.510, 0.965),       // #3b82f6
  blue600: rgb(0.145, 0.388, 0.922),       // #2563eb
} as const;

// ============================================================
// WINANSI TEXT SANITIZATION
// ============================================================
/**
 * StandardFonts (Helvetica, Courier, etc.) only support WinAnsi encoding.
 * Characters outside WinAnsi (em-dash, checkmarks, emojis, etc.) must be
 * replaced with ASCII equivalents before drawing.
 */
export function sanitizeTextForWinAnsi(text: string): string {
  if (!text) return '';
  return text
    .replace(/\u2014/g, '-')    // em-dash → hyphen
    .replace(/\u2013/g, '-')    // en-dash → hyphen
    .replace(/\u2019/g, "'")   // right single quote
    .replace(/\u2018/g, "'")   // left single quote
    .replace(/\u201C/g, '"')   // left double quote
    .replace(/\u201D/g, '"')   // right double quote
    .replace(/\u2026/g, '...')  // ellipsis → three dots
    .replace(/\u2713/g, '[OK]') // checkmark
    .replace(/\u2717/g, '[X]')  // cross
    .replace(/\u2714/g, '[OK]') // heavy checkmark
    .replace(/\u2716/g, '[X]')  // heavy cross
    .replace(/\u26A0/g, '!')    // warning sign
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, ''); // all emojis → remove
}

/**
 * Wrap a PDFPage so that all drawText calls automatically sanitize
 * text for WinAnsi encoding (StandardFonts).
 */
function wrapPageForWinAnsi(page: PDFPage): PDFPage {
  const originalDrawText = page.drawText.bind(page);
  (page as any).drawText = (text: string, options?: any) => {
    return originalDrawText(sanitizeTextForWinAnsi(text), options);
  };
  return page;
}

// ============================================================
// PDF RENDERING CONTEXT
// ============================================================
export interface PdfRenderingContext {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  fonts: {
    helvetica: typeof StandardFonts.Helvetica extends string ? any : never;
    helveticaBold: any;
    helveticaOblique: any;
    courier: any;
    courierBold: any;
  };
  pageSize: [number, number];
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
  report: TechnicalReport;
  company: CompanyInfo;
}

/**
 * Create a new PDF rendering context.
 */
export async function createPdfContext(
  report: TechnicalReport,
  company: CompanyInfo
): Promise<PdfRenderingContext> {
  const doc = await PDFDocument.create();

  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await doc.embedFont(StandardFonts.HelveticaOblique);
  const courier = await doc.embedFont(StandardFonts.Courier);
  const courierBold = await doc.embedFont(StandardFonts.CourierBold);

  const pageSize = PageSizes.A4;
  const pageWidth = pageSize[0];
  const pageHeight = pageSize[1];
  const margin = NR13_LAYOUT.margin;
  const contentWidth = pageWidth - 2 * margin;

  // Wrap addPage to auto-sanitize all future pages
  const originalAddPage = doc.addPage.bind(doc);
  (doc as any).addPage = (arg?: any) => {
    const newPage = originalAddPage(arg);
    return wrapPageForWinAnsi(newPage);
  };

  // Wrap the initial page as well
  const page = wrapPageForWinAnsi(originalAddPage(pageSize));

  return {
    doc,
    page,
    y: pageHeight - margin,
    fonts: { helvetica, helveticaBold, helveticaOblique, courier, courierBold },
    pageSize,
    pageWidth,
    pageHeight,
    margin,
    contentWidth,
    report,
    company,
  };
}

/**
 * Add a new page to the document and reset y position.
 */
export function addNewPage(ctx: PdfRenderingContext): void {
  ctx.page = ctx.doc.addPage(ctx.pageSize);
  ctx.y = ctx.pageHeight - ctx.margin;
}

/**
 * Check if there's enough space for `lines` lines. If not, add a new page.
 */
export function ensureSpace(ctx: PdfRenderingContext, lines: number = 3, lineHeight: number = 13): void {
  const needed = ctx.margin + lines * lineHeight;
  if (ctx.y < needed) {
    addNewPage(ctx);
  }
}

/**
 * Draw text and return the new y position.
 */
export function drawText(
  ctx: PdfRenderingContext,
  text: string,
  x: number,
  y: number,
  options?: {
    font?: any;
    size?: number;
    color?: RGB;
    maxWidth?: number;
  }
): number {
  const font = options?.font || ctx.fonts.helvetica;
  const size = options?.size || 10;
  const color = options?.color || PDF_COLORS.gray800;
  const maxWidth = options?.maxWidth;

  if (maxWidth) {
    // Word wrap
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      const width = font.widthOfTextAtSize(testLine, size);
      if (width > maxWidth && line) {
        ctx.page.drawText(line, { x, y: currentY, font, size, color });
        currentY -= size * 1.3;
        line = word;
        if (currentY < ctx.margin) {
          addNewPage(ctx);
          currentY = ctx.y;
        }
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.page.drawText(line, { x, y: currentY, font, size, color });
      currentY -= size * 1.3;
    }
    return currentY;
  }

  ctx.page.drawText(text, { x, y, font, size, color });
  return y - size * 1.3;
}

/**
 * Draw a section title with underline. Returns new y.
 */
export function drawSectionTitle(
  ctx: PdfRenderingContext,
  number: number,
  title: string,
  y: number
): number {
  if (y < ctx.margin + 40) {
    addNewPage(ctx);
    y = ctx.y;
  }

  // Number circle (simplified: just draw text)
  const circleX = ctx.margin;
  ctx.page.drawCircle({
    x: circleX + 10,
    y: y + 4,
    size: 10,
    color: PDF_COLORS.navy,
  });
  ctx.page.drawText(`${number}`, {
    x: circleX + 7,
    y: y + 1,
    font: ctx.fonts.helveticaBold,
    size: 9,
    color: PDF_COLORS.white,
  });

  // Title text
  ctx.page.drawText(title, {
    x: circleX + 25,
    y: y,
    font: ctx.fonts.helveticaBold,
    size: 12,
    color: PDF_COLORS.navy,
  });

  y -= 6;

  // Underline
  ctx.page.drawLine({
    start: { x: ctx.margin, y },
    end: { x: ctx.margin + ctx.contentWidth, y },
    thickness: 1.5,
    color: PDF_COLORS.navy,
  });

  y -= 12;
  return y;
}

/**
 * Draw a subsection title. Returns new y.
 */
export function drawSubsectionTitle(
  ctx: PdfRenderingContext,
  title: string,
  y: number
): number {
  // Left border
  ctx.page.drawRectangle({
    x: ctx.margin,
    y: y - 1,
    width: 3,
    height: 14,
    color: PDF_COLORS.navy,
  });

  ctx.page.drawText(title, {
    x: ctx.margin + 8,
    y,
    font: ctx.fonts.helveticaBold,
    size: 10,
    color: PDF_COLORS.gray600,
  });

  return y - 18;
}

/**
 * Draw a filled rectangle.
 */
export function drawRect(
  ctx: PdfRenderingContext,
  x: number,
  y: number,
  width: number,
  height: number,
  color: RGB
): void {
  ctx.page.drawRectangle({ x, y, width, height, color });
}

/**
 * Draw a horizontal line.
 */
export function drawLine(
  ctx: PdfRenderingContext,
  x1: number,
  y: number,
  x2: number,
  thickness: number = 1,
  color: RGB = PDF_COLORS.gray200
): void {
  ctx.page.drawLine({
    start: { x: x1, y },
    end: { x: x2, y },
    thickness,
    color,
  });
}

/**
 * Format a Date to DD/MM/YYYY.
 */
export function formatDateBR(date: Date | string | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Format a Date to long format (DD de Mês de YYYY).
 */
export function formatDateLong(date: Date | string | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

/**
 * Get status display info from an InspectionConclusion value.
 */
export function getStatusDisplay(status: string): { label: string; color: 'green' | 'yellow' | 'red' | 'gray' } {
  switch (status) {
    case 'INTEGRO': return { label: 'APROVADO', color: 'green' };
    case 'ACEITAVEL_COM_RESTRICOES': return { label: 'APROVADO COM RESTRIÇÕES', color: 'yellow' };
    case 'REQUER_REPARO': return { label: 'REQUER REPARO', color: 'red' };
    case 'CONDENADO': return { label: 'REPROVADO / NÃO CONFORME', color: 'red' };
    default: return { label: 'INDETERMINADO', color: 'gray' };
  }
}

/**
 * Get the background and text RGB colors for a status color key.
 */
export function getStatusColors(colorKey: 'green' | 'yellow' | 'red' | 'gray'): {
  bg: RGB;
  text: RGB;
  border: RGB;
  badgeBg: RGB;
  badgeText: RGB;
} {
  switch (colorKey) {
    case 'green':
      return {
        bg: PDF_COLORS.green50,
        text: PDF_COLORS.green700,
        border: PDF_COLORS.green100,
        badgeBg: PDF_COLORS.green100,
        badgeText: PDF_COLORS.green700,
      };
    case 'yellow':
      return {
        bg: PDF_COLORS.yellow50,
        text: PDF_COLORS.yellow700,
        border: PDF_COLORS.yellow100,
        badgeBg: PDF_COLORS.yellow100,
        badgeText: PDF_COLORS.yellow700,
      };
    case 'red':
      return {
        bg: PDF_COLORS.red50,
        text: PDF_COLORS.red700,
        border: PDF_COLORS.red100,
        badgeBg: PDF_COLORS.red100,
        badgeText: PDF_COLORS.red700,
      };
    default:
      return {
        bg: PDF_COLORS.gray50,
        text: PDF_COLORS.gray600,
        border: PDF_COLORS.gray200,
        badgeBg: PDF_COLORS.gray100,
        badgeText: PDF_COLORS.gray600,
      };
  }
}

/**
 * Get criticality display colors.
 */
export function getCriticalityColors(level: string): { bg: RGB; text: RGB } {
  switch (level) {
    case 'LOW': return { bg: PDF_COLORS.green100, text: PDF_COLORS.green700 };
    case 'MEDIUM': return { bg: PDF_COLORS.yellow100, text: PDF_COLORS.yellow700 };
    case 'HIGH': return { bg: PDF_COLORS.red100, text: PDF_COLORS.red700 };
    case 'CRITICAL': return { bg: PDF_COLORS.red700, text: PDF_COLORS.white };
    default: return { bg: PDF_COLORS.gray100, text: PDF_COLORS.gray600 };
  }
}
