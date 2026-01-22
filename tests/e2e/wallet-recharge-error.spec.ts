import { test, expect } from '@playwright/test';

test.use({ storageState: 'tests/e2e/.auth/user.json' });

test('wallet recharge handles 500 error gracefully', async ({ page }) => {
    // Mock checking current user (Auth)
    await page.route('**/auth/v1/user', async route => {
        await route.fulfill({
            json: {
                id: "user-123",
                aud: "authenticated",
                role: "authenticated",
                email: "test-passenger@mipana.app",
                app_metadata: { provider: "email" },
                user_metadata: { name: "Test Passenger", role: "passenger" },
                created_at: new Date().toISOString()
            }
        });
    });

    // Mock profile fetch (AuthContext needs this)
    await page.route('**/rest/v1/profiles*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{
                id: "user-123",
                name: "Test Passenger",
                role: "passenger",
                email: "test-passenger@mipana.app",
                phone: "555-0000"
            }])
        });
    });

    // Mock generic Rest calls
    await page.route('**/rest/v1/**', async route => {
        if (!route.request().url().includes('profiles')) {
            await route.fulfill({ status: 200, body: '[]', contentType: 'application/json' });
        }
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

    // Mock transactions
    await page.route('**/functions/v1/wallet-get-transactions*', async route => {
        await route.fulfill({ json: { success: true, transactions: [] } });
    });

    // Mock Bancamiga failure (500)
    await page.route('**/functions/v1/wallet-recharge', async route => {
        await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
                error: 'Bancamiga API timeout. Por favor intente más tarde.'
            })
        });
    });

    await page.goto('/wallet');
    const rechargeBtn = page.locator('button:has-text("Recargar")');
    await expect(rechargeBtn).toBeVisible({ timeout: 10000 });
    await rechargeBtn.click();

    // STEP 1
    await page.getByPlaceholder('0.00').fill('100');
    await page.click('button:has-text("Siguiente")');

    // STEP 2
    await page.click('button:has-text("Continuar")');

    // STEP 3
    await page.locator('select').selectOption({ index: 1 });
    await page.getByPlaceholder('Últimos 4 dígitos de Referencia').fill('9876');
    await page.click('button:has-text("Verificar Pago")');

    // Verify user-friendly error
    const errorLocator = page.getByText('Bancamiga API timeout', { exact: false });
    await expect(errorLocator).toBeVisible();

    const errorMessage = await errorLocator.textContent();

    // Security Checks
    expect(errorMessage).not.toContain('Internal server');

    // We expect the mock's error "Bancamiga API timeout" to be displayed 
    // OR "Error de conexión" if fetch fails silently
    // But the mock returns 500 status with JSON, so response.ok=false, result.error used.
    expect(errorMessage?.toLowerCase()).toContain('timeout');
});
