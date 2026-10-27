import test from 'node:test';
import assert from 'node:assert/strict';
import { renderOfficialNr13Html } from '../../src/modules/report/templates/nr13/official-html';

test('laudo oficial exibe o checklist de campo sem inventar respostas', () => {
  const html = renderOfficialNr13Html({
    id: 'report-checklist',
    identification: { reportNumber: 'LT-CHECKLIST', inspectionDate: new Date('2026-10-27') },
    client: { name: 'Cliente de teste' },
    equipment: { tag: 'TAG-01', type: 'VASO_DE_PRESSAO' },
    inspectionData: {
      inspection: { fieldChecklist: { externalAccess: true, safetyValve: false } },
      fieldChecklist: { externalAccess: true, safetyValve: false },
      measurements: [],
    },
    recommendations: {},
    attachments: { photos: [], documents: [], calculations: [] },
  } as any);

  assert.match(html, /ITEM VERIFICADO EM CAMPO/);
  assert.match(html, /Acesso seguro/);
  assert.match(html, />SIM<\/td>/);
  assert.match(html, />NÃƒO<\/td>/);
  assert.match(html, /NÃƒO INFORMADO/);
});
