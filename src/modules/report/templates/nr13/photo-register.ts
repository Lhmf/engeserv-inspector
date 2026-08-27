/**
 * NR-13 Template — Photo Register (Registro Fotográfico)
 * 
 * Página 4: Registro fotográfico dinâmico.
 * Suporta múltiplas fotos e múltiplas páginas.
 * Cada registro: foto, número, categoria, descrição, localização, observação.
 */

import type { ReportPhoto } from '../../types';

export interface PhotoRegisterProps {
  photos: ReportPhoto[];
  photosPerPage?: number; // Default: 4
}

/**
 * Renderiza o registro fotográfico com suporte a múltiplas páginas.
 */
export function renderPhotoRegister(data: PhotoRegisterProps): string {
  const { photos, photosPerPage = 4 } = data;

  if (!photos || photos.length === 0) {
    return `
      <div class="nr13-section nr13-photos">
        <h2 class="section-title">
          <span class="section-number">8</span>
          REGISTRO FOTOGRÁFICO
        </h2>
        <p class="no-data">Nenhum registro fotográfico disponível para esta inspeção.</p>
      </div>
    `;
  }

  const pages: ReportPhoto[][] = [];
  for (let i = 0; i < photos.length; i += photosPerPage) {
    pages.push(photos.slice(i, i + photosPerPage));
  }

  const totalPages = pages.length;

  return `
    <div class="nr13-section nr13-photos">
      <h2 class="section-title">
        <span class="section-number">8</span>
        REGISTRO FOTOGRÁFICO
      </h2>

      <p class="photos-intro">
        Total de ${photos.length} registro(s) fotográfico(s) 
        ${totalPages > 1 ? `distribuídos em ${totalPages} páginas` : ''}.
      </p>

      ${pages.map((pagePhotos, pageIdx) => `
        <div class="photo-page ${pageIdx > 0 ? 'photo-page--continuation' : ''}">
          ${pageIdx > 0 ? `<div class="photo-page-continuation-label">Continuação — Página ${pageIdx + 1} de ${totalPages}</div>` : ''}
          <div class="photo-grid">
            ${pagePhotos.map((photo, localIdx) => {
              const globalIdx = pageIdx * photosPerPage + localIdx;
              return renderPhotoRecord(photo, globalIdx + 1);
            }).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderPhotoRecord(photo: ReportPhoto, number: number): string {
  return `
    <div class="photo-record">
      <div class="photo-record-image">
        <div class="photo-placeholder">
          <span class="photo-placeholder-icon">📷</span>
          <span class="photo-placeholder-text">Foto ${number}</span>
        </div>
      </div>
      <div class="photo-record-info">
        <div class="photo-record-header">
          <span class="photo-record-number">Foto ${number}</span>
          <span class="photo-record-category">${formatCategory(photo.category)}</span>
        </div>
        <div class="photo-record-description">${photo.caption || 'Sem descrição'}</div>
        <div class="photo-record-meta">
          ${photo.takenAt ? `<span class="photo-meta-item">📅 ${formatDateShort(photo.takenAt)}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

function formatCategory(category: string): string {
  const map: Record<string, string> = {
    'PLACA': 'Placa de Identificação',
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

function formatDateShort(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
