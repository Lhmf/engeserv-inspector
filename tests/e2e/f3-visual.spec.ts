import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test('F3: registra as telas internas e do portal em cada tema e viewport', async ({ page }, testInfo) => {
  const outputDir = path.join('docs', 'demo', 'f3');
  fs.mkdirSync(outputDir, { recursive: true });

  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /EngeServ/i })).toBeVisible();
  await page.screenshot({ path: path.join(outputDir, `${testInfo.project.name}-login.png`), fullPage: true });

  await page.goto('/portal/login');
  await expect(page).toHaveURL(/\/portal\/login/);
  await page.screenshot({ path: path.join(outputDir, `${testInfo.project.name}-portal-login.png`), fullPage: true });
});
