import { test, expect } from '@playwright/test';

const password = process.env.E2E_TEST_PASSWORD ?? 'demo123456';
test.setTimeout(120_000);
const roles = [
  { name: 'master', email: process.env.E2E_MASTER_EMAIL ?? 'admin@engeserv.com.br' },
  { name: 'funcionario', email: process.env.E2E_FUNC_EMAIL ?? 'demo@engeserv.com.br' },
  { name: 'gestor', email: process.env.E2E_GESTOR_EMAIL ?? 'gestor@engeserv.com.br' },
];

test('jornada F1c visual por papel e portal', async ({ browser }) => {
  for (const role of roles) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/login');
    await page.getByLabel('Email').fill(role.email);
    await page.getByLabel('Senha').fill(password);
    const response = page.waitForResponse((item) => item.url().endsWith('/api/auth/login'));
    await page.getByRole('button', { name: 'Entrar' }).click();
    expect((await response).status()).toBe(200);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    await page.screenshot({ path: `docs/demo/f1c/${role.name}-dashboard.png`, fullPage: true });
    await page.goto('/equipamentos');
    await page.screenshot({ path: `docs/demo/f1c/${role.name}-equipamentos.png`, fullPage: true });
    await page.goto('/inspecoes');
    await page.screenshot({ path: `docs/demo/f1c/${role.name}-inspecoes.png`, fullPage: true });
    await page.goto('/laudos');
    await page.screenshot({ path: `docs/demo/f1c/${role.name}-laudos.png`, fullPage: true });
    await context.close();
  }
});

test('jornada F1c visual do Portal do Cliente A', async ({ browser, request }) => {
  const unique = Date.now().toString().slice(-6);
  const portalName = `ClienteF1c${unique}`;
  const portalCnpj = `${unique}00000000`;
  const internalLogin = await request.post('/api/auth/login', {
    data: { email: 'admin@engeserv.com.br', password },
  });
  expect(internalLogin.status()).toBe(200);
  const clientResponse = await request.post('/api/clientes', {
    data: { name: `${portalName} Engenharia QA`, cnpj: portalCnpj },
  });
  expect(clientResponse.status()).toBe(201);
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/portal/login');
  await page.getByLabel('Usuário').fill(process.env.E2E_PORTAL_NAME ?? portalName);
  await page.getByLabel('Senha').fill(process.env.E2E_PORTAL_CNPJ ?? unique);
  const portalLogin = page.waitForResponse((item) => item.url().endsWith('/api/portal/login'));
  await page.getByRole('button', { name: 'Entrar' }).click();
  expect((await portalLogin).status()).toBe(200);
  await page.goto('/portal/dashboard');
  await expect(page).toHaveURL(/\/portal\/dashboard/);
  await page.screenshot({ path: 'docs/demo/f1c/portal-cliente-a-dashboard.png', fullPage: true });
  await page.goto('/portal/equipamentos');
  await page.screenshot({ path: 'docs/demo/f1c/portal-cliente-a-equipamentos.png', fullPage: true });
  await page.goto('/portal/laudos');
  await page.screenshot({ path: 'docs/demo/f1c/portal-cliente-a-laudos.png', fullPage: true });
  await context.close();
});
