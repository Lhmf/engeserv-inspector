import test from 'node:test';
import assert from 'node:assert/strict';
import { renderOfficialNr13Html } from '../../src/modules/report/templates/nr13/official-html';

test('laudo oficial usa documentos reais do cliente nos anexos', () => {
  const html = renderOfficialNr13Html({
    id: 'report-1',
    identification: { reportNumber: 'LT-TESTE', inspectionDate: new Date('2026-10-27') },
    client: { name: 'Cliente de teste' },
    equipment: { tag: 'TAG-01', type: 'VASO_DE_PRESSAO' },
    inspectionData: { measurements: [] },
    recommendations: {},
    attachments: {
      photos: [],
      documents: [{
        id: 'doc-art',
        name: 'ART-2026.jpg',
        type: 'ART',
        url: 'https://example.test/art-2026.jpg',
        description: 'ART assinada',
        uploadedAt: new Date('2026-10-27'),
        uploadedBy: 'user-1',
      }],
      calculations: [],
    },
  } as any);

  assert.match(html, /ART-2026\.jpg/);
  assert.match(html, /https:\/\/example\.test\/art-2026\.jpg/);
  assert.doesNotMatch(html, /APRESENTADO \/ A CONFIRMAR/);
});

test('laudo oficial não renderiza ícones quebrados para fotos locais indisponíveis', () => {
  const html = renderOfficialNr13Html({
    id: 'report-photo-fallback',
    identification: { reportNumber: 'LT-FOTO', inspectionDate: new Date('2026-10-27') },
    client: { name: 'Cliente de teste' },
    equipment: { tag: 'TAG-01', type: 'VASO_DE_PRESSAO' },
    inspectionData: {
      measurements: [],
      photos: [{ url: '/photos/nao-existe.jpg', caption: 'Foto de teste' }],
    },
    recommendations: {},
    attachments: {
      photos: [{ url: '/photos/nao-existe.jpg', caption: 'Foto de teste' }],
      documents: [],
      calculations: [],
    },
  } as any);

  assert.doesNotMatch(html, /src="\/photos\/nao-existe\.jpg"/);
  assert.match(html, /Registro fotográfico não anexado a esta inspeção/);
});
