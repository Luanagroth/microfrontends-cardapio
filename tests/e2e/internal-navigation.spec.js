const { test, expect } = require('@playwright/test');

test.describe('Internal navigation', () => {
  test('logs in and switches sections with hash sync', async ({ page }) => {
    await page.goto('http://localhost:3000');

    await page.getByLabel('Login').fill('admin@essenza.local');
    await page.getByLabel('Senha').fill('admin123');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByRole('heading', { name: 'Painel interno' })).toBeVisible();

    await page.getByRole('link', { name: 'Reservas' }).click();
    await expect(page).toHaveURL(/#reservas/);
    await expect(page.getByRole('heading', { name: 'Reservas' }).first()).toBeVisible();

    await page.getByRole('link', { name: 'Mesas' }).click();
    await expect(page).toHaveURL(/#mesas/);
    await expect(page.getByRole('heading', { name: 'Mapa de mesas' })).toBeVisible();
  });
});
