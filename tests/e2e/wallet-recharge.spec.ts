import { test, expect } from '@playwright/test';

// Use the authenticated state from auth.spec.ts
test.use({ storageState: 'tests/e2e/.auth/user.json' });

test('wallet recharge with mocked Edge Function', async ({ page }) => {
    // Debug console logs
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    page.on('pageerror', err => console.log(`BROWSER ERROR: ${err}`));

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
            }]) // Array because select('*') returns array by default, .single() handles it client side usually, or we return object if using headers. 
            // Supabase REST returns array by default for select. .single() ensures one.
        });
    });

    // Mock generic Rest calls (fallback)
    await page.route('**/rest/v1/**', async route => {
        // If it's not profiles (handled above), return empty
        if (!route.request().url().includes('profiles')) {
            await route.fulfill({ status: 200, body: '[]', contentType: 'application/json' });
        }
    });

    // Mock wallet balance to avoid initial errors
    await page.route('**/functions/v1/wallet-get-balance*', async route => {
        await route.fulfill({
            json: {
                success: true,
                wallet: { balance_ves: 100, balance_usd: 10, status: 'active' },
                exchange_rate: 36.5
            }
        });
    });

    // Mock transactions to avoid hang
    await page.route('**/functions/v1/wallet-get-transactions*', async route => {
        await route.fulfill({
            json: {
                success: true,
                transactions: [],
                total: 0,
                page: 1,
                limit: 10
            }
        });
    });

    // Mock Edge Function response for recharge
    await page.route('**/functions/v1/wallet-recharge', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                message: 'Recarga procesada exitosamente',
                wallet: {
                    balance_ves: 1545.00,
                    balance_usd: 14.50
                }
            })
        });
    });

    await page.goto('/wallet');

    // Wait for Balance to appear (confirms loading is done)
    await expect(page.getByText('$10.00')).toBeVisible({ timeout: 15000 });

    // Click Recargar (loose match to handle icons/whitespace)
    const rechargeBtn = page.getByRole('button', { name: 'Recargar' });
    await expect(rechargeBtn).toBeVisible();
    await rechargeBtn.click();

    // Verify Modal Opened
    await expect(page.getByText('Recargar Saldo', { exact: false })).toBeVisible();

    // STEP 1: Enter Amount
    const amountInput = page.getByPlaceholder('0.00');
    await expect(amountInput).toBeVisible();
    await amountInput.fill('100');

    await page.getByRole('button', { name: 'Siguiente' }).click();

    // STEP 2: Confirm Amount
    await expect(page.locator('button:has-text("Continuar")')).toBeVisible();
    await page.click('button:has-text("Continuar")');

    // STEP 3: Payment Details
    const bankSelect = page.locator('select');
    await expect(bankSelect).toBeVisible();
    await bankSelect.selectOption({ index: 1 });

    await page.getByPlaceholder('Últimos 4 dígitos de Referencia').fill('1234');

    await page.click('button:has-text("Verificar Pago")');

    // Verify success message
    await expect(page.getByText('¡Listo, Mi Pana!')).toBeVisible();
    await expect(page.getByText('Hemos acreditado')).toBeVisible();
});
