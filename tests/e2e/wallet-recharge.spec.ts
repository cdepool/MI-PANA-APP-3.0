import { test, expect } from '@playwright/test';

// Use the authenticated state from auth.spec.ts
test.use({ storageState: 'tests/e2e/.auth/user.json' });

test('wallet recharge with mocked Edge Function', async ({ page }) => {
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

    // Mock token refresh to avoid network error / logout
    await page.route('**/auth/v1/token?grant_type=refresh_token', async route => {
        await route.fulfill({
            json: {
                access_token: "fake-jwt-token-refreshed",
                token_type: "bearer",
                expires_in: 3600,
                refresh_token: "fake-refresh-token-new",
                user: {
                    id: "user-123",
                    aud: "authenticated",
                    role: "authenticated",
                    email: "test-passenger@mipana.app",
                    app_metadata: { provider: "email" },
                    user_metadata: { name: "Test Passenger", role: "passenger" }
                }
            }
        });
    });

    // Mock generic Rest calls (profiles, etc)
    await page.route('**/rest/v1/**', async route => {
        await route.fulfill({ status: 200, body: '[]', contentType: 'application/json' });
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
                message: 'Recarga procesada exitosamente'
            })
        });
    });

    await page.goto('/wallet');

    // Wait for app initialization (auth timeout workaround)
    await page.waitForTimeout(3000);

    // Click Recargar (loose match to handle icons/whitespace)
    const rechargeBtn = page.getByRole('button', { name: 'Recargar' });
    await expect(rechargeBtn).toBeVisible({ timeout: 30000 });
    await rechargeBtn.click();

    // STEP 1: Enter Amount
    await page.getByPlaceholder('0.00').fill('100');
    await page.click('button:has-text("Siguiente")');

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
    // Matches the mock: { success: true, message: 'Recarga procesada exitosamente' }
    // Verify success state: Modal should close
    // Wait for the modal 'Verificar Pago' button to detach/hide
    await expect(page.locator('button:has-text("Verificar Pago")')).toBeHidden();

    // Optionally check if we are back on the main dashboard (Recargar button visible)
    await expect(page.locator('button:has-text("Recargar")')).toBeVisible();
});
