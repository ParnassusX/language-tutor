import { test, expect } from '@playwright/test';

test('Smoke Test: Page Loads and has correct title', async ({ page }) => {
  // Navigate to the root of the application
  await page.goto('/');

  // Check that the main heading is visible
  const heading = page.locator('h1');
  await expect(heading).toBeVisible();

  // Check that the title of the page is correct
  await expect(page).toHaveTitle(/German Language Tutor/);
});