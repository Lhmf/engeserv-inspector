/**
 * NR-13 PDF Template — Signatures (Responsabilidade Tecnica)
 *
 * 3 signature blocks with generous space.
 * Each block: role, signature line, name, title, registration, date.
 * Layout: vertical stack (not columns) for better readability.
 */
import type { PdfRenderingContext } from './context';
import { PDF_COLORS, drawSectionTitle, drawRect, drawLine, formatDateBR, LAYOUT } from './context';
import { sanitizeTextForWinAnsi } from './context';

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

  // 3 signature blocks — side by side
  const blockWidth = (contentWidth - 20) / 3;
  const blockHeight = 80;

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

    // Block border
    ctx.page.drawRectangle({
      x: blockX, y: y - blockHeight, width: blockWidth, height: blockHeight,
      borderColor: isSigned ? PDF_COLORS.green100 : PDF_COLORS.gray200,
      borderWidth: 0.5,
      color: isSigned ? PDF_COLORS.green50 : PDF_COLORS.white,
    });

    // Role title
    page.drawText(sanitizeTextForWinAnsi(block.role), {
      x: blockX + 4, y: y - 12, font: fonts.helveticaBold, size: 7, color: PDF_COLORS.navy,
    });

    // Status badge — right-aligned under role title
    if (isSigned) {
      ctx.page.drawRectangle({
        x: blockX + blockWidth - 50, y: y - 14, width: 46, height: 10,
        color: PDF_COLORS.green100,
      });
      page.drawText(sanitizeTextForWinAnsi('Assinado'), {
        x: blockX + blockWidth - 46, y: y - 12, font: fonts.helveticaBold, size: 6, color: PDF_COLORS.green700,
      });
    } else {
      ctx.page.drawRectangle({
        x: blockX + blockWidth - 42, y: y - 14, width: 38, height: 10,
        color: PDF_COLORS.gray100,
      });
      page.drawText(sanitizeTextForWinAnsi('Pendente'), {
        x: blockX + blockWidth - 38, y: y - 12, font: fonts.helvetica, size: 6, color: PDF_COLORS.gray400,
      });
    }

    // Signature line
    drawLine(ctx, blockX + blockWidth * 0.1, y - 40, blockX + blockWidth * 0.9, 0.5, PDF_COLORS.gray300);

    // Name
    if (isSigned) {
      page.drawText(sanitizeTextForWinAnsi(block.name), {
        x: blockX + 6, y: y - 50, font: fonts.helveticaBold, size: 8, color: PDF_COLORS.gray800,
      });
    } else {
      page.drawText(sanitizeTextForWinAnsi('________________________'), {
        x: blockX + 6, y: y - 50, font: fonts.helvetica, size: 7, color: PDF_COLORS.gray400,
      });
    }

    // Title
    page.drawText(sanitizeTextForWinAnsi(block.title), {
      x: blockX + 6, y: y - 60, font: fonts.helvetica, size: 7, color: PDF_COLORS.gray500,
    });

    // Registration
    if (block.registration) {
      page.drawText(sanitizeTextForWinAnsi(block.registration), {
        x: blockX + 6, y: y - 68, font: fonts.helveticaBold, size: 6, color: PDF_COLORS.gray600,
      });
    }

    // Date
    const dateText = isSigned && block.signature?.signedAt
      ? `Data: ${formatDateBR(block.signature.signedAt)}`
      : 'Data: ____/____/________';
    page.drawText(sanitizeTextForWinAnsi(dateText), {
      x: blockX + 6, y: y - 76, font: fonts.helvetica, size: 6, color: PDF_COLORS.gray400,
    });
  }

  y -= blockHeight + 16;

  // ART badge
  if (identification.artNumber) {
    const artText = `ART No ${identification.artNumber}`;
    const artWidth = fonts.helveticaBold.widthOfTextAtSize(artText, 7) + 16;
    const artX = (ctx.pageWidth - artWidth) / 2;

    ctx.page.drawRectangle({
      x: artX, y: y - 3, width: artWidth, height: 12,
      color: PDF_COLORS.gray50,
    });

    const artTextX = (ctx.pageWidth - fonts.helveticaBold.widthOfTextAtSize(artText, 7)) / 2;
    page.drawText(sanitizeTextForWinAnsi(artText), {
      x: artTextX, y: y, font: fonts.helveticaBold, size: 7, color: PDF_COLORS.gray600,
    });
    y -= 12;
  }

  return y;
}
