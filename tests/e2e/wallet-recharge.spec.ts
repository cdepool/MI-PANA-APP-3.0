import { test, expect } from '@playwright/test';

// Use the authenticated state
test.use({ storageState: 'tests/e2e/.auth/user.json' });

test('wallet recharge happy path', async ({ page }) => {
    // Mock generic Rest calls
    await page.route('**/rest/v1/**', async route => {
        await route.fulfill({ status: 200, body: '[]', contentType: 'application/json' });
    });

    // Mock wallet balance
    await page.route('**/functions/v1/wallet-get-balance*', async route => {
        await route.fulfill({
            json: {
                success: true,
                wallet: { balance_ves: 100, balance_usd: 10, status: 'active' },
                exchange_rate: 36.5
            }
        });
    });

    // Mock Edge Function activation
    await page.route('**/functions/v1/wallet-recharge', async route => {
        await route.fulfill({
            status: 200,
            json: { success: true, message: 'Recarga exitosa' }
        });
    });

    await page.goto('/billetera');

    // Wait for balance and click Recharge
    await expect(page.locator('button:has-text("Recargar")')).toBeVisible();
    await page.click('button:has-text("Recargar")');

    // Wait for modal
    await expect(page.locator('text=Monto a Recargar')).toBeVisible();

    // Fill amount
    await page.getByPlaceholder('0.00').fill('100');
    await page.click('button:has-text("Siguiente")');

    // Submit payment (mocked)
    await page.click('button:has-text("Continuar")');
    await page.click('button:has-text("Verificar Pago")');

    // Verify success toast/message
    await expect(page.locator('text=¡Listo, Mi Pana!')).toBeVisible();
});
