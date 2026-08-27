/**
 * NR-13 PDF Template — Photo Register (Registro Fotográfico)
 *
 * Página 4: Registro fotográfico dinâmico com suporte a múltiplas páginas.
 * Cada registro: número, categoria, descrição, observação.
 */
import type { PdfRenderingContext } from './context';
import { PDF_COLORS, drawSectionTitle, drawRect, drawLine, formatDateBR } from './context';
import { addNewPage } from './context';

const PHOTOS_PER_PAGE = 4;

export function drawPhotoRegisterPdf(ctx: PdfRenderingContext, y: number): number {
  const { page, margin, contentWidth, fonts, report } = ctx;
  const photos = report.attachments.photos;

  // Section title
  y = drawSectionTitle(ctx, 8, 'REGISTRO FOTOGRÁFICO', y);

  if (!photos || photos.length === 0) {
    page.drawText('Nenhum registro fotográfico disponível para esta inspeção.', {
      x: margin, y, font: fonts.helveticaOblique, size: 9, color: PDF_COLORS.gray400,
    });
    return y - 20;
  }

  const totalPages = Math.ceil(photos.length / PHOTOS_PER_PAGE);

  // Intro text
  page.drawText(`Total de ${photos.length} registro(s) fotográfico(s) ${totalPages > 1 ? `distribuídos em ${totalPages} páginas` : ''}.`, {
    x: margin, y, font: fonts.helvetica, size: 9, color: PDF_COLORS.gray500,
  });
  y -= 16;

  // Draw photos in grid (2 columns)
  for (let i = 0; i < photos.length; i++) {
    const col = i % 2;
    const row = Math.floor((i % PHOTOS_PER_PAGE) / 2);

    // Check space for new photo card
    const cardHeight = 80;
    const cardY = y - row * (cardHeight + 10);

    if (cardY - cardHeight < ctx.margin + 40) {
      // Need new page
      addNewPage(ctx);
      y = ctx.y;

      // Page continuation label
      const pageIdx = Math.floor(i / PHOTOS_PER_PAGE);
      page.drawText(`Continuação — Página ${pageIdx + 1} de ${totalPages}`, {
        x: margin, y, font: fonts.helveticaOblique, size: 8, color: PDF_COLORS.gray400,
      });
      drawLine(ctx, margin, y - 4, margin + contentWidth, 0.5, PDF_COLORS.gray200);
      y -= 16;
    }

    const photo = photos[i];
    const photoIdx = i + 1;
    const cardWidth = (contentWidth - 10) / 2;
    const cardX = margin + col * (cardWidth + 10);
    const cardCurrentY = y - row * (cardHeight + 10);

    // Card border
    ctx.page.drawRectangle({
      x: cardX, y: cardCurrentY - cardHeight, width: cardWidth, height: cardHeight,
      borderColor: PDF_COLORS.gray200, borderWidth: 0.5,
    });

    // Photo placeholder (gray area)
    drawRect(ctx, cardX, cardCurrentY - 50, cardWidth, 50, PDF_COLORS.gray100);

    // Camera icon placeholder
    page.drawText('📷', {
      x: cardX + cardWidth / 2 - 8, y: cardCurrentY - 35,
      font: fonts.helvetica, size: 16, color: PDF_COLORS.gray400,
    });
    page.drawText(`Foto ${photoIdx}`, {
      x: cardX + cardWidth / 2 - 15, y: cardCurrentY - 20,
      font: fonts.helvetica, size: 9, color: PDF_COLORS.gray500,
    });

    // Photo info area
    const infoY = cardCurrentY - 58;

    // Photo number
    page.drawText(`Foto ${photoIdx}`, {
      x: cardX + 6, y: infoY,
      font: fonts.helveticaBold, size: 8, color: PDF_COLORS.navy,
    });

    // Category badge
    const catText = formatCategory(photo.category);
    const catWidth = fonts.helveticaBold.widthOfTextAtSize(catText, 6) + 8;
    ctx.page.drawRectangle({
      x: cardX + cardWidth - catWidth - 4, y: infoY - 2, width: catWidth, height: 10,
      color: PDF_COLORS.gray100,
    });
    page.drawText(catText, {
      x: cardX + cardWidth - catWidth, y: infoY, font: fonts.helveticaBold, size: 6, color: PDF_COLORS.gray500,
    });

    // Description
    const desc = truncateText(photo.caption || 'Sem descrição', fonts.helvetica, 8, cardWidth - 12);
    page.drawText(desc, {
      x: cardX + 6, y: infoY - 14, font: fonts.helvetica, size: 8, color: PDF_COLORS.gray700,
    });

    // Date
    if (photo.takenAt) {
      page.drawText(`📅 ${formatDateBR(photo.takenAt)}`, {
        x: cardX + 6, y: infoY - 24, font: fonts.helvetica, size: 7, color: PDF_COLORS.gray400,
      });
    }
  }

  y -= Math.ceil(photos.length / PHOTOS_PER_PAGE) * 90 + 10;
  return y;
}

function formatCategory(category: string): string {
  const map: Record<string, string> = {
    'PLACA': 'Placa',
    'CORROSAO': 'Corrosão',
    'VALVULA': 'Válvula',
    'MANOMETRO': 'Manômetro',
    'ULTRASSOM': 'Ultrassom',
    'VISTA_GERAL': 'Vista Geral',
    'SOLDA': 'Solda',
    'TRINCA': 'Trinca',
    'REPARO': 'Reparo',
  };
  return map[category] || category;
}

function truncateText(text: string, font: any, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 3 && font.widthOfTextAtSize(truncated + '…', size) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '…';
}
