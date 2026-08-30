/**
 * NR-13 PDF Template — Signatures (Responsabilidade Tecnica)
 *
 * Keep-together block: the entire section title + 3 signature blocks
 * move to a new page if they don't fit. Never split the block.
 */
import type { PdfRenderingContext } from './context';
import { PDF_COLORS, drawSectionTitle, drawRect, drawLine, formatDateBR, LAYOUT, getAvailableHeight, addNewPage, SECTION_TITLE_HEIGHT } from './context';
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
  const { page, margin, contentWidth, fonts, report } = ctx;
  const { signatures, identification } = report;

  y = drawSectionTitle(ctx, 8, 'RESPONSABILIDADE TECNICA', y);

  page.drawText(sanitizeTextForWinAnsi('O presente laudo tecnico e de responsabilidade dos profissionais abaixo assinados,'), {
    x: margin, y, font: fonts.helvetica, size: 7, color: PDF_COLORS.gray500,
  });
  y -= 9;
  page.drawText(sanitizeTextForWinAnsi('conforme legislacao vigente e normas tecnicas aplicaveis.'), {
    x: margin, y, font: fonts.helvetica, size: 7, color: PDF_COLORS.gray500,
  });
  y -= 16;

  const blockWidth = (contentWidth - 20) / 3;

  const blocks = [
    {
      role: 'ELABORACAO',
      name: identification.inspectorName,
      registration: signatures.inspector?.userRegistration,
      title: 'Inspetor Tecnico',
      signature: signatures.inspector,
    },
    {
      role: 'VERIFICACAO',
      name: identification.engineerName || '-',
      registration: signatures.engineer?.userRegistration,
      title: 'Engenheiro Responsavel',
      signature: signatures.engineer,
    },
    {
      role: 'APROVACAO',
      name: identification.managerName || '-',
      registration: signatures.manager?.userRegistration,
      title: 'Gestor Tecnico',
      signature: signatures.manager,
    },
  ];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockX = margin + i * (blockWidth + 10);
    const isSigned = block.signature && block.signature.status === 'APPROVED';

    ctx.page.drawRectangle({
      x: blockX, y: y - BLOCK_HEIGHT, width: blockWidth, height: BLOCK_HEIGHT,
      borderColor: isSigned ? PDF_COLORS.green100 : PDF_COLORS.gray200,
      borderWidth: 0.5,
      color: isSigned ? PDF_COLORS.green50 : PDF_COLORS.white,
    });

    page.drawText(sanitizeTextForWinAnsi(block.role), {
      x: blockX + 4, y: y - 12, font: fonts.helveticaBold, size: 7, color: PDF_COLORS.navy,
    });

    if (isSigned) {
      ctx.page.drawRectangle({ x: blockX + blockWidth - 50, y: y - 14, width: 46, height: 10, color: PDF_COLORS.green100 });
      page.drawText(sanitizeTextForWinAnsi('Assinado'), {
        x: blockX + blockWidth - 46, y: y - 12, font: fonts.helveticaBold, size: 6, color: PDF_COLORS.green700,
      });
    } else {
      ctx.page.drawRectangle({ x: blockX + blockWidth - 42, y: y - 14, width: 38, height: 10, color: PDF_COLORS.gray100 });
      page.drawText(sanitizeTextForWinAnsi('Pendente'), {
        x: blockX + blockWidth - 38, y: y - 12, font: fonts.helvetica, size: 6, color: PDF_COLORS.gray400,
      });
    }

    drawLine(ctx, blockX + blockWidth * 0.1, y - 40, blockX + blockWidth * 0.9, 0.5, PDF_COLORS.gray300);

    if (isSigned) {
      page.drawText(sanitizeTextForWinAnsi(block.name), {
        x: blockX + 6, y: y - 50, font: fonts.helveticaBold, size: 8, color: PDF_COLORS.gray800,
      });
    } else {
      page.drawText(sanitizeTextForWinAnsi('________________________'), {
        x: blockX + 6, y: y - 50, font: fonts.helvetica, size: 7, color: PDF_COLORS.gray400,
      });
    }

    page.drawText(sanitizeTextForWinAnsi(block.title), {
      x: blockX + 6, y: y - 60, font: fonts.helvetica, size: 7, color: PDF_COLORS.gray500,
    });

    if (block.registration) {
      page.drawText(sanitizeTextForWinAnsi(block.registration), {
        x: blockX + 6, y: y - 68, font: fonts.helveticaBold, size: 6, color: PDF_COLORS.gray600,
      });
    }

    const dateText = isSigned && block.signature?.signedAt
      ? `Data: ${formatDateBR(block.signature.signedAt)}`
      : 'Data: ____/____/________';
    page.drawText(sanitizeTextForWinAnsi(dateText), {
      x: blockX + 6, y: y - 76, font: fonts.helvetica, size: 6, color: PDF_COLORS.gray400,
    });
  }

  y -= BLOCK_HEIGHT + 16;

  if (identification.artNumber) {
    const artText = `ART No ${identification.artNumber}`;
    const artWidth = fonts.helveticaBold.widthOfTextAtSize(artText, 7) + 16;
    const artX = (ctx.pageWidth - artWidth) / 2;
    ctx.page.drawRectangle({ x: artX, y: y - 3, width: artWidth, height: 12, color: PDF_COLORS.gray50 });
    const artTextX = (ctx.pageWidth - fonts.helveticaBold.widthOfTextAtSize(artText, 7)) / 2;
    page.drawText(sanitizeTextForWinAnsi(artText), {
      x: artTextX, y: y, font: fonts.helveticaBold, size: 7, color: PDF_COLORS.gray600,
    });
    y -= 12;
  }

  ctx.y = y;
  return y;
}
