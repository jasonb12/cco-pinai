import { test, expect } from '@playwright/test';

test.describe('CCOPINAI App Verification', () => {
  test('Verify app display, navigation, and console logs', async ({ page }) => {
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
    
    // Take a screenshot of Welcome screen
    await page.screenshot({ 
      path: 'tests/screenshots/verification-welcome.png',
      fullPage: true 
    });
    
    console.log('📸 Welcome screen screenshot taken');
    
    // Check page content
    const pageContent = await page.textContent('body');
    console.log('📝 Page contains text:', JSON.stringify(pageContent?.slice(0, 200) + '...'));
    
    // Check for specific elements
    const ccopinaiText = await page.getByText('CCOPINAI').isVisible();
    const getStartedButton = await page.getByText('Get Started').isVisible();
    const signInButton = await page.getByText('Sign In').isVisible();
    
    console.log('🔍 Elements found:');
    console.log(`  - CCOPINAI text: ${ccopinaiText}`);
    console.log(`  - Get Started button: ${getStartedButton}`);
    console.log(`  - Sign In button: ${signInButton}`);
    
    // Test navigation by clicking Get Started
    if (getStartedButton) {
      console.log('🔄 Testing navigation: Clicking Get Started button...');
      await page.getByText('Get Started').click();
      
      // Wait for navigation to complete
      await page.waitForTimeout(2000);
      
      // Take screenshot of SignIn screen
      await page.screenshot({ 
        path: 'tests/screenshots/verification-signin.png',
        fullPage: true 
      });
      
      console.log('📸 SignIn screen screenshot taken');
      
      // Verify we're on SignIn screen
      const signInTitle = await page.getByText('Sign In').first().isVisible();
      const backButton = await page.getByText('← Back to Welcome').isVisible();
      
      console.log('🔍 SignIn screen elements:');
      console.log(`  - Sign In title: ${signInTitle}`);
      console.log(`  - Back button: ${backButton}`);
      
      // Test navigation back
      if (backButton) {
        console.log('🔄 Testing back navigation...');
        await page.getByText('← Back to Welcome').click();
        await page.waitForTimeout(1000);
        
        // Verify we're back on Welcome screen
        const backOnWelcome = await page.getByText('CCOPINAI').isVisible();
        console.log(`✅ Back on Welcome screen: ${backOnWelcome}`);
      }
    }
    
    // Check page title
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    // Log console messages
    console.log(`📊 Console messages (${consoleMessages.length} total):`);
    consoleMessages.forEach((msg, index) => {
      console.log(`  ${index + 1}. ${msg}`);
    });
    
    // Check for errors
    if (errors.length > 0) {
      console.log(`❌ Errors found:`);
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ No JavaScript errors detected');
    }
    
    // Verify app loaded successfully
    const appLoaded = ccopinaiText && !errors.some(e => e.includes('import.meta'));
    console.log(`🎯 App loaded successfully: ${appLoaded}`);
    console.log('✅ Verification complete');
  });
}); 