import { test, expect } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/login';

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
    await expect(card.locator('text=Current Workspace Role')).toBeVisible();
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
