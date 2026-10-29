import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function source(relativePath: string) {
  return fs.readFileSync(relativePath, 'utf8');
}

test('rotas de emissão exigem sessão, papel e barreira técnica', () => {
  const pdf = source('src/app/api/reports/[id]/pdf/route.ts');
  const html = source('src/app/api/reports/[id]/official-html/route.ts');
  assert.match(pdf, /getSession\(\)/);
  assert.match(pdf, /status: 403/);
  assert.match(pdf, /status: 409/);
  assert.match(pdf, /mode.*demo/);
  assert.match(html, /getSession\(\)/);
  assert.match(html, /status: 403/);
  assert.match(html, /status: 409/);
});

test('endpoints de debug removidos e seed não aceita código por query string', () => {
  assert.match(source('src/app/api/debug/bcrypt-test/route.ts'), /status: 410/);
  assert.match(source('src/app/api/debug/bcrypt-test-v2/route.ts'), /status: 410/);
  assert.match(source('src/app/api/admin/list-users/route.ts'), /status: 410/);
  const seed = source('src/app/api/admin/seed/route.ts');
  assert.match(seed, /authorization/);
  assert.doesNotMatch(seed, /searchParams\.get\(['"]code/);
});
