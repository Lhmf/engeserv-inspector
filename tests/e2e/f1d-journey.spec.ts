import { test, expect, type Page, type Browser } from '@playwright/test';
import fs from 'node:fs';

const password = process.env.E2E_TEST_PASSWORD ?? 'demo123456';

test.setTimeout(120_000);

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Senha').fill(password);
  const response = page.waitForResponse((item) => item.url().endsWith('/api/auth/login'));
  await page.getByRole('button', { name: 'Entrar' }).click();
  expect((await response).status()).toBe(200);
}

async function createClient(page: Page, suffix: string) {
  await page.goto('/clientes');
  await page.getByRole('button', { name: 'Adicionar cliente' }).click();
  const form = page.locator('form').last();
  await form.locator('input[type="text"]').nth(0).fill(`Cliente F1d ${suffix}`);
  await form.locator('input[type="text"]').nth(1).fill(Date.now().toString().slice(-14).padStart(14, '0'));
  const response = page.waitForResponse((item) => item.url().endsWith('/api/clientes') && item.request().method() === 'POST');
  await page.getByRole('button', { name: 'Criar cliente' }).click();
  const result = await (await response).json();
  expect(result.cliente?.id).toBeTruthy();
  return result.cliente;
}

test('F1d: Master percorre cliente, equipamento, inspeção, laudo e layout oficial', async ({ page }) => {
  await login(page, process.env.E2E_MASTER_EMAIL ?? 'admin@engeserv.com.br');
  const client = await createClient(page, Date.now().toString().slice(-4));

  await page.goto(`/equipamentos/novo?clientId=${client.id}`);
  const equipmentForm = page.locator('form').last();
  await equipmentForm.locator('select').nth(0).selectOption(client.id);
  await equipmentForm.locator('input[type="text"]').nth(0).fill(`F1D-${Date.now().toString().slice(-5)}`);
  await equipmentForm.locator('select').nth(1).selectOption('VASO_DE_PRESSAO');
  await page.getByPlaceholder('Ex: 12.50').fill('12.5');
  await page.getByPlaceholder('Ex: 3.47').fill('10');
  await page.getByPlaceholder('Ex: 2.50').fill('5');
  const equipmentResponse = page.waitForResponse((item) => item.url().endsWith('/api/equipamentos') && item.request().method() === 'POST');
  await page.getByRole('button', { name: 'Criar equipamento' }).click();
  const equipment = (await (await equipmentResponse).json()).equipamento;
  expect(equipment?.id).toBeTruthy();

  await page.goto(`/inspecoes/novo?clientId=${client.id}&equipmentId=${equipment.id}`);
  const inspectionForm = page.locator('form').last();
  await inspectionForm.locator('select').nth(0).selectOption(client.id);
  await inspectionForm.locator('select').nth(1).selectOption(equipment.id);
  const inspectionResponse = page.waitForResponse((item) => item.url().endsWith('/api/inspections') && item.request().method() === 'POST');
  await page.getByRole('button', { name: /Iniciar Inspeção/ }).click();
  const inspection = (await (await inspectionResponse).json()).inspection;
  expect(inspection?.id).toBeTruthy();
  await page.waitForURL(`**/inspecoes/${inspection.id}/wizard*`);

  await page.locator('button').filter({ hasText: /Próximo/ }).last().click();
  await page.locator('button').filter({ hasText: /Próximo/ }).last().click();
  const rows = page.locator('table tbody tr');
  await expect(rows).toHaveCount(18);
  for (let index = 0; index < 18; index += 1) {
    await rows.nth(index).locator('input[type="number"]').first().fill((10 - index * 0.1).toFixed(2));
  }
  await page.screenshot({ path: 'docs/demo/f1d/master-measurements.png', fullPage: true });
  await page.locator('button').filter({ hasText: /Próximo/ }).click();
  await page.locator('button').filter({ hasText: /Próximo/ }).click();

  const pipelineResponse = page.waitForResponse((item) => item.url().endsWith('/api/reports/pipeline') && item.request().method() === 'POST');
  await page.getByRole('button', { name: /Gerar Laudo Técnico/ }).click();
  const pipelineResult = await pipelineResponse;
  expect(pipelineResult.status(), await pipelineResult.text()).toBe(200);
  await page.waitForURL('**/reports/**');
  await page.screenshot({ path: 'docs/demo/f1d/master-report.png', fullPage: true });

  const reportId = new URL(page.url()).pathname.split('/').pop();
  expect(reportId).toBeTruthy();
  const official = await page.request.get(`/api/reports/${reportId}/official-html`);
  expect(official.status()).toBe(409);
  expect(await official.text()).toContain('EMISSION_BLOCKED_UNVALIDATED_ENGINEERING');
  const demoPdf = await page.request.get(`/api/reports/${reportId}/pdf?mode=demo`);
  expect(demoPdf.status()).toBe(200);
  fs.writeFileSync('docs/demo/f1d/demo-report.pdf', await demoPdf.body());
  await page.screenshot({ path: 'docs/demo/f1d/master-report-official.png', fullPage: true });

  await page.context().storageState({ path: 'docs/demo/f1d/master-storage.json' });
});

test('F1d: Gestor e Funcionário respeitam a barreira de emissão', async ({ browser, request }) => {
  const masterContext = await browser.newContext();
  const master = masterContext.request;
  const masterLogin = await master.post('/api/auth/login', { data: { email: process.env.E2E_MASTER_EMAIL ?? 'admin@engeserv.com.br', password } });
  expect(masterLogin.status()).toBe(200);
  const reports = await master.get('/api/reports/list');
  expect(reports.status()).toBe(200);
  const reportId = (await reports.json()).reports?.[0]?.id;
  expect(reportId).toBeTruthy();

  for (const role of [
    { email: process.env.E2E_GESTOR_EMAIL ?? 'gestor@engeserv.com.br', definitive: 409 },
    { email: process.env.E2E_FUNC_EMAIL ?? 'demo@engeserv.com.br', definitive: 403 },
  ]) {
    const browserContext = await browser.newContext();
    const context = browserContext.request;
    const loginResponse = await context.post('/api/auth/login', { data: { email: role.email, password } });
    expect(loginResponse.status()).toBe(200);
    const definitive = await context.get(`/api/reports/${reportId}/pdf`);
    expect(definitive.status()).toBe(role.definitive);
    const page = await browserContext.newPage();
    await page.goto('/dashboard');
    await page.screenshot({ path: `docs/demo/f1d/${role.email.split('@')[0]}-dashboard.png`, fullPage: true });
    await browserContext.close();
  }
  await masterContext.close();
});

test('F1d: Portal isola Cliente A de Cliente B', async ({ browser }) => {
  const masterContext = await browser.newContext();
  const master = masterContext.request;
  expect((await master.post('/api/auth/login', { data: { email: 'admin@engeserv.com.br', password } })).status()).toBe(200);
  const unique = Date.now().toString().slice(-6);
  const prefixA = unique;
  const prefixB = (Number(unique) + 1).toString().padStart(6, '0');
  const clients = [];
  for (const [name, prefix] of [['Portal A', prefixA], ['Portal B', prefixB] as const]) {
    const response = await master.post('/api/clientes', { data: { name: `Cliente ${name} F1d ${unique}`, cnpj: `${prefix}00000000` } });
    expect(response.status()).toBe(201);
    clients.push((await response.json()).cliente);
  }

  const portalAContext = await browser.newContext();
  const portalBContext = await browser.newContext();
  const portalA = portalAContext.request;
  const portalB = portalBContext.request;
  expect((await portalA.post('/api/portal/login', { data: { primeiroNome: `Cliente Portal A F1d ${unique}`, cnpj: prefixA } })).status()).toBe(200);
  expect((await portalB.post('/api/portal/login', { data: { primeiroNome: `Cliente Portal B F1d ${unique}`, cnpj: prefixB } })).status()).toBe(200);
  const dashboardA = await portalA.get('/api/portal/dashboard');
  const dashboardB = await portalB.get('/api/portal/dashboard');
  expect(JSON.stringify(await dashboardA.json())).not.toContain(clients[1].companyName);
  expect(JSON.stringify(await dashboardB.json())).not.toContain(clients[0].companyName);
  await masterContext.close();
  await portalAContext.close();
  await portalBContext.close();
});
