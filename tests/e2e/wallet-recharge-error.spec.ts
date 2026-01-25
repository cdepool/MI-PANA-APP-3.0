import { test, expect } from '@playwright/test';

test.use({ storageState: 'tests/e2e/.auth/user.json' });

test('wallet recharge handles 500 error from Bancamiga', async ({ page }) => {
    // Mock generic Rest calls
    await page.route('**/rest/v1/**', async route => {
        await route.fulfill({ status: 200, body: '[]', contentType: 'application/json' });
    });

    // Mock Edge Function failure (500)
    await page.route('**/functions/v1/wallet-recharge', async route => {
        await route.fulfill({
            status: 500,
            json: { error: 'Bancamiga API timeout' }
        });
    });

    await page.goto('/wallet');
    await page.click('button:has-text("Recargar")');

    await page.getByPlaceholder('0.00').fill('100');
    await page.click('button:has-text("Siguiente")');
    await page.click('button:has-text("Verificar Pago")');

    // Verify user-friendly error message
    const errorLocator = page.locator('[role="alert"], .error-message').first();
    await expect(errorLocator).toBeVisible();
    const text = await errorLocator.textContent();
    expect(text?.toLowerCase()).toMatch(/error|falló|intentar/);
});
