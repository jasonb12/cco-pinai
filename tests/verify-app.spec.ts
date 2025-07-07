import { test, expect } from '@playwright/test';

test.describe('CCOPINAI App Full Navigation', () => {
  test('Complete navigation flow: Welcome → SignIn → Dashboard → Tabs', async ({ page }) => {
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
    
    console.log('🚀 Starting complete navigation flow test...');
    
    // STEP 1: Welcome Screen
    await page.screenshot({ 
      path: 'tests/screenshots/01-welcome.png',
      fullPage: true 
    });
    console.log('📸 Step 1: Welcome screen captured');
    
    const ccopinaiText = await page.getByText('CCOPINAI').isVisible();
    const getStartedButton = await page.getByText('Get Started').isVisible();
    
    console.log(`✅ Welcome screen elements: CCOPINAI(${ccopinaiText}), Get Started(${getStartedButton})`);
    
    // STEP 2: Navigate to SignIn
    if (getStartedButton) {
      console.log('🔄 Step 2: Clicking Get Started...');
      await page.getByText('Get Started').click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: 'tests/screenshots/02-signin.png',
        fullPage: true 
      });
      console.log('📸 Step 2: SignIn screen captured');
      
      const demoSignInButton = await page.getByText('Demo Sign In').isVisible();
      console.log(`✅ SignIn screen elements: Demo Sign In(${demoSignInButton})`);
      
      // STEP 3: Demo Sign In
      if (demoSignInButton) {
        console.log('🔄 Step 3: Clicking Demo Sign In...');
        await page.getByText('Demo Sign In').click();
        await page.waitForTimeout(3000);
        
        await page.screenshot({ 
          path: 'tests/screenshots/03-dashboard.png',
          fullPage: true 
        });
        console.log('📸 Step 3: Dashboard screen captured');
        
        // Check Dashboard elements
        const dashboardTitle = await page.getByText('Dashboard').first().isVisible();
        const transcriptsCard = await page.getByText('Transcripts').isVisible();
        const activeSessionsCard = await page.getByText('Active Sessions').isVisible();
        
        console.log(`✅ Dashboard elements: Title(${dashboardTitle}), Transcripts(${transcriptsCard}), Sessions(${activeSessionsCard})`);
        
        // STEP 4: Test Tab Navigation - Chat
        const chatTab = await page.getByText('Chat').isVisible();
        if (chatTab) {
          console.log('🔄 Step 4: Testing Chat tab...');
          await page.getByText('Chat').click();
          await page.waitForTimeout(1000);
          
          await page.screenshot({ 
            path: 'tests/screenshots/04-chat.png',
            fullPage: true 
          });
          console.log('📸 Step 4: Chat screen captured');
          
                     const aiAssistantText = await page.getByText('AI Assistant').first().isVisible();
                     const chatMessage = await page.getByText('Hello! I\'m your AI assistant').isVisible();
          
          console.log(`✅ Chat screen elements: AI Assistant(${aiAssistantText}), Message(${chatMessage})`);
        }
        
        // STEP 5: Test Settings Tab
        const settingsTab = await page.getByText('Settings').isVisible();
        if (settingsTab) {
          console.log('🔄 Step 5: Testing Settings tab...');
          await page.getByText('Settings').click();
          await page.waitForTimeout(1000);
          
          await page.screenshot({ 
            path: 'tests/screenshots/05-settings.png',
            fullPage: true 
          });
          console.log('📸 Step 5: Settings screen captured');
          
          const accountSettings = await page.getByText('Account Settings').isVisible();
          const notifications = await page.getByText('Notifications').isVisible();
          
          console.log(`✅ Settings screen elements: Account(${accountSettings}), Notifications(${notifications})`);
        }
        
        // STEP 6: Return to Dashboard
        const dashboardTab = await page.getByText('Dashboard').isVisible();
        if (dashboardTab) {
          console.log('🔄 Step 6: Returning to Dashboard...');
          await page.getByText('Dashboard').click();
          await page.waitForTimeout(1000);
          
          await page.screenshot({ 
            path: 'tests/screenshots/06-dashboard-final.png',
            fullPage: true 
          });
          console.log('📸 Step 6: Final dashboard screenshot captured');
        }
      }
    }
    
    // Check page title
    const title = await page.title();
    console.log(`📄 Final page title: ${title}`);
    
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
    console.log(`🎯 Complete navigation flow: ${appLoaded ? 'SUCCESS' : 'FAILED'}`);
    console.log('🏁 Full navigation test complete');
  });
}); 