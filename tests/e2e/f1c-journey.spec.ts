import { test, expect } from '@playwright/test';

const password = process.env.E2E_TEST_PASSWORD ?? 'Qa!Lote21B#2026';
const roles = [
  { name: 'master', email: process.env.E2E_MASTER_EMAIL ?? 'admin.qa@engeserv.test' },
  { name: 'funcionario', email: process.env.E2E_FUNC_EMAIL ?? 'func.qa@engeserv.test' },
  { name: 'gestor', email: process.env.E2E_GESTOR_EMAIL ?? 'gestor.qa@engeserv.test' },
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

test('jornada F1c visual do Portal do Cliente A', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/portal/login');
  await page.getByLabel('Usuário').fill(process.env.E2E_PORTAL_NAME ?? 'Aurora');
  await page.getByLabel('Senha').fill(process.env.E2E_PORTAL_CNPJ ?? '112223');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.goto('/portal/dashboard');
  await expect(page).toHaveURL(/\/portal\/dashboard/);
  await page.screenshot({ path: 'docs/demo/f1c/portal-cliente-a-dashboard.png', fullPage: true });
  await page.goto('/portal/equipamentos');
  await page.screenshot({ path: 'docs/demo/f1c/portal-cliente-a-equipamentos.png', fullPage: true });
  await page.goto('/portal/laudos');
  await page.screenshot({ path: 'docs/demo/f1c/portal-cliente-a-laudos.png', fullPage: true });
  await context.close();
});
