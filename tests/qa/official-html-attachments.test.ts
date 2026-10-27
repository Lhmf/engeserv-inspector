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
  assert.doesNotMatch(html, /Documento nÃ£o anexado/);
});
