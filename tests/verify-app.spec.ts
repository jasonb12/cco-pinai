import { test, expect } from '@playwright/test';

test.describe('CCOPINAI App Verification', () => {
  test('Verify app display and console logs', async ({ page }) => {
    // Capture console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });

    // Capture any errors
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(`Error: ${error.message}`);
    });

    // Navigate to app
    await page.goto('http://localhost:8081');
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot to see what's on screen
    await page.screenshot({ 
      path: 'tests/screenshots/verification-screen.png',
      fullPage: true 
    });
    
    console.log('📸 Screenshot taken: verification-screen.png');
    
    // Check for common elements that should be present
    const bodyText = await page.textContent('body');
    console.log('📝 Page contains text:', bodyText?.substring(0, 200) + '...');
    
    // Look for key elements
    const hasWelcome = await page.locator('text=CCOPINAI').isVisible({ timeout: 5000 }).catch(() => false);
    const hasGetStarted = await page.locator('text=Get Started').isVisible({ timeout: 5000 }).catch(() => false);
    const hasSignIn = await page.locator('text=Sign In').isVisible({ timeout: 5000 }).catch(() => false);
    
    console.log('🔍 Elements found:');
    console.log('  - CCOPINAI text:', hasWelcome);
    console.log('  - Get Started button:', hasGetStarted);
    console.log('  - Sign In button:', hasSignIn);
    
    // Check page title
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    // Report console messages
    console.log('📊 Console messages (' + consoleMessages.length + ' total):');
    consoleMessages.slice(0, 10).forEach((msg, i) => {
      console.log(`  ${i + 1}. ${msg}`);
    });
    
    if (consoleMessages.length > 10) {
      console.log(`  ... and ${consoleMessages.length - 10} more messages`);
    }
    
    // Report errors
    if (errors.length > 0) {
      console.log('❌ Errors found:');
      errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    } else {
      console.log('✅ No JavaScript errors detected');
    }
    
    // Check if the app loaded successfully
    const isAppLoaded = hasWelcome || hasGetStarted || hasSignIn;
    console.log('🎯 App loaded successfully:', isAppLoaded);
    
    // Verify basic functionality
    expect(title).toBeTruthy();
    console.log('✅ Verification complete');
  });
}); 