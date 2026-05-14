import { test, expect } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/login';

test.describe('Header', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.goto('/');
  });

  test('should display brand icon with SVG', async ({ page }) => {
    const icon = page.locator('.brand-icon');
    await expect(icon).toBeVisible();
    await expect(icon.locator('svg')).toBeAttached();
  });

  test('should display "BLINK" brand text', async ({ page }) => {
    await expect(page.locator('.brand-text')).toHaveText('BLINK SOCIAL');
  });

  test('should display user name and role', async ({ page }) => {
    await expect(page.locator('.user-name')).toHaveText('Blink Admin');
    await expect(page.locator('.user-role')).toHaveText('Admin');
  });

  test('should display avatar with "BA" initials', async ({ page }) => {
    await expect(page.locator('.avatar-placeholder')).toContainText('BA');
  });

  test('should show profile menu with logout when avatar is clicked', async ({ page }) => {
    await page.locator('.avatar-placeholder').click();
    await expect(page.locator('.profile-menu')).toBeVisible();
    await expect(page.locator('.profile-menu-item.logout')).toBeVisible();
  });
});

test.describe('Header — desktop layout (1280×800)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.goto('/workspace/hive-collective/content');
  });

  test('TC-1: hamburger hidden; nav tabs, settings gear, inline user-info all visible', async ({ page }) => {
    // Header-level elements should render even if pipeline body is still loading
    await expect(page.locator('.brand-text')).toBeVisible();

    await expect(page.locator('[data-testid="mobile-menu-btn"]')).toBeHidden();
    await expect(page.locator('.workspace-nav')).toBeVisible();
    await expect(page.locator('.ws-nav-item').nth(0)).toBeVisible();
    await expect(page.locator('.ws-nav-item').nth(1)).toBeVisible();
    await expect(page.locator('.ws-nav-item').nth(2)).toBeVisible();
    await expect(page.locator('.settings-btn')).toBeVisible();
    await expect(page.locator('.user-info')).toBeVisible();
  });

  test('avatar dropdown does not show user-info section on desktop', async ({ page }) => {
    await expect(page.locator('.brand-text')).toBeVisible();
    await page.locator('.avatar-placeholder').click();
    await expect(page.locator('.profile-menu')).toBeVisible();
    // Element is in DOM but hidden via CSS display:none
    await expect(page.locator('[data-testid="profile-menu-user-info"]')).toBeHidden();
  });
});

test.describe('Header — mobile layout (375×667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.goto('/workspace/hive-collective/content');
  });

  test('TC-2: hamburger visible; nav tabs, settings gear, inline user-info hidden', async ({ page }) => {
    await expect(page.locator('.brand-text')).toBeVisible();

    await expect(page.locator('[data-testid="mobile-menu-btn"]')).toBeVisible();
    await expect(page.locator('.workspace-nav')).toBeHidden();
    await expect(page.locator('.settings-btn')).toBeHidden();
    await expect(page.locator('.user-info')).toBeHidden();
    await expect(page.locator('.ws-selector-btn')).toBeVisible();
    await expect(page.locator('.theme-toggle-btn')).toBeVisible();
    await expect(page.locator('.avatar-placeholder')).toBeVisible();
  });

  test('TC-2: DOM order in .navbar-start is brand → mobile-menu-container → ws-selector-container', async ({ page }) => {
    // Wait for workspace-nav to be in the DOM (showWorkspaceNav() resolved) before reading order
    await expect(page.locator('.ws-selector-btn')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-menu-btn"]')).toBeVisible();
    const order = await page.evaluate(() => {
      const start = document.querySelector('.navbar-start');
      if (!start) return [];
      return Array.from(start.children).map((c) => Array.from(c.classList));
    });
    const idxOf = (cls: string) => order.findIndex((classes) => classes.includes(cls));
    const brandIdx = idxOf('navbar-brand');
    const mobileIdx = idxOf('mobile-menu-container');
    const wsIdx = idxOf('ws-selector-container');
    expect(brandIdx).toBeGreaterThanOrEqual(0);
    expect(mobileIdx).toBeGreaterThan(brandIdx);
    expect(wsIdx).toBeGreaterThan(mobileIdx);
  });

  test('TC-3: clicking hamburger opens menu with 3 items; clicking Calendar navigates and closes', async ({ page }) => {
    const btn = page.locator('[data-testid="mobile-menu-btn"]');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute('aria-expanded', 'false');

    await btn.click();
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    const items = page.locator('.mobile-menu-item');
    await expect(items).toHaveCount(3);
    await expect(items.nth(0)).toContainText('Content');
    await expect(items.nth(0)).toHaveClass(/active/);
    await expect(items.nth(1)).toContainText('Calendar');
    await expect(items.nth(2)).toContainText('Strategy');

    await items.nth(1).click();
    await expect(page).toHaveURL(/\/workspace\/hive-collective\/calendar/);
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeHidden();

    await btn.click();
    await expect(page.locator('.mobile-menu-item').nth(1)).toHaveClass(/active/);
    await expect(page.locator('.mobile-menu-item').nth(0)).not.toHaveClass(/active/);
  });

  test('TC-4: backdrop and Escape close the hamburger', async ({ page }) => {
    const btn = page.locator('[data-testid="mobile-menu-btn"]');
    await btn.click();
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    await page.locator('.mobile-menu-backdrop').click();
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeHidden();
    await expect(btn).toHaveAttribute('aria-expanded', 'false');

    await btn.click();
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeHidden();
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  test('TC-5: avatar dropdown shows user-info section at top', async ({ page }) => {
    await page.locator('.avatar-placeholder').click();
    const menu = page.locator('.profile-menu');
    await expect(menu).toBeVisible();
    const info = page.locator('[data-testid="profile-menu-user-info"]');
    await expect(info).toBeVisible();
    await expect(info.locator('.profile-menu-user-name')).toHaveText('Blink Admin');
    await expect(info.locator('.profile-menu-user-role')).toHaveText('Admin');
    // user-info is the first visible child
    const firstChildTestId = await menu.evaluate((m) => m.children[0]?.getAttribute('data-testid') ?? '');
    expect(firstChildTestId).toBe('profile-menu-user-info');
  });

  test('TC-7: dark-mode dropdown uses --blink-surface (no white flash)', async ({ page }) => {
    await expect(page.locator('.brand-text')).toBeVisible();
    // force-click: at 375px the ws-selector-name can overlap the theme-toggle area
    // (known out-of-scope crowding noted in the design). We're testing the dropdown's
    // dark-mode computed color, not click ergonomics of the theme toggle.
    await page.locator('.theme-toggle-btn').click({ force: true });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.locator('[data-testid="mobile-menu-btn"]').click();
    const menu = page.locator('[data-testid="mobile-menu"]');
    await expect(menu).toBeVisible();
    const bg = await menu.evaluate((el) => getComputedStyle(el).backgroundColor);
    // In dark mode --blink-surface is dark; rgb(255,255,255) would be the buggy light flash
    expect(bg).not.toBe('rgb(255, 255, 255)');
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
  });
});

test.describe('Header — viewport resize', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
  });

  test('TC-6: resize 1280 → 375 → 1280 flips layout without reload', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/workspace/hive-collective/content');
    await expect(page.locator('.brand-text')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-menu-btn"]')).toBeHidden();
    await expect(page.locator('.workspace-nav')).toBeVisible();

    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="mobile-menu-btn"]')).toBeVisible();
    await expect(page.locator('.workspace-nav')).toBeHidden();

    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('[data-testid="mobile-menu-btn"]')).toBeHidden();
    await expect(page.locator('.workspace-nav')).toBeVisible();
  });
});

test.describe('Header — dashboard route at mobile width', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('TC-8: dashboard at 375 hides hamburger (showWorkspaceNav is false); avatar dropdown still shows user-info', async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.goto('/');
    await expect(page.locator('.brand-text')).toBeVisible();
    // Hamburger is gated by showWorkspaceNav() — dashboard route returns false
    await expect(page.locator('[data-testid="mobile-menu-btn"]')).toHaveCount(0);
    await expect(page.locator('.theme-toggle-btn')).toBeVisible();
    await expect(page.locator('.avatar-placeholder')).toBeVisible();

    await page.locator('.avatar-placeholder').click();
    await expect(page.locator('.profile-menu')).toBeVisible();
    await expect(page.locator('[data-testid="profile-menu-user-info"]')).toBeVisible();
  });
});
