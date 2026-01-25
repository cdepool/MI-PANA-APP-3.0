import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Authentication Flow', () => {

    test('login with valid credentials', async ({ page }) => {
        // Go to login page
        await page.goto('/login');

        // Handle Security Modal if present
        const modalBtn = page.getByRole('button', { name: 'OK, Entendido' });
        if (await modalBtn.isVisible()) {
            await modalBtn.click();
        }

        // Fill credentials
        await page.getByPlaceholder('Teléfono o correo').fill('test-passenger@mipana.app');
        await page.getByPlaceholder('••••••••').fill('Test123!');

        // Mock auth response
        await page.route('**/auth/v1/token?grant_type=password', async route => {
            const json = {
                access_token: "fake-jwt",
                user: { id: "user-123", email: "test-passenger@mipana.app", user_metadata: { role: "passenger" } }
            };
            await route.fulfill({ json });
        });

        // Click login
        await page.getByRole('button', { name: 'Ingresar' }).click();

        // Expect redirect
        await expect(page).toHaveURL(/\/dashboard|\/passenger/);
    });
});
