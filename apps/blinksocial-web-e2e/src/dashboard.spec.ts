import { test, expect } from '@playwright/test';

test.describe('Page Background', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have the correct page background color', async ({ page }) => {
    await expect(page.locator('body')).toHaveCSS(
      'background-color',
      'rgb(248, 249, 250)'
    );
  });
});

test.describe('Dashboard Background', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have a decorative background glow', async ({ page }) => {
    await expect(page.locator('.dashboard-bg')).toBeAttached();
  });
});

test.describe('Welcome Header', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have a header icon', async ({ page }) => {
    await expect(page.locator('.header-icon')).toBeVisible();
  });

  test('should display "Welcome to Blink Social"', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Welcome to Blink Social');
  });

  test('should display the subtitle about content strategy', async ({ page }) => {
    await expect(page.locator('.subtitle')).toContainText(
      'multi-platform content strategy'
    );
  });

  test('should center the header text', async ({ page }) => {
    const header = page.locator('.dashboard-header');
    await expect(header).toHaveCSS('text-align', 'center');
  });
});

test.describe('Workspace Grid', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have new workspace card as first child', async ({ page }) => {
    const grid = page.locator('.workspace-grid');
    const firstChild = grid.locator('> :first-child');
    await expect(firstChild).toHaveClass(/card-new/);
  });

  test('should have exactly 2 workspace cards', async ({ page }) => {
    const cards = page.locator('app-workspace-card');
    await expect(cards).toHaveCount(2);
  });
});

test.describe('New Workspace Card', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have a plus circle', async ({ page }) => {
    await expect(page.locator('.plus-circle')).toBeVisible();
  });

  test('should display "New Workspace" label', async ({ page }) => {
    await expect(page.locator('.new-label')).toHaveText('New Workspace');
  });

  test('should display description text', async ({ page }) => {
    await expect(page.locator('.new-description')).toContainText(
      'Initialize a new content strategy'
    );
  });

  test('should change border color on hover', async ({ page }) => {
    const card = page.locator('.card-new');
    await card.hover();
    await expect(card).toHaveCSS('border-color', 'rgb(217, 78, 51)');
  });
});

test.describe('Workspace Cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display workspace names in headers', async ({ page }) => {
    const names = page.locator('.header-name');
    await expect(names.nth(0)).toHaveText('Hive Collective');
    await expect(names.nth(1)).toHaveText('Booze Kills');
  });

  test('should have globe watermark SVGs', async ({ page }) => {
    const watermarks = page.locator('.globe-watermark');
    await expect(watermarks).toHaveCount(2);
  });

  test('should have QUICK ACCESS labels', async ({ page }) => {
    const labels = page.locator('.quick-label');
    await expect(labels).toHaveCount(2);
    await expect(labels.first()).toHaveText('QUICK ACCESS');
  });

  test('should have 4 quick access items per card', async ({ page }) => {
    const cards = page.locator('app-workspace-card');
    for (let i = 0; i < 2; i++) {
      const items = cards.nth(i).locator('.quick-item');
      await expect(items).toHaveCount(4);
    }
  });

  test('should have "Go to Workspace" links', async ({ page }) => {
    const links = page.locator('.workspace-link');
    await expect(links).toHaveCount(2);
    await expect(links.first()).toContainText('Go to Workspace');
  });
});
