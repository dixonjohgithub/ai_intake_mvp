import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('homepage visual snapshot', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Wait for content to load
    await page.waitForLoadState('networkidle');

    // Take a screenshot of the full page
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('header component visual snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const header = await page.locator('header');
    await expect(header).toHaveScreenshot('header.png');
  });

  test('hero banner visual snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const heroBanner = await page.locator('section').first();
    await expect(heroBanner).toHaveScreenshot('hero-banner.png');
  });

  test('service tiles visual snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const serviceTiles = await page.locator('section').nth(1);
    await expect(serviceTiles).toHaveScreenshot('service-tiles.png');
  });

  test('responsive design - mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('responsive design - tablet view', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('focus states visual snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tab to the first service tile to show focus state
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const serviceTiles = await page.locator('section').nth(1);
    await expect(serviceTiles).toHaveScreenshot('service-tiles-focused.png');
  });

  test('hover states visual snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find service tile using the CSS selector
    const firstTile = await page.locator('a[href="/submit-idea"]').first();
    await firstTile.waitFor({ state: 'visible' });
    await firstTile.hover();

    await expect(firstTile).toHaveScreenshot('service-tile-hover.png');
  });
});