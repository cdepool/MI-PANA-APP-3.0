import { test, expect } from '@playwright/test';

// Use the authenticated state
test.use({ storageState: 'tests/e2e/.auth/user.json' });

test('debug wallet page', async ({ page }) => {
    // Mock generic Rest calls
    await page.route('**/rest/v1/**', async route => {
        await route.fulfill({ status: 200, body: '[]', contentType: 'application/json' });
    });

    // Mock wallet balance
    await page.route('**/functions/v1/wallet-get-balance*', async route => {
        console.log('Mock hit: wallet-get-balance');
        await route.fulfill({
            json: {
                success: true,
                wallet: { balance_ves: 100, balance_usd: 10, status: 'active' },
                exchange_rate: 36.5
            }
        });
    });

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', exception => console.log(`PAGE ERROR: "${exception}"`));

    await page.goto('/billetera');

    // Wait for a bit to let things load
    await page.waitForTimeout(5000);

    const content = await page.content();
    console.log('PAGE CONTENT:', content);

    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('BODY TEXT:', bodyText);

    // Try to find the button
    const btn = page.locator('button:has-text("Recargar")');
    if (await btn.count() > 0) {
        console.log('Button found!');
        await btn.click();
        console.log('Clicked button. Waiting...');
        await page.waitForTimeout(2000);

        console.log('Post-click content:');
        console.log(await page.evaluate(() => document.body.innerText));
    } else {
        console.log('Button NOT found in DOM');
    }
});
