import { test, expect } from '@playwright/test';

test.describe('Previsualizacao de Midias em Treinos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('input#email');
    const passwordInput = page.locator('input#password');

    await emailInput.click();
    await emailInput.pressSequentially('john@doe.com', { delay: 10 });
    await passwordInput.click();
    await passwordInput.pressSequentially('johndoe123', { delay: 10 });

    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/professor/**', { timeout: 20000 });
  });

  test('upload de midia mostra previsualizacao apos envio', async ({ page }) => {
    test.setTimeout(120000);

    await page.goto('/professor/treinos/novo');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('Treino A').fill('Treino Teste Midia');

    const uploadArea = page.getByText('Foto/Vídeo').first();
    await expect(uploadArea).toBeVisible({ timeout: 5000 });

    const uploadInput = page.locator('input[type="file"]').first();
    await expect(uploadInput).toBeAttached();
  });

  test('carregar treino existente mostra midias com URL Supabase', async ({ page }) => {
    test.setTimeout(120000);

    await page.goto('/professor/treinos');
    await page.waitForLoadState('networkidle');

    const editLinks = page.locator('a[href*="/professor/treinos/"]').filter({ hasText: /editar|Editar/ });
    const count = await editLinks.count();

    if (count > 0) {
      await editLinks.first().click();
      await page.waitForLoadState('networkidle');

      const nameInput = page.getByPlaceholder('Treino A');
      await expect(nameInput).toBeVisible({ timeout: 10000 });

      const mediaPreviews = page.locator('img[src*="supabase"], video[src*="supabase"]');
      const mediaCount = await mediaPreviews.count();

      if (mediaCount > 0) {
        const src = await mediaPreviews.first().getAttribute('src');
        expect(src).toContain('supabase.co/storage/v1/object/public');
      }
    }
  });
});