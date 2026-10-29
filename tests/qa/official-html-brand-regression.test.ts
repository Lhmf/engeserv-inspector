import test from 'node:test';
import assert from 'node:assert/strict';
import { renderOfficialNr13Html } from '../../src/modules/report/templates/nr13/official-html';

test('laudo oficial preserva a identidade EngeServ e troca somente os dados do equipamento', () => {
  const html = renderOfficialNr13Html({
    id: 'report-brand',
    identification: { reportNumber: 'LTI-TESTE', inspectionDate: new Date('2026-10-29') },
    client: { name: 'Cliente A' },
    equipment: {
      tag: 'B-408-42',
      type: 'VASO_DE_PRESSAO',
      description: 'Pulverizador pressurizado',
      manufacturer: 'Coagril',
      serialNumber: 'SER-42',
    },
    inspectionData: {
      measurements: [
        { point: 'PM-01', thicknessMm: 1.01 },
        { point: 'PM-11', thicknessMm: 0.91 },
      ],
    },
    recommendations: {},
    attachments: { photos: [], documents: [], calculations: [] },
  } as any);

  assert.match(html, /Logo EngeServ/);
  assert.match(html, /ENG-SERV/);
  assert.match(html, /ENGENHARIA/);
  assert.match(html, /LAUDO TÉCNICO DE INSPEÇÃO PERIÓDICA/);
  assert.match(html, /B-408-42/);
  assert.match(html, /SER-42/);
  assert.match(html, /PM-06.*1,01.*ADOTADO/);
  assert.match(html, /PM-15.*0,91.*ADOTADO/);
  assert.match(html, /Valor adotado/);
  assert.doesNotMatch(html, /Cliente B/);
});
