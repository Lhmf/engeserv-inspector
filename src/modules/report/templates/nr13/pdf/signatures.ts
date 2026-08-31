/**
 * NR-13 PDF Template — Signatures (Responsabilidade Tecnica)
 *
 * Keep-together block: the entire section title + 3 signature blocks
 * move to a new page if they don't fit. Never split the block.
 * Redesigned with REPORT_DESIGN for cleaner professional appearance.
 */
import type { PdfRenderingContext } from './context';
import { REPORT_DESIGN, drawSectionTitle, drawRect, drawLine, formatDateBR, LAYOUT, getAvailableHeight, addNewPage, SECTION_TITLE_HEIGHT } from './context';
import { sanitizeTextForWinAnsi } from './context';

const BLOCK_HEIGHT = 80;
const SIGNATURES_INTRO_HEIGHT = 16;

/**
 * Estimate height of the entire signatures section.
 * Used by builder for keep-together decision.
 */
export function estimateSignaturesHeight(ctx: PdfRenderingContext): number {
  let height = SECTION_TITLE_HEIGHT; // section title
  height += SIGNATURES_INTRO_HEIGHT; // intro text
  height += BLOCK_HEIGHT + 16; // signature blocks + gap
  if (ctx.report.identification.artNumber) {
    height += 12; // ART badge
  }
  return height;
}

export function drawSignaturesPdf(ctx: PdfRenderingContext, y: number): number {
  const { margin, contentWidth, fonts, report } = ctx;
  const D = REPORT_DESIGN;
  const { signatures, identification } = report;

  y = drawSectionTitle(ctx, 8, 'RESPONSABILIDADE TÉCNICA', y);

  ctx.page.drawText(sanitizeTextForWinAnsi('O presente laudo técnico é de responsabilidade dos profissionais abaixo assinados,'), {
    x: margin, y, font: fonts.helvetica, size: 7, color: D.colors.gray500,
  });
  y -= 9;
  ctx.page.drawText(sanitizeTextForWinAnsi('conforme legislação vigente e normas técnicas aplicáveis.'), {
    x: margin, y, font: fonts.helvetica, size: 7, color: D.colors.gray500,
  });
  y -= 16;

  const blockWidth = (contentWidth - 20) / 3;

  const blocks = [
    {
      role: 'ELABORAÇÃO',
      name: identification.inspectorName,
      registration: signatures.inspector?.userRegistration,
      title: 'Inspetor Técnico',
      signature: signatures.inspector,
    },
    {
      role: 'VERIFICAÇÃO',
      name: identification.engineerName || '-',
      registration: signatures.engineer?.userRegistration,
      title: 'Engenheiro Responsável',
      signature: signatures.engineer,
    },
    {
      role: 'APROVAÇÃO',
      name: identification.managerName || '-',
      registration: signatures.manager?.userRegistration,
      title: 'Gestor Técnico',
      signature: signatures.manager,
    },
  ];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockX = margin + i * (blockWidth + 10);
    const isSigned = block.signature && block.signature.status === 'APPROVED';

    // Card background
    ctx.page.drawRectangle({
      x: blockX, y: y - BLOCK_HEIGHT, width: blockWidth, height: BLOCK_HEIGHT,
      borderColor: isSigned ? D.colors.statusGreenBorder : D.colors.gray200,
      borderWidth: 0.5,
      color: isSigned ? D.colors.statusGreenBg : D.colors.white,
    });

    // Role title
    ctx.page.drawText(sanitizeTextForWinAnsi(block.role), {
      x: blockX + 4, y: y - 12, font: fonts.helveticaBold, size: 7, color: D.colors.primary,
    });

    // Status badge
    if (isSigned) {
      ctx.page.drawRectangle({ x: blockX + blockWidth - 50, y: y - 14, width: 46, height: 10, color: D.colors.statusGreenBg });
      ctx.page.drawText(sanitizeTextForWinAnsi('Assinado'), {
        x: blockX + blockWidth - 46, y: y - 12, font: fonts.helveticaBold, size: 6, color: D.colors.statusGreen,
      });
    } else {
      ctx.page.drawRectangle({ x: blockX + blockWidth - 42, y: y - 14, width: 38, height: 10, color: D.colors.gray100 });
      ctx.page.drawText(sanitizeTextForWinAnsi('Pendente'), {
        x: blockX + blockWidth - 38, y: y - 12, font: fonts.helvetica, size: 6, color: D.colors.gray400,
      });
    }

    // Signature line
    drawLine(ctx, blockX + blockWidth * 0.1, y - 40, blockX + blockWidth * 0.9, 0.5, D.colors.gray300);

    // Name or placeholder
    if (isSigned) {
      ctx.page.drawText(sanitizeTextForWinAnsi(block.name), {
        x: blockX + 6, y: y - 50, font: fonts.helveticaBold, size: 8, color: D.colors.gray800,
      });
    } else {
      ctx.page.drawText(sanitizeTextForWinAnsi('________________________'), {
        x: blockX + 6, y: y - 50, font: fonts.helvetica, size: 7, color: D.colors.gray400,
      });
    }

    // Title
    ctx.page.drawText(sanitizeTextForWinAnsi(block.title), {
      x: blockX + 6, y: y - 60, font: fonts.helvetica, size: 7, color: D.colors.gray500,
    });

    // Registration
    if (block.registration) {
      ctx.page.drawText(sanitizeTextForWinAnsi(block.registration), {
        x: blockX + 6, y: y - 68, font: fonts.helveticaBold, size: 6, color: D.colors.gray600,
      });
    }

    // Date
    const dateText = isSigned && block.signature?.signedAt
      ? `Data: ${formatDateBR(block.signature.signedAt)}`
      : 'Data: ____/____/________';
    ctx.page.drawText(sanitizeTextForWinAnsi(dateText), {
      x: blockX + 6, y: y - 76, font: fonts.helvetica, size: 6, color: D.colors.gray400,
    });
  }

  y -= BLOCK_HEIGHT + 16;

  if (identification.artNumber) {
    const artText = `ART No ${identification.artNumber}`;
    const artWidth = fonts.helveticaBold.widthOfTextAtSize(artText, 7) + 16;
    const artX = (ctx.pageWidth - artWidth) / 2;
    ctx.page.drawRectangle({ x: artX, y: y - 3, width: artWidth, height: 12, color: D.colors.gray50 });
    const artTextX = (ctx.pageWidth - fonts.helveticaBold.widthOfTextAtSize(artText, 7)) / 2;
    ctx.page.drawText(sanitizeTextForWinAnsi(artText), {
      x: artTextX, y: y, font: fonts.helveticaBold, size: 7, color: D.colors.gray600,
    });
    y -= 12;
  }

  ctx.y = y;
  return y;
}
