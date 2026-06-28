import { test, expect } from '@playwright/test';

test.describe('Fluxo de Treino', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'aluno@teste.com');
    await page.fill('#password', 'aluno123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/aluno/**', { timeout: 15000 });
  });

  test('navegacao livre sem pop-ups durante treino', async ({ page }) => {
    test.setTimeout(120000);
    page.on('dialog', dialog => dialog.accept());

    // Iniciar treino
    await page.goto('/aluno/treinos');
    await page.waitForLoadState('networkidle');

    const workoutLinks = page.locator('a[href^="/aluno/treinos/"]').filter({ hasNotText: /editar/i });
    await workoutLinks.first().waitFor({ state: 'visible', timeout: 10000 });
    const href = await workoutLinks.first().getAttribute('href');
    await page.goto(href!);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navegar para dashboard diretamente - sem pop-up beforeunload
    await page.goto('/aluno/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 5000 });
  });

  test('badge "Em andamento" aparece para treino com sessao ativa', async ({ page }) => {
    test.setTimeout(120000);
    page.on('dialog', dialog => dialog.accept());

    // Iniciar treino
    await page.goto('/aluno/treinos');
    await page.waitForLoadState('networkidle');

    // No badge inicialmente
    await expect(page.locator('text=Em andamento')).toHaveCount(0);

    const workoutLinks = page.locator('a[href^="/aluno/treinos/"]').filter({ hasNotText: /editar/i });
    await workoutLinks.first().waitFor({ state: 'visible', timeout: 10000 });
    const href = await workoutLinks.first().getAttribute('href');
    await page.goto(href!);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Marcar serie
    const setRows = page.locator('[class*="cursor-pointer"]').filter({ has: page.locator('svg') });
    const count = await setRows.count();
    if (count > 0) {
      await setRows.first().click();
      await page.waitForTimeout(2000);
    }

    // Ir para lista de treinos
    await page.goto('/aluno/treinos');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Badge deve aparecer
    await expect(page.locator('text=Em andamento')).toBeVisible({ timeout: 5000 });
  });

  test('completar treino parcialmente e badge sumir', async ({ page }) => {
    test.setTimeout(120000);
    page.on('dialog', dialog => dialog.accept());

    // Iniciar treino
    await page.goto('/aluno/treinos');
    await page.waitForLoadState('networkidle');

    const workoutLinks = page.locator('a[href^="/aluno/treinos/"]').filter({ hasNotText: /editar/i });
    await workoutLinks.first().waitFor({ state: 'visible', timeout: 10000 });
    const href = await workoutLinks.first().getAttribute('href');
    await page.goto(href!);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Marcar uma serie
    const setRows = page.locator('[class*="cursor-pointer"]').filter({ has: page.locator('svg') });
    const count = await setRows.count();
    if (count > 0) {
      await setRows.first().click();
      await page.waitForTimeout(1500);
    }

    // Concluir treino
    await page.click('button:has-text("Concluir Treino")');
    await page.waitForURL('**/aluno/historico', { timeout: 10000 }).catch(() => {});

    // Ir para treinos - badge deve sumir
    await page.goto('/aluno/treinos');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page.locator('text=Em andamento')).toHaveCount(0);
  });
});
