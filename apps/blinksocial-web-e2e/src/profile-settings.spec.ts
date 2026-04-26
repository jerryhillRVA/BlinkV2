import { test, expect } from '@playwright/test';
import {
  mockAuthenticatedUser,
  mockAuthenticatedUserNoWorkspaces,
} from './helpers/login';

test.describe('Profile Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.goto('/profile-settings');
  });

  test('should display "Profile Settings" heading', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Profile Settings');
  });

  test('should display subtitle', async ({ page }) => {
    await expect(page.locator('.page-subtitle')).toContainText(
      'Manage your personal information and account security.'
    );
  });

  test('should display Profile card with fields', async ({ page }) => {
    const card = page.locator('.profile-card');
    await expect(card).toBeVisible();
    await expect(card.locator('.card-title')).toHaveText('Profile');
    await expect(card.locator('text=Display Name')).toBeVisible();
    await expect(card.locator('text=Email')).toBeVisible();
    await expect(card.locator('text=Current Role')).toBeVisible();
    await expect(card.locator('text=Workspace Access')).toBeVisible();
  });

  test('should display Change Password card', async ({ page }) => {
    const card = page.locator('.password-card');
    await expect(card).toBeVisible();
    await expect(card.locator('.card-title')).toHaveText('Change Password');
  });

  test('should have password input fields', async ({ page }) => {
    await expect(page.locator('#current-password')).toBeVisible();
    await expect(page.locator('#new-password')).toBeVisible();
    await expect(page.locator('#confirm-password')).toBeVisible();
  });

  test('should have Change Password button', async ({ page }) => {
    await expect(page.locator('.change-password-btn')).toBeVisible();
    await expect(page.locator('.change-password-btn')).toHaveText(
      'Change Password'
    );
  });
});

test.describe('Profile Menu Navigation', () => {
  test('should navigate to profile settings from header menu', async ({
    page,
  }) => {
    await mockAuthenticatedUser(page);
    await page.goto('/');
    await page.locator('.avatar-placeholder').click();
    await expect(page.locator('.profile-menu')).toBeVisible();
    await page.locator('.profile-menu-item >> text=Profile Settings').click();
    await expect(page).toHaveURL(/\/profile-settings/);
    await expect(page.locator('h1')).toHaveText('Profile Settings');
  });

  test('should show Logout in profile menu', async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.goto('/');
    await page.locator('.avatar-placeholder').click();
    await expect(
      page.locator('.profile-menu-item >> text=Logout')
    ).toBeVisible();
  });

  test('should close menu when clicking outside', async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.goto('/');
    await page.locator('.avatar-placeholder').click();
    await expect(page.locator('.profile-menu')).toBeVisible();
    await page.locator('.profile-menu-backdrop').click();
    await expect(page.locator('.profile-menu')).not.toBeVisible();
  });
});

// Issue #23 — workspace nav on /profile-settings
test.describe('Profile Settings — Workspace Nav', () => {
  test('should show workspace selector and the workspace nav tabs on /profile-settings', async ({
    page,
  }) => {
    await mockAuthenticatedUser(page);
    await page.goto('/profile-settings');
    await expect(page.locator('.ws-selector-btn')).toBeVisible();
    const navItems = page.locator('.ws-nav-item');
    await expect(navItems).toHaveCount(3);
    await expect(navItems.nth(0)).toContainText('Content');
    await expect(navItems.nth(1)).toContainText('Calendar');
    await expect(navItems.nth(2)).toContainText('Strategy');
    // No tab should be active on /profile-settings
    await expect(page.locator('.ws-nav-item.active')).toHaveCount(0);
  });

  test('should navigate to /workspace/:id/content when Content tab is clicked', async ({
    page,
  }) => {
    await mockAuthenticatedUser(page);
    await page.goto('/profile-settings');
    await expect(page.locator('.ws-selector-btn')).toBeVisible();
    await page.locator('.ws-nav-item').filter({ hasText: 'Content' }).click();
    await expect(page).toHaveURL(/\/workspace\/[^/]+\/content$/);
  });

  test('should hide workspace selector and tabs when user has no workspaces', async ({
    page,
  }) => {
    await mockAuthenticatedUserNoWorkspaces(page);
    await page.goto('/profile-settings');
    await expect(page.locator('h1')).toHaveText('Profile Settings');
    await expect(page.locator('.ws-selector-btn')).toHaveCount(0);
    await expect(page.locator('.workspace-nav')).toHaveCount(0);
  });
});
