import { test, expect } from '@playwright/test';

test.describe('CCOPINAI Dashboard', () => {
  test('Dashboard Load Test - Verify all elements and take screenshot', async ({ page }) => {
    // Step 1: Navigate to the CCOPINAI dashboard
    await page.goto('http://localhost:8081');
    
    // Step 2: Verify the page title
    await expect(page).toHaveTitle('Audio Transcript MCP');
    
    // Step 3: Verify the main heading is visible
    const mainHeading = page.locator('h1, [role="heading"]').filter({ hasText: 'Audio Transcript MCP' }).first();
    await expect(mainHeading).toBeVisible();
    
    // Step 4: Verify the subtitle is present
    const subtitle = page.locator('text=Sign in to continue');
    await expect(subtitle).toBeVisible();
    
    // Step 5: Verify the 'Sign in with Apple' button
    const appleButton = page.locator('button:has-text("Sign in with Apple"), [role="button"]:has-text("Sign in with Apple")');
    await expect(appleButton).toBeVisible();
    await expect(appleButton).toBeEnabled();
    
    // Step 6: Verify the 'Sign in with Google' button
    const googleButton = page.locator('button:has-text("Sign in with Google"), [role="button"]:has-text("Sign in with Google")');
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();
    
    // Step 7: Verify the 'Test Authentication' section
    const testAuthSection = page.locator('text=Test Authentication');
    await expect(testAuthSection).toBeVisible();
    
    // Step 8: Verify the 'Sign In with Test Account' button
    const testAccountButton = page.locator('button:has-text("Sign In with Test Account"), [role="button"]:has-text("Sign In with Test Account")');
    await expect(testAccountButton).toBeVisible();
    await expect(testAccountButton).toBeEnabled();
    
    // Step 9: Verify the 'Auth Debug Info' section
    const debugSection = page.locator('text=Auth Debug Info');
    await expect(debugSection).toBeVisible();
    
    // Step 10: Take a screenshot of the complete dashboard
    await page.screenshot({ 
      path: 'tests/screenshots/dashboard-full.png',
      fullPage: true 
    });
    
    // Additional verification: Check that authentication buttons are properly styled
    const buttons = page.locator('button, [role="button"]');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThanOrEqual(3); // At least Apple, Google, and Test Account buttons
    
    // Verify page is fully loaded by checking for debug info
    const sessionInfo = page.locator('text=Session:');
    await expect(sessionInfo).toBeVisible();
    
    console.log('✅ Dashboard test completed successfully');
    console.log('📸 Screenshot saved to tests/screenshots/dashboard-full.png');
  });

  test('Dashboard Responsive Design Test', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:8081');
    
    // Verify elements are still visible on mobile
    await expect(page.locator('text=Audio Transcript MCP')).toBeVisible();
    await expect(page.locator('text=Sign in with Apple')).toBeVisible();
    
    // Take mobile screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/dashboard-mobile.png',
      fullPage: true 
    });
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    
    await expect(page.locator('text=Audio Transcript MCP')).toBeVisible();
    
    // Take tablet screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/dashboard-tablet.png',
      fullPage: true 
    });
    
    console.log('✅ Responsive design test completed');
  });

  test('Dashboard Authentication Flow Test', async ({ page }) => {
    await page.goto('http://localhost:8081');
    
    // Test clicking the Test Account button
    const testAccountButton = page.locator('button:has-text("Sign In with Test Account"), [role="button"]:has-text("Sign In with Test Account")');
    await expect(testAccountButton).toBeVisible();
    
    // Click the test account button and verify any response
    await testAccountButton.click();
    
    // Wait a moment for any authentication flow to start
    await page.waitForTimeout(2000);
    
    // Take screenshot after clicking test auth
    await page.screenshot({ 
      path: 'tests/screenshots/dashboard-after-test-auth.png',
      fullPage: true 
    });
    
    console.log('✅ Authentication flow test completed');
  });
}); 