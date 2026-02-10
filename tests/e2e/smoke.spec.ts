import { test, expect } from '@playwright/test';
import { UserRole } from '../../src/types';

test.describe('Smoke Tests (Mocked)', () => {
    test.beforeEach(async ({ page }) => {
        // 1. Mock Supabase Auth Session
        await page.route('**/auth/v1/user', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'test-user-id',
                    aud: 'authenticated',
                    role: 'authenticated',
                    email: 'test@mipana.app',
                    user_metadata: {
                        full_name: 'Test Panic',
                        role: 'PASSENGER'
                    }
                })
            });
        });

        // 2. Mock Wallet Balance (Edge Function)
        // Note: The app uses fetch to functions/v1/wallet-get-balance
        await page.route('**/functions/v1/wallet-get-balance*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    wallet: {
                        balance_ves: 100.00,
                        balance_usd: 2.50,
                        status: 'active'
                    },
                    exchange_rate: 40.0
                })
            });
        });
    });

    test('Should load Welcome Page', async ({ page }) => {
        // Navigate to root, should redirect to /welcome if not auth
        await page.goto('/');

        // Check if we are at Welcome or Home
        // Since we didn't inject localStorage, we expect /welcome
        await expect(page).toHaveURL(/\/welcome/);
        await expect(page.getByText('Mi Pana').first()).toBeVisible();
    });

    test('Full Flow: Login + Wallet Recharge (Mocked)', async ({ page }) => {
        // 1. Mock Login Endpoint (Password Grant)
        await page.route('**/auth/v1/token?grant_type=password', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    access_token: 'mock-access-token',
                    token_type: 'bearer',
                    expires_in: 3600,
                    refresh_token: 'mock-refresh-token',
                    user: {
                        id: 'test-user-id',
                        aud: 'authenticated',
                        role: 'authenticated',
                        email: 'test@mipana.app',
                        user_metadata: {
                            full_name: 'Test Panic',
                            role: 'PASSENGER'
                        }
                    }
                })
            });
        });

        // 2. Mock Recharge Endpoint
        await page.route('**/functions/v1/wallet-recharge', async (route) => {
            const body = JSON.parse(route.request().postData() || '{}');
            if (!body.userId || !body.bancoOrig) {
                await route.fulfill({ status: 400, body: JSON.stringify({ error: 'Missing data' }) });
                return;
            }

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    wallet: {
                        balance_ves: 200.00,
                        balance_usd: 5.00
                    },
                    transaction: { reference: body.lastFourDigits }
                })
            });
        });

        // Start at Login directly (since we verified /login exists now)
        await page.goto('/login');

        // Fill Credentials (mocked)
        await page.getByPlaceholder(/correo/i).fill('test@mipana.app');
        await page.getByPlaceholder('••••••••').fill('password123');

        // Submit Login
        await page.getByRole('button', { name: /ingresar/i }).click();

        // Expect redirection to Home / Dashboard
        await expect(page).toHaveURL('/');

        // Now navigate to Wallet
        await page.goto('/billetera');

        // Check if "Recargar" button appears (proving we are authenticated and on protected route)
        // Using getByText since it might be icon + text
        await expect(page.getByText('Recargar Saldo')).toBeVisible();

        // Perform Recharge
        await page.getByText('Recargar Saldo').click();

        // Fill Amount
        await page.getByPlaceholder('0.00').fill('100');
        await page.getByRole('button', { name: /siguiente/i }).click();

        // Confirm Amount
        await page.getByRole('button', { name: /continuar/i }).click();

        // Fill Payment Details
        // Select mock bank
        const bankSelect = page.locator('select');
        await bankSelect.selectOption({ index: 3 }); // Select 'Mercantil' or 'Bancamiga'

        await page.getByPlaceholder('Últimos 4 dígitos de Referencia').fill('1234');

        // Submit
        await page.getByRole('button', { name: /verificar pago/i }).click();

        // Verify Success Message
        await expect(page.getByText(/¡Listo, Mi Pana!/i)).toBeVisible();
        await expect(page.getByText('$5.00')).toBeVisible();
    });
});
