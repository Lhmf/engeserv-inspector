/**
 * NR-13 PDF Template — Photo Register
 *
 * Space-aware 2-column photo grid with refined card design:
 * - Clean card borders
 * - Refined typography for labels
 * - Category badge
 * - Caption and date
 * - Proper pagination with continuation labels
 */
import type { PdfRenderingContext } from './context';
import {
  REPORT_DESIGN, PDF_COLORS, drawSectionTitle, drawRect, drawLine, formatDateBR,
  addNewPage, getAvailableHeight, LAYOUT, truncateText, SECTION_TITLE_HEIGHT,
} from './context';
import { sanitizeTextForWinAnsi } from './context';

const PHOTO_AREA_HEIGHT = 90;
const CARD_INFO_HEIGHT = 36;
const CARD_HEIGHT = PHOTO_AREA_HEIGHT + CARD_INFO_HEIGHT;
const ROW_GAP = 14;
const MIN_SPACE_FOR_ROW = CARD_HEIGHT + ROW_GAP;

export async function drawPhotoRegisterPdf(ctx: PdfRenderingContext, y: number): Promise<number> {
  const { doc, margin, contentWidth, fonts, report } = ctx;
  const D = REPORT_DESIGN;
  const photos = report.attachments.photos;

  // Section title — check space first using local y (ctx.y may be stale)
  if ((y - LAYOUT.footerReserve) < SECTION_TITLE_HEIGHT + 20) {
    addNewPage(ctx);
    y = ctx.y;
  }

  y = drawSectionTitle(ctx, 5, 'REGISTRO FOTOGRÁFICO', y);

  if (!photos || photos.length === 0) {
    ctx.page.drawText(sanitizeTextForWinAnsi('Nenhum registro fotográfico disponível para esta inspeção.'), {
      x: margin, y, font: fonts.helveticaOblique, size: 9, color: D.colors.gray400,
    });
    return y - 20;
  }

  // Intro text
  const introText = `Total de ${photos.length} registro(s) fotografico(s).`;
  ctx.page.drawText(sanitizeTextForWinAnsi(introText), {
    x: margin, y, font: fonts.helvetica, size: 9, color: D.colors.gray500,
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
        return await doc.embedJpg(buffer);
      } catch (err) {
        console.warn(`[PDF] Falha ao carregar foto ${photo.id}: ${err}`);
        return null;
      }
    })
  );

  // Draw photos in 2-column grid with space-aware pagination
  const cardWidth = (contentWidth - 10) / 2;
  let pageNum = 1;

  for (let i = 0; i < photos.length; i++) {
    const col = i % 2;
    const isNewRow = col === 0;

    if (isNewRow) {
      // Check space for this row
      if ((y - LAYOUT.footerReserve) < MIN_SPACE_FOR_ROW) {
        addNewPage(ctx);
        y = ctx.y;
        pageNum++;

        // Continuation label
        ctx.page.drawText(sanitizeTextForWinAnsi(`Continuação - Registro Fotográfico`), {
          x: margin, y, font: fonts.helveticaOblique, size: 8, color: D.colors.gray400,
        });
        drawLine(ctx, margin, y - 4, margin + contentWidth, 0.5, D.colors.gray200);
        y -= 16;
      }
    }

    const photo = photos[i];
    const photoIdx = i + 1;
    const cardX = margin + col * (cardWidth + 10);
    const cardCurrentY = y;

    // Card border — subtle, professional
    ctx.page.drawRectangle({
      x: cardX, y: cardCurrentY - CARD_HEIGHT, width: cardWidth, height: CARD_HEIGHT,
      borderColor: D.colors.photoBorder, borderWidth: 0.5,
    });

    // Photo area
    const embeddedImage = photoImages[i];
    if (embeddedImage) {
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

      ctx.page.drawImage(embeddedImage, { x: drawX, y: drawY, width: drawW, height: drawH });
    } else {
      // Placeholder with refined styling
      drawRect(ctx, cardX + 2, cardCurrentY - PHOTO_AREA_HEIGHT + 2, cardWidth - 4, PHOTO_AREA_HEIGHT - 4, D.colors.photoBg);
      ctx.page.drawText(sanitizeTextForWinAnsi('Foto'), {
        x: cardX + cardWidth / 2 - 10, y: cardCurrentY - PHOTO_AREA_HEIGHT / 2,
        font: fonts.helveticaBold, size: 10, color: D.colors.gray400,
      });
      ctx.page.drawText(sanitizeTextForWinAnsi(`#${photoIdx}`), {
        x: cardX + cardWidth / 2 - 8, y: cardCurrentY - PHOTO_AREA_HEIGHT / 2 - 14,
        font: fonts.helvetica, size: 9, color: D.colors.gray400,
      });
    }

    // Photo info — refined typography
    const infoY = cardCurrentY - PHOTO_AREA_HEIGHT - 8;

    // Photo number (bold, primary color)
    ctx.page.drawText(sanitizeTextForWinAnsi(`Foto ${photoIdx}`), {
      x: cardX + 6, y: infoY,
      font: fonts.helveticaBold, size: 8, color: D.colors.primary,
    });

    // Category badge
    const catText = formatCategory(photo.category);
    const catWidth = fonts.helveticaBold.widthOfTextAtSize(catText, 6) + 8;
    ctx.page.drawRectangle({ x: cardX + cardWidth - catWidth - 4, y: infoY - 2, width: catWidth, height: 10, color: D.colors.gray100 });
    ctx.page.drawText(sanitizeTextForWinAnsi(catText), {
      x: cardX + cardWidth - catWidth, y: infoY, font: fonts.helveticaBold, size: 6, color: D.colors.gray500,
    });

    // Caption
    const desc = truncateText(photo.caption || 'Sem descrição', fonts.helvetica, 8, cardWidth - 12);
    ctx.page.drawText(sanitizeTextForWinAnsi(desc), {
      x: cardX + 6, y: infoY - 14, font: fonts.helvetica, size: 8, color: D.colors.gray700,
    });

    // Date
    if (photo.takenAt) {
      ctx.page.drawText(sanitizeTextForWinAnsi(`Data: ${formatDateBR(photo.takenAt)}`), {
        x: cardX + 6, y: infoY - 24, font: fonts.helvetica, size: 7, color: D.colors.gray400,
      });
    }

    // After right column photo, advance y
    if (col === 1 || i === photos.length - 1) {
      y -= CARD_HEIGHT + ROW_GAP;
    }
  }

  ctx.y = y;
  return y;
}

function formatCategory(category: string): string {
  const map: Record<string, string> = {
    'PLACA': 'Placa', 'CORROSAO': 'Corrosão', 'VALVULA': 'Válvula',
    'MANOMETRO': 'Manômetro', 'ULTRASSOM': 'Ultrassom', 'VISTA_GERAL': 'Vista Geral',
    'SOLDA': 'Solda', 'TRINCA': 'Trinca', 'REPARO': 'Reparo',
  };
  return map[category] || category;
}
