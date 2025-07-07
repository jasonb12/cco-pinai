import { test, expect } from '@playwright/test';

test.describe('CCOPINAI Dashboard - Simple Tests', () => {
  test('Dashboard Load and Screenshot Test', async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('http://localhost:8081');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Verify the page title
    await expect(page).toHaveTitle('Audio Transcript MCP');
    
    // Verify main content is visible (using more flexible selectors)
    await expect(page.locator('text=Audio Transcript MCP')).toBeVisible();
    await expect(page.locator('text=Sign in to continue')).toBeVisible();
    
    // Verify authentication buttons are present
    await expect(page.locator('text=Sign in with Apple')).toBeVisible();
    await expect(page.locator('text=Sign in with Google')).toBeVisible();
    await expect(page.locator('text=Sign In with Test Account')).toBeVisible();
    
    // Verify debug section
    await expect(page.locator('text=Auth Debug Info')).toBeVisible();
    
    // Take a full page screenshot
    await page.screenshot({ 
      path: 'screenshots/dashboard-full.png',
      fullPage: true 
    });
    
    console.log('✅ Dashboard test completed successfully');
    console.log('📸 Screenshot saved to screenshots/dashboard-full.png');
  });

  test('Dashboard Button Interaction Test', async ({ page }) => {
    await page.goto('http://localhost:8081');
    await page.waitForLoadState('networkidle');
    
    // Find and click the test account button
    const testButton = page.locator('text=Sign In with Test Account');
    await expect(testButton).toBeVisible();
    
    // Take screenshot before clicking
    await page.screenshot({ 
      path: 'screenshots/dashboard-before-click.png',
      fullPage: true 
    });
    
    // Click the test button
    await testButton.click();
    
    // Wait a moment for any changes
    await page.waitForTimeout(2000);
    
    // Take screenshot after clicking
    await page.screenshot({ 
      path: 'screenshots/dashboard-after-click.png',
      fullPage: true 
    });
    
    console.log('✅ Button interaction test completed');
  });

  test('Dashboard Mobile View Test', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('http://localhost:8081');
    await page.waitForLoadState('networkidle');
    
    // Verify elements are still visible on mobile
    await expect(page.locator('text=Audio Transcript MCP')).toBeVisible();
    await expect(page.locator('text=Sign in with Apple')).toBeVisible();
    
    // Take mobile screenshot
    await page.screenshot({ 
      path: 'screenshots/dashboard-mobile.png',
      fullPage: true 
    });
    
    console.log('✅ Mobile view test completed');
  });
}); 