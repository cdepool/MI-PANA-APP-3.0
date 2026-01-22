import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Authentication Flow', () => {

    test('login with valid credentials', async ({ page }) => {
        // Go to login page
        await page.goto('/login');

        // Handle Security Modal if present
        const modalBtn = page.getByRole('button', { name: 'OK, Entendido' });
        try {
            if (await modalBtn.isVisible({ timeout: 5000 })) {
                await modalBtn.click();
            }
        } catch (e) {
            console.log('Modal not found or already dismissed');
        }

        // Check initial state (Heading: ¡Hola de nuevo!)
        await expect(page.getByRole('heading', { name: '¡Hola de nuevo!' })).toBeVisible();

        // Fill credentials (using placeholders from inspection)
        await page.getByPlaceholder('Teléfono o correo').fill('test-passenger@mipana.app');
        await page.getByPlaceholder('••••••••').fill('Test123!');

        // Setup shared storage state path
        const storageStatePath = 'tests/e2e/.auth/user.json';

        // Mock auth response to ensure success without backend dependency
        await page.route('**/auth/v1/token?grant_type=password', async route => {
            const json = {
                access_token: "fake-jwt-token",
                token_type: "bearer",
                expires_in: 3600,
                refresh_token: "fake-refresh-token",
                user: {
                    id: "user-123",
                    aud: "authenticated",
                    role: "authenticated",
                    email: "test-passenger@mipana.app",
                    user_metadata: {
                        name: "Test Passenger",
                        role: "passenger"
                    }
                }
            };
            await route.fulfill({ json });
        });

        // Click login button (Text: Ingresar)
        await page.getByRole('button', { name: 'Ingresar' }).click();

        // Expect redirect to dashboard or passenger home
        await expect(page).toHaveURL(/\/dashboard|\/passenger/);

        // --- SMOKE TEST EXTENSION: WALLET ---
        console.log('Navigating to Wallet for Smoke Test...');

        // Setup mocks BEFORE navigation
        await page.route('**/functions/v1/wallet-get-balance*', async route => {
            await route.fulfill({
                json: {
                    success: true,
                    wallet: { balance_ves: 100, balance_usd: 10, status: 'active' },
                    exchange_rate: 36.5
                }
            });
        });
        await page.route('**/functions/v1/wallet-get-transactions*', async route => {
            await route.fulfill({ json: { success: true, transactions: [] } });
        });

        // Use standard Playwright mock for rest calls if needed
        await page.route('**/rest/v1/**', async route => {
            await route.fulfill({ status: 200, body: '[]', contentType: 'application/json' });
        });

        await page.goto('/wallet');

        // Verify Wallet UI loads "Recargar" button
        const rechargeBtn = page.locator('button:has-text("Recargar")');
        await expect(rechargeBtn).toBeVisible({ timeout: 15000 });
        console.log('Wallet UI verified successfully in Auth flow');

        // Save storage state for other tests
        const dir = path.dirname(storageStatePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        await page.context().storageState({ path: storageStatePath });
    });
});
