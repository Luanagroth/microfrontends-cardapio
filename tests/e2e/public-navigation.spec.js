const { test, expect } = require('@playwright/test');

test.describe('Public navigation', () => {
  test('highlights top menu based on manual scroll and click', async ({ page }) => {
    await page.goto('http://localhost:4001');

    const inicio = page.getByRole('link', { name: 'Inicio' });
    const reservas = page.getByRole('link', { name: 'Reservas' });
    const curriculos = page.getByRole('link', { name: 'Curriculos' });
    const contato = page.getByRole('link', { name: 'Contato' });

    await expect(inicio).toHaveClass(/active/);

    await reservas.click();
    await expect(reservas).toHaveClass(/active/);

    await curriculos.click();
    await expect(curriculos).toHaveClass(/active/);

    await contato.click();
    await expect(contato).toHaveClass(/active/);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(250);
    await expect(contato).toHaveClass(/active/);
  });
});
