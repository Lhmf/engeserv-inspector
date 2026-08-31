/**
 * NR-13 PDF Template — Shared Rendering Context & Layout Engine
 *
 * Layout Architecture:
 * - Content Safe Area: header + footer are reserved zones
 * - addNewPage() reserves compact header space by default (36pt)
 * - ensureSpace() checks before drawing — creates new page if needed
 * - Footer zone (margin + 20pt) is always preserved
 * - Content never enters header or footer zones
 *
 * Design System (REPORT_DESIGN):
 * - Centralized visual constants for consistent professional appearance
 * - All colors, typography, spacing defined in one place
 * - Heights must match what pagination uses — DO NOT change heights here
 *   without updating estimateHeight functions in each module
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
  headerHeightFull: 88,      // full header: logo + title + control + faixa (actual drawn height=84, +4pt gap)
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
// REPORT DESIGN SYSTEM — Centralized Visual Constants
// ============================================================
export const REPORT_DESIGN = {
  // === COLOR PALETTE ===
  // Primary: deep navy for authority and professionalism
  // Accent: teal-blue for highlights
  // Neutral: warm grays for text and borders
  colors: {
    // Primary brand
    primary: rgb(0.082, 0.145, 0.294),        // Deep navy #15254B
    primaryDark: rgb(0.055, 0.102, 0.216),     // Darker navy
    primaryLight: rgb(0.125, 0.227, 0.447),    // Lighter navy for accents
    accent: rgb(0.145, 0.400, 0.565),          // Teal accent #256690

    // Status colors — muted, professional
    statusGreen: rgb(0.133, 0.565, 0.290),     // Professional green
    statusGreenBg: rgb(0.941, 0.980, 0.949),   // Light green bg
    statusGreenBorder: rgb(0.780, 0.922, 0.808),
    statusYellow: rgb(0.761, 0.549, 0.024),    // Professional amber
    statusYellowBg: rgb(0.996, 0.984, 0.906),
    statusYellowBorder: rgb(0.957, 0.902, 0.678),
    statusRed: rgb(0.820, 0.141, 0.118),       // Professional red
    statusRedBg: rgb(0.992, 0.945, 0.941),
    statusRedBorder: rgb(0.961, 0.820, 0.812),

    // Priority badges
    priorityCritical: rgb(0.820, 0.141, 0.118),
    priorityCriticalBg: rgb(0.820, 0.141, 0.118),
    priorityHigh: rgb(0.886, 0.345, 0.133),
    priorityHighBg: rgb(0.992, 0.945, 0.941),
    priorityMedium: rgb(0.761, 0.549, 0.024),
    priorityMediumBg: rgb(0.996, 0.984, 0.906),
    priorityLow: rgb(0.392, 0.455, 0.545),
    priorityLowBg: rgb(0.945, 0.961, 0.976),

    // Neutral palette — warm grays
    white: rgb(1, 1, 1),
    offWhite: rgb(0.992, 0.988, 0.984),
    gray50: rgb(0.976, 0.973, 0.969),
    gray100: rgb(0.949, 0.945, 0.941),
    gray200: rgb(0.894, 0.886, 0.878),
    gray300: rgb(0.808, 0.800, 0.792),
    gray400: rgb(0.620, 0.608, 0.596),
    gray500: rgb(0.455, 0.447, 0.439),
    gray600: rgb(0.337, 0.333, 0.329),
    gray700: rgb(0.235, 0.231, 0.227),
    gray800: rgb(0.145, 0.141, 0.137),
    gray900: rgb(0.082, 0.078, 0.078),

    // Table colors
    tableHeader: rgb(0.082, 0.145, 0.294),     // Navy
    tableHeaderText: rgb(1, 1, 1),
    tableRowEven: rgb(1, 1, 1),
    tableRowOdd: rgb(0.976, 0.973, 0.969),     // Off-white
    tableBorder: rgb(0.894, 0.886, 0.878),
    tableLabel: rgb(0.565, 0.557, 0.549),       // Muted label

    // Indicator card colors
    indicatorBg: rgb(0.976, 0.973, 0.969),
    indicatorBorder: rgb(0.922, 0.914, 0.906),
    indicatorLabel: rgb(0.565, 0.557, 0.549),
    indicatorValue: rgb(0.145, 0.141, 0.137),

    // Photo card
    photoBg: rgb(0.976, 0.973, 0.969),
    photoBorder: rgb(0.894, 0.886, 0.878),

    // Section accent
    sectionAccent: rgb(0.082, 0.145, 0.294),    // Left border accent
    sectionNumber: rgb(1, 1, 1),
    sectionTitle: rgb(0.082, 0.145, 0.294),
    sectionSubtitle: rgb(0.455, 0.447, 0.439),
    sectionLine: rgb(0.894, 0.886, 0.878),
  },

  // === TYPOGRAPHY SIZES ===
  // Cover
  coverTitle: 36,
  coverSubtitle: 18,
  coverLabel: 8,
  coverValue: 12,
  coverSmall: 7,

  // Section titles
  sectionNumberSize: 9,
  sectionTitleSize: 11,
  sectionTitleItalic: 9,
  sectionLineWidth: 1,

  // Subsection titles
  subsectionSize: 9,

  // Body
  bodySize: 8,
  bodySmall: 7,
  bodyTiny: 6,
  labelSize: 7,
  valueSize: 8,
  valueLarge: 10,
  valueXLarge: 18,

  // Table
  tableHeaderSize: 7,
  tableCellSize: 8,
  tableLabelSize: 6.5,

  // Indicator
  indicatorLabelSize: 6.5,
  indicatorValueSize: 10,

  // Footer
  footerSize: 6,
  footerLineWeight: 0.5,

  // === SPACING ===
  sectionGap: 14,
  subsectionGap: 8,
  rowGap: 4,
  cardPadding: 6,
  innerPadding: 6,
} as const;

// ============================================================
// PDF-RGB COLORS (kept for backward compatibility)
// ============================================================
export const PDF_COLORS = REPORT_DESIGN.colors;

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
  // Content starts below compact header zone PLUS safety gap
  ctx.y = ctx.pageHeight - ctx.margin - LAYOUT.headerHeightCompact - 4;
}

/**
 * Add a new page with the FULL header (for the first content page only).
 */
export function addNewPageFullHeader(ctx: PdfRenderingContext): void {
  ctx.page = ctx.doc.addPage([ctx.pageWidth, ctx.pageHeight]);
  ctx.pageNumber++;
  // Content starts below full header zone PLUS a safety gap to prevent
  // visual overlap when headers are stamped in pass 2.
  ctx.y = ctx.pageHeight - ctx.margin - LAYOUT.headerHeightFull - 4;
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
  const color = options?.color || REPORT_DESIGN.colors.gray800;
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
// SECTION TITLES — Redesigned with left accent bar
// ============================================================

export const SECTION_TITLE_HEIGHT = 26;
export const SUBSECTION_TITLE_HEIGHT = 18;

export function drawSectionTitle(
  ctx: PdfRenderingContext,
  number: number,
  title: string,
  y: number,
  subtitle?: string
): number {
  const { margin, contentWidth, fonts } = ctx;
  const D = REPORT_DESIGN;

  // Left accent bar (thin, tall)
  ctx.page.drawRectangle({
    x: margin, y: y - 14, width: 3, height: 14,
    color: D.colors.sectionAccent,
  });

  // Section number — left-aligned, bold
  const numText = String(number).padStart(2, '0');
  ctx.page.drawText(sanitizeTextForWinAnsi(numText), {
    x: margin + 8, y,
    font: fonts.helveticaBold, size: D.sectionNumberSize, color: D.colors.sectionAccent,
  });

  // Section title
  const numWidth = fonts.helveticaBold.widthOfTextAtSize(numText, D.sectionNumberSize);
  ctx.page.drawText(sanitizeTextForWinAnsi(title), {
    x: margin + 8 + numWidth + 6, y,
    font: fonts.helveticaBold, size: D.sectionTitleSize, color: D.colors.sectionTitle,
  });

  // Optional subtitle (e.g., "CONTINUACAO")
  if (subtitle) {
    const titleWidth = fonts.helveticaBold.widthOfTextAtSize(title, D.sectionTitleSize);
    ctx.page.drawText(sanitizeTextForWinAnsi(` - ${subtitle}`), {
      x: margin + 8 + numWidth + 6 + titleWidth + 4, y,
      font: fonts.helveticaOblique, size: D.sectionTitleItalic, color: D.colors.sectionSubtitle,
    });
  }

  // Subtle bottom line
  y -= 6;
  ctx.page.drawLine({
    start: { x: margin, y },
    end: { x: margin + contentWidth, y },
    thickness: D.sectionLineWidth, color: D.colors.sectionLine,
  });
  y -= 14;
  return y;
}

export function drawSubsectionTitle(
  ctx: PdfRenderingContext,
  title: string,
  y: number
): number {
  const D = REPORT_DESIGN;
  ctx.page.drawRectangle({ x: ctx.margin, y: y - 1, width: 3, height: 12, color: D.colors.sectionAccent });
  ctx.page.drawText(sanitizeTextForWinAnsi(title), {
    x: ctx.margin + 8, y,
    font: ctx.fonts.helveticaBold, size: D.subsectionSize, color: D.colors.gray600,
  });
  return y - 18;
}

// ============================================================
// DRAWING PRIMITIVES
// ============================================================

export function drawRect(ctx: PdfRenderingContext, x: number, y: number, width: number, height: number, color: RGB): void {
  ctx.page.drawRectangle({ x, y, width, height, color });
}

export function drawLine(ctx: PdfRenderingContext, x1: number, y: number, x2: number, thickness: number = 1, color: RGB = REPORT_DESIGN.colors.tableBorder): void {
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
  const D = REPORT_DESIGN;
  switch (colorKey) {
    case 'green': return { bg: D.colors.statusGreenBg, text: D.colors.statusGreen, border: D.colors.statusGreenBorder, badgeBg: D.colors.statusGreenBg, badgeText: D.colors.statusGreen };
    case 'yellow': return { bg: D.colors.statusYellowBg, text: D.colors.statusYellow, border: D.colors.statusYellowBorder, badgeBg: D.colors.statusYellowBg, badgeText: D.colors.statusYellow };
    case 'red': return { bg: D.colors.statusRedBg, text: D.colors.statusRed, border: D.colors.statusRedBorder, badgeBg: D.colors.statusRedBg, badgeText: D.colors.statusRed };
    default: return { bg: D.colors.gray50, text: D.colors.gray500, border: D.colors.gray200, badgeBg: D.colors.gray100, badgeText: D.colors.gray500 };
  }
}

export function getCriticalityColors(level: string): { bg: RGB; text: RGB } {
  const D = REPORT_DESIGN;
  switch (level) {
    case 'LOW': return { bg: D.colors.statusGreenBg, text: D.colors.statusGreen };
    case 'MEDIUM': return { bg: D.colors.statusYellowBg, text: D.colors.statusYellow };
    case 'HIGH': return { bg: D.colors.statusRedBg, text: D.colors.statusRed };
    case 'CRITICAL': return { bg: D.colors.statusRed, text: D.colors.white };
    default: return { bg: D.colors.gray100, text: D.colors.gray500 };
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
