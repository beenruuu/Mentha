import { test, expect } from '@playwright/test';
import path from 'path';

test('Mentha v1.0 Demo: Registration, Onboarding, and Dashboard', async ({ page }) => {
    // 1. Registration
    const timestamp = Date.now();
    const email = `demo${timestamp}@stepwise.es`;
    
    console.log('Navigating to register...');
    await page.goto('http://localhost:3000/register');
    await page.fill('input[placeholder="John Doe"]', 'Stepwise Demo');
    await page.fill('input[placeholder="name@company.com"]', email);
    await page.fill('input[placeholder="••••••••"]', 'Demo1234!');
    
    await page.screenshot({ path: 'register-page.png' });
    console.log('Registering...');
    await page.click('button:has-text("REGISTER & START SCANNING")');
    
    // 2. Onboarding
    console.log('Waiting for onboarding...');
    await page.waitForURL('**/onboarding', { timeout: 15000 });
    await page.fill('input[placeholder="eg: www.mentha.ai"]', 'https://www.stepwise.es/');
    await page.screenshot({ path: 'onboarding-step1.png' });
    
    console.log('Analyzing brand...');
    await page.click('button:has-text("Analyze Brand")');
    
    // Wait for analysis to complete (Step 3)
    console.log('Waiting for analysis result...');
    await page.waitForSelector('button:has-text("Create Project & Start Tracking")', { timeout: 30000 });
    await page.screenshot({ path: 'onboarding-step3.png' });
    
    console.log('Creating project...');
    await page.click('button:has-text("Create Project & Start Tracking")');
    
    // 3. Scanning
    console.log('Scanning in progress...');
    await page.waitForSelector('text=100%', { timeout: 120000 });
    await page.screenshot({ path: 'onboarding-complete.png' });
    
    // 4. Dashboard
    console.log('Navigating to dashboard...');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    
    // Wait for chart to render
    await page.waitForSelector('.recharts-surface', { timeout: 15000 });
    
    // 5. Hover and Screenshot
    console.log('Capturing dashboard screenshot with hover...');
    const chart = page.locator('.recharts-surface').first();
    const box = await chart.boundingBox();
    if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    }
    
    // Wait for tooltip
    await page.waitForTimeout(1000);
    
    const screenshotPath = 'C:\\Users\\beenruuu\\Downloads\\mentha-dashboard-linkedin.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved to: ${screenshotPath}`);
});
