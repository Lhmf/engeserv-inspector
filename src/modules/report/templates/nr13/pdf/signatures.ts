/**
 * NR-13 PDF Template — Signatures (Blocos de Assinatura)
 *
 * Bloco de responsabilidade técnica: 3 colunas
 * (Elaboração, Verificação, Aprovação) com nome, CREA, data.
 */
import type { PdfRenderingContext } from './context';
import { PDF_COLORS, drawSectionTitle, drawRect, drawLine, formatDateBR } from './context';
import { sanitizeTextForWinAnsi } from './context';

export function drawSignaturesPdf(ctx: PdfRenderingContext, y: number): number {
  const { page, margin, contentWidth, fonts, report } = ctx;
  const { signatures, identification } = report;

  // Section title
  y = drawSectionTitle(ctx, 12, 'RESPONSABILIDADE TÉCNICA', y);

  // Intro text
  page.drawText(sanitizeTextForWinAnsi('O presente laudo técnico é de responsabilidade dos profissionais abaixo assinados,'), {
    x: margin, y, font: fonts.helvetica, size: 8, color: PDF_COLORS.gray500,
  });
  y -= 10;
  page.drawText(sanitizeTextForWinAnsi('conforme legislação vigente e normas técnicas aplicáveis.'), {
    x: margin, y, font: fonts.helvetica, size: 8, color: PDF_COLORS.gray500,
  });
  y -= 16;

  // ============================================================
  // SIGNATURE BLOCKS (3 columns)
  // ============================================================
  const blockWidth = (contentWidth - 20) / 3;
  const blockHeight = 80;

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
      name: identification.engineerName || '—',
      registration: signatures.engineer?.userRegistration,
      title: 'Engenheiro Responsável',
      signature: signatures.engineer,
    },
    {
      role: 'APROVAÇÃO',
      name: identification.managerName || '—',
      registration: signatures.manager?.userRegistration,
      title: 'Gestor Técnico',
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

    // Role
    page.drawText(sanitizeTextForWinAnsi(block.role), {
      x: blockX, y: y - 14, font: fonts.helveticaBold, size: 8, color: PDF_COLORS.navy,
    });

    // Signature line
    drawLine(ctx, blockX + blockWidth * 0.1, y - 42, blockX + blockWidth * 0.9, 0.5, PDF_COLORS.gray300);

    // Name
    if (isSigned) {
      page.drawText(sanitizeTextForWinAnsi(block.name), {
        x: blockX + 6, y: y - 52, font: fonts.helveticaBold, size: 9, color: PDF_COLORS.gray800,
      });
    } else {
      page.drawText(sanitizeTextForWinAnsi('______________________________________'), {
        x: blockX + 6, y: y - 52, font: fonts.helvetica, size: 8, color: PDF_COLORS.gray400,
      });
    }

    // Title
    page.drawText(sanitizeTextForWinAnsi(block.title), {
      x: blockX + 6, y: y - 62, font: fonts.helvetica, size: 7, color: PDF_COLORS.gray500,
    });

    // Registration
    if (block.registration) {
      page.drawText(sanitizeTextForWinAnsi(block.registration), {
        x: blockX + 6, y: y - 70, font: fonts.helveticaBold, size: 7, color: PDF_COLORS.gray600,
      });
    }

    // Date
    const dateText = isSigned && block.signature?.signedAt
      ? `Data: ${formatDateBR(block.signature.signedAt)}`
      : 'Data: ____/____/________';
    page.drawText(sanitizeTextForWinAnsi(dateText), {
      x: blockX + 6, y: y - 78, font: fonts.helvetica, size: 7, color: PDF_COLORS.gray400,
    });

    // Status badge
    if (isSigned) {
      ctx.page.drawRectangle({
        x: blockX + blockWidth - 50, y: y - 14, width: 44, height: 10,
        color: PDF_COLORS.green100,
      });
      page.drawText(sanitizeTextForWinAnsi('✓ Assinado'), {
        x: blockX + blockWidth - 48, y: y - 12, font: fonts.helveticaBold, size: 6, color: PDF_COLORS.green700,
      });
    } else {
      ctx.page.drawRectangle({
        x: blockX + blockWidth - 40, y: y - 14, width: 34, height: 10,
        color: PDF_COLORS.gray100,
      });
      page.drawText(sanitizeTextForWinAnsi('Pendente'), {
        x: blockX + blockWidth - 38, y: y - 12, font: fonts.helvetica, size: 6, color: PDF_COLORS.gray400,
      });
    }
  }

  y -= blockHeight + 10;

  // ART badge
  if (identification.artNumber) {
    const artText = `ART Nº ${identification.artNumber} — Anotação de Responsabilidade Técnica`;
    const artDate = identification.issuedAt ? ` — Emitida em ${formatDateBR(identification.issuedAt)}` : '';
    const fullArtText = artText + artDate;
    const artWidth = fonts.helveticaBold.widthOfTextAtSize(fullArtText, 8) + 20;

    ctx.page.drawRectangle({
      x: (ctx.pageWidth - artWidth) / 2, y: y - 4, width: artWidth, height: 14,
      color: PDF_COLORS.gray50,
    });

    const artX = (ctx.pageWidth - fonts.helveticaBold.widthOfTextAtSize(fullArtText, 8)) / 2;
    page.drawText(sanitizeTextForWinAnsi(fullArtText), {
      x: artX, y: y, font: fonts.helveticaBold, size: 8, color: PDF_COLORS.gray600,
    });
    y -= 14;
  }

  return y;
}
