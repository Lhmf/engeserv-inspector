import { test, expect } from '@playwright/test';

const validEmail = process.env.E2E_TEST_EMAIL ?? 'admin@engeserv.com.br';
const validPassword = process.env.E2E_TEST_PASSWORD ?? 'demo123456';

test('login inválido exibe mensagem de erro', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('invalido@engeserv.com.br');
  await page.getByLabel('Senha').fill('senha-invalida');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText(/Não foi possível entrar|Erro/i)).toBeVisible();
});

test('login válido redireciona para dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(validEmail);
  await page.getByLabel('Senha').fill(validPassword);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
});

test('rota protegida redireciona sem sessão', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
  await context.close();
});
