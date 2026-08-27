/**
 * NR-13 PDF Template — Photo Register (Registro Fotográfico)
 *
 * Página 4: Registro fotográfico dinâmico com suporte a múltiplas páginas.
 * Cada registro: número, categoria, descrição, foto real (se disponível).
 */
import type { PdfRenderingContext } from './context';
import { PDF_COLORS, drawSectionTitle, drawRect, drawLine, formatDateBR } from './context';
import { addNewPage } from './context';
import { sanitizeTextForWinAnsi } from './context';

const PHOTOS_PER_PAGE = 4;
const PHOTO_AREA_HEIGHT = 100;
const CARD_HEIGHT = 130;

export async function drawPhotoRegisterPdf(ctx: PdfRenderingContext, y: number): Promise<number> {
  const { doc, page, margin, contentWidth, fonts, report } = ctx;
  const photos = report.attachments.photos;

  // Section title
  y = drawSectionTitle(ctx, 5, 'REGISTRO FOTOGRÁFICO', y);

  if (!photos || photos.length === 0) {
    page.drawText(sanitizeTextForWinAnsi('Nenhum registro fotográfico disponível para esta inspeção.'), {
      x: margin, y, font: fonts.helveticaOblique, size: 9, color: PDF_COLORS.gray400,
    });
    return y - 20;
  }

  const totalPages = Math.ceil(photos.length / PHOTOS_PER_PAGE);

  // Intro text
  const introText = `Total de ${photos.length} registro(s) fotografico(s)${totalPages > 1 ? ` distribuidos em ${totalPages} paginas` : ''}.`;
  page.drawText(sanitizeTextForWinAnsi(introText), {
    x: margin, y, font: fonts.helvetica, size: 9, color: PDF_COLORS.gray500,
  });
  y -= 16;

  // Pre-fetch all photos (parallel)
  const photoImages: (any | null)[] = await Promise.all(
    photos.map(async (photo: any) => {
      if (!photo.url) return null;
      try {
        const response = await fetch(photo.url, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) return null;
        const contentType = response.headers.get('content-type') || '';
        const buffer = Buffer.from(await response.arrayBuffer());

        if (contentType.includes('jpeg') || contentType.includes('jpg') || photo.url.match(/\.jpe?g$/i)) {
          return await doc.embedJpg(buffer);
        } else if (contentType.includes('png') || photo.url.match(/\.png$/i)) {
          return await doc.embedPng(buffer);
        }
        // Try as JPEG by default
        return await doc.embedJpg(buffer);
      } catch (err) {
        console.warn(`[PDF] Falha ao carregar foto ${photo.id}: ${err}`);
        return null;
      }
    })
  );

  // Draw photos in grid (2 columns)
  for (let i = 0; i < photos.length; i++) {
    const col = i % 2;
    const row = Math.floor((i % PHOTOS_PER_PAGE) / 2);

    // Check space for new photo card
    const cardY = y - row * (CARD_HEIGHT + 10);

    if (cardY - CARD_HEIGHT < ctx.margin + 40) {
      // Need new page
      addNewPage(ctx);
      y = ctx.y;

      // Page continuation label
      const pageIdx = Math.floor(i / PHOTOS_PER_PAGE);
      ctx.page.drawText(sanitizeTextForWinAnsi(`Continuacao -- Pagina ${pageIdx + 1} de ${totalPages}`), {
        x: margin, y, font: fonts.helveticaOblique, size: 8, color: PDF_COLORS.gray400,
      });
      drawLine(ctx, margin, y - 4, margin + contentWidth, 0.5, PDF_COLORS.gray200);
      y -= 16;
    }

    const photo = photos[i];
    const photoIdx = i + 1;
    const cardWidth = (contentWidth - 10) / 2;
    const cardX = margin + col * (cardWidth + 10);
    const cardCurrentY = y - row * (CARD_HEIGHT + 10);

    // Card border
    ctx.page.drawRectangle({
      x: cardX, y: cardCurrentY - CARD_HEIGHT, width: cardWidth, height: CARD_HEIGHT,
      borderColor: PDF_COLORS.gray200, borderWidth: 0.5,
    });

    // Photo area
    const embeddedImage = photoImages[i];

    if (embeddedImage) {
      // Draw real image, scaled to fit within PHOTO_AREA_HEIGHT
      const imgWidth = embeddedImage.width;
      const imgHeight = embeddedImage.height;
      const maxW = cardWidth - 4;
      const maxH = PHOTO_AREA_HEIGHT - 4;

      let drawW: number;
      let drawH: number;
      if (imgWidth / imgHeight > maxW / maxH) {
        drawW = maxW;
        drawH = (imgHeight / imgWidth) * maxW;
      } else {
        drawH = maxH;
        drawW = (imgWidth / imgHeight) * maxH;
      }

      const drawX = cardX + (cardWidth - drawW) / 2;
      const drawY = cardCurrentY - 2 - (PHOTO_AREA_HEIGHT - drawH) / 2 - drawH;

      ctx.page.drawImage(embeddedImage, {
        x: drawX,
        y: drawY,
        width: drawW,
        height: drawH,
      });
    } else {
      // Placeholder (no image available)
      drawRect(ctx, cardX + 2, cardCurrentY - PHOTO_AREA_HEIGHT + 2, cardWidth - 4, PHOTO_AREA_HEIGHT - 4, PDF_COLORS.gray100);

      ctx.page.drawText(sanitizeTextForWinAnsi('Foto'), {
        x: cardX + cardWidth / 2 - 10, y: cardCurrentY - PHOTO_AREA_HEIGHT / 2,
        font: fonts.helveticaBold, size: 10, color: PDF_COLORS.gray400,
      });
      ctx.page.drawText(sanitizeTextForWinAnsi(`#${photoIdx}`), {
        x: cardX + cardWidth / 2 - 8, y: cardCurrentY - PHOTO_AREA_HEIGHT / 2 - 14,
        font: fonts.helvetica, size: 9, color: PDF_COLORS.gray400,
      });
    }

    // Photo info area
    const infoY = cardCurrentY - PHOTO_AREA_HEIGHT - 8;

    // Photo number
    ctx.page.drawText(sanitizeTextForWinAnsi(`Foto ${photoIdx}`), {
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
    ctx.page.drawText(sanitizeTextForWinAnsi(catText), {
      x: cardX + cardWidth - catWidth, y: infoY, font: fonts.helveticaBold, size: 6, color: PDF_COLORS.gray500,
    });

    // Description
    const desc = truncateText(photo.caption || 'Sem descricao', fonts.helvetica, 8, cardWidth - 12);
    ctx.page.drawText(sanitizeTextForWinAnsi(desc), {
      x: cardX + 6, y: infoY - 14, font: fonts.helvetica, size: 8, color: PDF_COLORS.gray700,
    });

    // Date
    if (photo.takenAt) {
      ctx.page.drawText(sanitizeTextForWinAnsi(`Data: ${formatDateBR(photo.takenAt)}`), {
        x: cardX + 6, y: infoY - 24, font: fonts.helvetica, size: 7, color: PDF_COLORS.gray400,
      });
    }
  }

  y -= Math.ceil(photos.length / PHOTOS_PER_PAGE) * (CARD_HEIGHT + 10) + 10;
  return y;
}

function formatCategory(category: string): string {
  const map: Record<string, string> = {
    'PLACA': 'Placa',
    'CORROSAO': 'Corrosao',
    'VALVULA': 'Valvula',
    'MANOMETRO': 'Manometro',
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
  while (truncated.length > 3 && font.widthOfTextAtSize(truncated + '...', size) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}
