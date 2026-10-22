/**
 * NR-13 PDF Template — Emission Banners (Lote 23A)
 *
 * Tarjas EXPLÍCITAS e PERSISTENTES para documentos de demonstração:
 * - Página de capa: faixa vermelha logo abaixo da barra de marca.
 * - Todas as demais páginas: faixa vermelha na zona do rodapé.
 *
 * Além disso, expõe o bloco de avisos de emissão ("AVISOS DE EMISSÃO")
 * para a seção de conclusão, usado quando há fórmulas não validadas.
 */
import { rgb } from 'pdf-lib';
import type { PdfRenderingContext } from './context';
import { REPORT_DESIGN, wrapTextLines, LAYOUT } from './context';
import {
  DEMO_BANNER_TEXT,
  DEMO_NO_CLAIM_TEXT,
  PLACEHOLDER_WARNING_TEXT,
  type EmissionAssessment,
} from '../../../safety/emission';

const DEMO_RED = rgb(0.75, 0.05, 0.05);
const DEMO_RED_DARK = rgb(0.55, 0.03, 0.03);
const WHITE = rgb(1, 1, 1);

/**
 * Estampa a faixa de demonstração em TODAS as páginas do documento.
 * Chamado no pass 2 (depois do conteúdo, junto com rodapés/cabeçalhos).
 */
export function stampDemoBanners(ctx: PdfRenderingContext): void {
  const pages = ctx.doc.getPages();
  for (let i = 0; i < pages.length; i++) {
    if (i === 0) {
      stampCoverBanner(ctx, pages[i]);
    } else {
      stampFooterBanner(ctx, pages[i]);
    }
  }
}

function stampCoverBanner(ctx: PdfRenderingContext, page: any): void {
  // Faixa vermelha imediatamente abaixo da barra de marca (80pt + 3pt de acento).
  const bandY = ctx.pageHeight - 80 - 3 - 18;
  page.drawRectangle({
    x: 0, y: bandY, width: ctx.pageWidth, height: 18, color: DEMO_RED,
  });
  const label = `${DEMO_BANNER_TEXT} - ${DEMO_NO_CLAIM_TEXT}`;
  const width = ctx.fonts.helveticaBold.widthOfTextAtSize(label, 9);
  page.drawText(label, {
    x: (ctx.pageWidth - width) / 2, y: bandY + 6,
    font: ctx.fonts.helveticaBold, size: 9, color: WHITE,
  });
}

function stampFooterBanner(ctx: PdfRenderingContext, page: any): void {
  // Zona do rodapé: faixa vermelha entre o limite do conteúdo e o texto do rodapé.
  const bandY = LAYOUT.margin + 4;
  const bandX = LAYOUT.margin - 12;
  page.drawRectangle({
    x: bandX, y: bandY,
    width: LAYOUT.pageWidth - 2 * bandX, height: 14,
    color: DEMO_RED,
  });
  const label = DEMO_BANNER_TEXT;
  const width = ctx.fonts.helveticaBold.widthOfTextAtSize(label, 7.5);
  page.drawText(label, {
    x: (LAYOUT.pageWidth - width) / 2, y: bandY + 4.5,
    font: ctx.fonts.helveticaBold, size: 7.5, color: WHITE,
  });
}

/**
 * Bloco de aviso "AVISOS DE EMISSÃO" para a seção de conclusão.
 * Desenha em `y` (topo do bloco) e retorna o novo `y`.
 */
export function drawEmissionWarningsBlock(
  ctx: PdfRenderingContext,
  y: number,
  assessment: EmissionAssessment
): number {
  const { margin, contentWidth, fonts } = ctx;

  const lines = buildWarningLines(assessment);

  const textLines: string[] = [];
  for (const line of lines) {
    textLines.push(
      ...wrapTextLines(line, fonts.helveticaBold, 7.5, contentWidth - 16)
    );
  }

  const lineHeight = 10;
  const boxHeight = textLines.length * lineHeight + 10;

  ctx.page.drawRectangle({
    x: margin, y: y - boxHeight, width: contentWidth, height: boxHeight,
    color: rgb(0.992, 0.945, 0.941), borderColor: DEMO_RED_DARK, borderWidth: 1,
  });
  ctx.page.drawRectangle({
    x: margin, y: y - boxHeight, width: 3, height: boxHeight, color: DEMO_RED,
  });

  let ty = y - 10;
  for (const line of textLines) {
    ctx.page.drawText(line, {
      x: margin + 8, y: ty, font: fonts.helveticaBold, size: 7.5, color: DEMO_RED_DARK,
    });
    ty -= lineHeight;
  }

  return y - boxHeight - 8;
}

/** Altura estimada do bloco de avisos (para paginação do builder). */
export function estimateEmissionWarningsHeight(
  ctx: PdfRenderingContext,
  assessment: EmissionAssessment
): number {
  const { contentWidth, fonts } = ctx;
  const lines = buildWarningLines(assessment);
  let count = 0;
  for (const line of lines) {
    count += wrapTextLines(line, fonts.helveticaBold, 7.5, contentWidth - 16).length;
  }
  return count * 10 + 10 + 8; // texto + padding + gap
}

function buildWarningLines(assessment: EmissionAssessment): string[] {
  const lines: string[] = [DEMO_BANNER_TEXT, DEMO_NO_CLAIM_TEXT];
  if (assessment.placeholderFormulas.length > 0) {
    lines.push(PLACEHOLDER_WARNING_TEXT);
    lines.push(
      `Fórmulas/cálculos não validados: ${assessment.placeholderFormulas.join(', ')}.`
    );
  }
  lines.push(
    'Valores de taxa de corrosão, vida útil e PMTA NÃO devem ser tratados como resultados técnicos definitivos.'
  );
  return lines;
}
