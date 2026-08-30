/**
 * NR-13 PDF Template — Shared Rendering Context & Layout Engine
 *
 * Layout Architecture:
 * - Content Safe Area: header + footer are reserved zones
 * - addNewPage() reserves compact header space by default (70pt)
 * - ensureSpace() checks before drawing — creates new page if needed
 * - Footer zone (margin + 20pt) is always preserved
 * - Content never enters header or footer zones
 */
import { PDFDocument, PDFPage, PDFFont, rgb, StandardFonts, PageSizes, RGB } from 'pdf-lib';
import type { TechnicalReport } from '../../../types';
import type { CompanyInfo } from '../types';
import { NR13_COLORS, NR13_LAYOUT } from '../types';

// ============================================================
// GLOBAL WINANSI PROTOTYPE PATCH
// ============================================================
const _origDrawText = PDFPage.prototype.drawText;
PDFPage.prototype.drawText = function (text: any, options?: any) {
  if (typeof text === 'string') {
    text = sanitizeTextForWinAnsi(text);
  }
  return _origDrawText.call(this, text, options);
};
const _origWidthOfTextAtSize = PDFFont.prototype.widthOfTextAtSize;
PDFFont.prototype.widthOfTextAtSize = function (text: any, size?: any) {
  if (typeof text === 'string') {
    text = sanitizeTextForWinAnsi(text);
  }
  return _origWidthOfTextAtSize.call(this, text, size);
};

// ============================================================
// LAYOUT CONSTANTS — Content Safe Area
// ============================================================
export const LAYOUT = {
  pageWidth: 595.28,    // A4 width
  pageHeight: 841.89,   // A4 height
  margin: 45,           // side margins
  headerHeightCompact: 36,   // compact header: logo + report info + separator
  headerHeightFull: 80,      // full header: logo + title + control + faixa
  footerHeight: 20,          // footer: separator + text
  get contentWidth() { return this.pageWidth - 2 * this.margin; },
  /** Usable content height with compact header (pages 3+) */
  get contentHeightCompact() {
    return this.pageHeight - 2 * this.margin - this.headerHeightCompact - this.footerHeight;
  },
  /** Usable content height with full header (page 2) */
  get contentHeightFull() {
    return this.pageHeight - 2 * this.margin - this.headerHeightFull - this.footerHeight;
  },
  /** Minimum space to keep at bottom of page (footer + some padding) */
  get footerReserve() { return this.margin + this.footerHeight + 4; },
  sectionGap: 14,
  subsectionGap: 8,
} as const;

// ============================================================
// PDF-RGB COLORS
// ============================================================
export const PDF_COLORS = {
  navy: rgb(0.102, 0.153, 0.267),
  navyLight: rgb(0.165, 0.247, 0.431),
  white: rgb(1, 1, 1),
  gray50: rgb(0.973, 0.984, 0.992),
  gray100: rgb(0.945, 0.961, 0.976),
  gray200: rgb(0.886, 0.906, 0.937),
  gray300: rgb(0.796, 0.835, 0.878),
  gray400: rgb(0.580, 0.639, 0.722),
  gray500: rgb(0.392, 0.455, 0.545),
  gray600: rgb(0.278, 0.337, 0.412),
  gray700: rgb(0.200, 0.255, 0.333),
  gray800: rgb(0.118, 0.161, 0.231),
  green50: rgb(0.941, 0.988, 0.957),
  green100: rgb(0.859, 0.973, 0.898),
  green500: rgb(0.133, 0.773, 0.369),
  green600: rgb(0.086, 0.639, 0.290),
  green700: rgb(0.082, 0.502, 0.239),
  yellow50: rgb(0.996, 0.988, 0.910),
  yellow100: rgb(0.992, 0.976, 0.765),
  yellow500: rgb(0.918, 0.702, 0.031),
  yellow600: rgb(0.792, 0.541, 0.016),
  yellow700: rgb(0.631, 0.384, 0.027),
  red50: rgb(0.992, 0.949, 0.949),
  red100: rgb(0.980, 0.890, 0.890),
  red500: rgb(0.937, 0.267, 0.267),
  red600: rgb(0.863, 0.149, 0.149),
  red700: rgb(0.725, 0.106, 0.106),
  blue50: rgb(0.941, 0.969, 1.0),
  blue500: rgb(0.231, 0.510, 0.965),
  blue600: rgb(0.145, 0.388, 0.922),
} as const;

// ============================================================
// WINANSI TEXT SANITIZATION
// ============================================================
export function sanitizeTextForWinAnsi(text: string): string {
  if (!text) return '';
  const replacements: [string, string][] = [
    ['\u2014', '-'], ['\u2013', '-'], ['\u2019', "'"], ['\u2018', "'"],
    ['\u201C', '"'], ['\u201D', '"'], ['\u2026', '...'],
    ['\u2713', '[OK]'], ['\u2717', '[X]'], ['\u2714', '[OK]'], ['\u2716', '[X]'],
    ['\u26A0', '!'], ['\u26A1', '!'], ['\u00D7', 'x'], ['\u00F7', '/'],
    ['\u2265', '>='], ['\u2264', '<='], ['\u2260', '!='], ['\u2248', '~'],
    ['\u221E', 'inf'], ['\u00B2', '2'], ['\u00B3', '3'],
    ['\u00B0', ' deg'], ['\u00BA', 'o'], ['\u00AA', 'a'],
    ['\u00BC', '1/4'], ['\u00BD', '1/2'], ['\u00BE', '3/4'],
  ];
  let result = text;
  for (const [char, replacement] of replacements) {
    result = result.split(char).join(replacement);
  }
  result = result.replace(/[\u{1F000}-\u{1FFFF}]/gu, '');
  return result;
}

// ============================================================
// PDF RENDERING CONTEXT
// ============================================================
export interface PdfRenderingContext {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  fonts: {
    helvetica: any;
    helveticaBold: any;
    helveticaOblique: any;
    courier: any;
    courierBold: any;
  };
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
  report: TechnicalReport;
  company: CompanyInfo;
  pageNumber: number;
}

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

  const pageWidth = LAYOUT.pageWidth;
  const pageHeight = LAYOUT.pageHeight;
  const margin = LAYOUT.margin;
  const page = doc.addPage([pageWidth, pageHeight]);

  return {
    doc, page,
    y: pageHeight - margin,
    fonts: { helvetica, helveticaBold, helveticaOblique, courier, courierBold },
    pageWidth, pageHeight, margin,
    contentWidth: LAYOUT.contentWidth,
    report, company,
    pageNumber: 1,
  };
}

/**
 * Add a new page. Content starts below the COMPACT header zone.
 * This is the default for all content pages after the cover.
 */
export function addNewPage(ctx: PdfRenderingContext): void {
  ctx.page = ctx.doc.addPage([ctx.pageWidth, ctx.pageHeight]);
  ctx.pageNumber++;
  // Content starts below compact header zone
  ctx.y = ctx.pageHeight - ctx.margin - LAYOUT.headerHeightCompact;
}

/**
 * Add a new page with the FULL header (for the first content page only).
 */
export function addNewPageFullHeader(ctx: PdfRenderingContext): void {
  ctx.page = ctx.doc.addPage([ctx.pageWidth, ctx.pageHeight]);
  ctx.pageNumber++;
  ctx.y = ctx.pageHeight - ctx.margin - LAYOUT.headerHeightFull;
}

/**
 * Get available vertical space on the current page.
 * This is the distance from current y down to the footer zone.
 */
export function getAvailableHeight(ctx: PdfRenderingContext): number {
  return ctx.y - LAYOUT.footerReserve;
}

/**
 * Ensure there is enough vertical space. If not, create a new page.
 * Returns the (possibly updated) y position.
 */
export function ensureSpace(ctx: PdfRenderingContext, neededHeight: number): number {
  if (getAvailableHeight(ctx) < neededHeight) {
    addNewPage(ctx);
  }
  return ctx.y;
}

// ============================================================
// TEXT DRAWING HELPERS
// ============================================================

export function drawText(
  ctx: PdfRenderingContext,
  text: string,
  x: number,
  y: number,
  options?: { font?: any; size?: number; color?: RGB; maxWidth?: number; lineHeight?: number }
): number {
  const font = options?.font || ctx.fonts.helvetica;
  const size = options?.size || 10;
  const color = options?.color || PDF_COLORS.gray800;
  const maxWidth = options?.maxWidth;
  const lineHeight = options?.lineHeight || size * 1.35;

  if (maxWidth) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      const width = font.widthOfTextAtSize(testLine, size);
      if (width > maxWidth && line) {
        ctx.page.drawText(sanitizeTextForWinAnsi(line), { x, y: currentY, font, size, color });
        currentY -= lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.page.drawText(sanitizeTextForWinAnsi(line), { x, y: currentY, font, size, color });
      currentY -= lineHeight;
    }
    return currentY;
  }

  ctx.page.drawText(sanitizeTextForWinAnsi(text), { x, y, font, size, color });
  return y - lineHeight;
}

export function estimateWrappedTextHeight(
  ctx: PdfRenderingContext,
  text: string,
  maxWidth: number,
  fontSize: number,
  lineHeight?: number
): number {
  const font = ctx.fonts.helvetica;
  const lh = lineHeight || fontSize * 1.35;
  const words = text.split(' ');
  let line = '';
  let lines = 1;
  for (const word of words) {
    const testLine = line + (line ? ' ' : '') + word;
    if (font.widthOfTextAtSize(testLine, fontSize) > maxWidth && line) {
      lines++;
      line = word;
    } else {
      line = testLine;
    }
  }
  return lines * lh;
}

// ============================================================
// SECTION TITLES
// ============================================================

export const SECTION_TITLE_HEIGHT = 26;
export const SUBSECTION_TITLE_HEIGHT = 18;

export function drawSectionTitle(
  ctx: PdfRenderingContext,
  number: number,
  title: string,
  y: number
): number {
  const circleX = ctx.margin;
  ctx.page.drawCircle({ x: circleX + 10, y: y + 4, size: 10, color: PDF_COLORS.navy });
  ctx.page.drawText(sanitizeTextForWinAnsi(`${number}`), {
    x: circleX + 7, y: y + 1,
    font: ctx.fonts.helveticaBold, size: 9, color: PDF_COLORS.white,
  });
  ctx.page.drawText(sanitizeTextForWinAnsi(title), {
    x: circleX + 25, y,
    font: ctx.fonts.helveticaBold, size: 11, color: PDF_COLORS.navy,
  });
  y -= 6;
  ctx.page.drawLine({
    start: { x: ctx.margin, y },
    end: { x: ctx.margin + ctx.contentWidth, y },
    thickness: 1.5, color: PDF_COLORS.navy,
  });
  y -= 10;
  return y;
}

export function drawSubsectionTitle(
  ctx: PdfRenderingContext,
  title: string,
  y: number
): number {
  ctx.page.drawRectangle({ x: ctx.margin, y: y - 1, width: 3, height: 14, color: PDF_COLORS.navy });
  ctx.page.drawText(sanitizeTextForWinAnsi(title), {
    x: ctx.margin + 8, y,
    font: ctx.fonts.helveticaBold, size: 9, color: PDF_COLORS.gray600,
  });
  return y - 18;
}

// ============================================================
// DRAWING PRIMITIVES
// ============================================================

export function drawRect(ctx: PdfRenderingContext, x: number, y: number, width: number, height: number, color: RGB): void {
  ctx.page.drawRectangle({ x, y, width, height, color });
}

export function drawLine(ctx: PdfRenderingContext, x1: number, y: number, x2: number, thickness: number = 1, color: RGB = PDF_COLORS.gray200): void {
  ctx.page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color });
}

// ============================================================
// FORMATTING
// ============================================================

export function formatDateBR(date: Date | string | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateLong(date: Date | string | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function getStatusDisplay(status: string): { label: string; color: 'green' | 'yellow' | 'red' | 'gray' } {
  switch (status) {
    case 'INTEGRO': return { label: 'APROVADO', color: 'green' };
    case 'ACEITAVEL_COM_RESTRICOES': return { label: 'APROVADO COM RESTRICOES', color: 'yellow' };
    case 'REQUER_REPARO': return { label: 'REQUER REPARO', color: 'red' };
    case 'CONDENADO': return { label: 'REPROVADO / NAO CONFORME', color: 'red' };
    default: return { label: 'INDETERMINADO', color: 'gray' };
  }
}

export function getStatusColors(colorKey: 'green' | 'yellow' | 'red' | 'gray') {
  switch (colorKey) {
    case 'green': return { bg: PDF_COLORS.green50, text: PDF_COLORS.green700, border: PDF_COLORS.green100, badgeBg: PDF_COLORS.green100, badgeText: PDF_COLORS.green700 };
    case 'yellow': return { bg: PDF_COLORS.yellow50, text: PDF_COLORS.yellow700, border: PDF_COLORS.yellow100, badgeBg: PDF_COLORS.yellow100, badgeText: PDF_COLORS.yellow700 };
    case 'red': return { bg: PDF_COLORS.red50, text: PDF_COLORS.red700, border: PDF_COLORS.red100, badgeBg: PDF_COLORS.red100, badgeText: PDF_COLORS.red700 };
    default: return { bg: PDF_COLORS.gray50, text: PDF_COLORS.gray600, border: PDF_COLORS.gray200, badgeBg: PDF_COLORS.gray100, badgeText: PDF_COLORS.gray600 };
  }
}

export function getCriticalityColors(level: string): { bg: RGB; text: RGB } {
  switch (level) {
    case 'LOW': return { bg: PDF_COLORS.green100, text: PDF_COLORS.green700 };
    case 'MEDIUM': return { bg: PDF_COLORS.yellow100, text: PDF_COLORS.yellow700 };
    case 'HIGH': return { bg: PDF_COLORS.red100, text: PDF_COLORS.red700 };
    case 'CRITICAL': return { bg: PDF_COLORS.red700, text: PDF_COLORS.white };
    default: return { bg: PDF_COLORS.gray100, text: PDF_COLORS.gray600 };
  }
}

// ============================================================
// TEXT UTILITIES
// ============================================================

export function truncateText(text: string, font: any, size: number, maxWidth: number): string {
  if (!text) return '';
  const safe = sanitizeTextForWinAnsi(text);
  if (font.widthOfTextAtSize(safe, size) <= maxWidth) return safe;
  let truncated = safe;
  while (truncated.length > 3 && font.widthOfTextAtSize(truncated + '...', size) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}

export function wrapTextLines(text: string, font: any, size: number, maxWidth: number): string[] {
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

export function safeStr(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val);
}
