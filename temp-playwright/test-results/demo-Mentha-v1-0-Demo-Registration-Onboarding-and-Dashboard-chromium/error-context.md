# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: demo.spec.ts >> Mentha v1.0 Demo: Registration, Onboarding, and Dashboard
- Location: demo.spec.ts:4:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Create Project & Start Tracking")') to be visible

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - banner [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e7]: M
        - generic [ref=e8]: Mentha
    - main [ref=e9]:
      - generic [ref=e10]:
        - generic [ref=e11]:
          - img [ref=e13]
          - heading "Welcome to Mentha" [level=1] [ref=e15]
          - paragraph [ref=e16]: Let's set up your brand and start optimizing your Answer Engine visibility.
        - generic [ref=e17]:
          - generic [ref=e18]:
            - generic [ref=e19]: Your Website URL
            - textbox "Your Website URL" [ref=e20]:
              - /placeholder: "eg: www.mentha.ai"
              - text: https://www.stepwise.es/
          - button "Analyze Brand" [ref=e22] [cursor=pointer]
  - alert [ref=e23]: Onboarding | Mentha
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import path from 'path';
  3  | 
  4  | test('Mentha v1.0 Demo: Registration, Onboarding, and Dashboard', async ({ page }) => {
  5  |     // 1. Registration
  6  |     const timestamp = Date.now();
  7  |     const email = `demo${timestamp}@stepwise.es`;
  8  |     
  9  |     console.log('Navigating to register...');
  10 |     await page.goto('http://localhost:3000/register');
  11 |     await page.fill('input[placeholder="John Doe"]', 'Stepwise Demo');
  12 |     await page.fill('input[placeholder="name@company.com"]', email);
  13 |     await page.fill('input[placeholder="••••••••"]', 'Demo1234!');
  14 |     
  15 |     await page.screenshot({ path: 'register-page.png' });
  16 |     console.log('Registering...');
  17 |     await page.click('button:has-text("REGISTER & START SCANNING")');
  18 |     
  19 |     // 2. Onboarding
  20 |     console.log('Waiting for onboarding...');
  21 |     await page.waitForURL('**/onboarding', { timeout: 15000 });
  22 |     await page.fill('input[placeholder="eg: www.mentha.ai"]', 'https://www.stepwise.es/');
  23 |     await page.screenshot({ path: 'onboarding-step1.png' });
  24 |     
  25 |     console.log('Analyzing brand...');
  26 |     await page.click('button:has-text("Analyze Brand")');
  27 |     
  28 |     // Wait for analysis to complete (Step 3)
  29 |     console.log('Waiting for analysis result...');
> 30 |     await page.waitForSelector('button:has-text("Create Project & Start Tracking")', { timeout: 30000 });
     |                ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
  31 |     await page.screenshot({ path: 'onboarding-step3.png' });
  32 |     
  33 |     console.log('Creating project...');
  34 |     await page.click('button:has-text("Create Project & Start Tracking")');
  35 |     
  36 |     // 3. Scanning
  37 |     console.log('Scanning in progress...');
  38 |     await page.waitForSelector('text=100%', { timeout: 120000 });
  39 |     await page.screenshot({ path: 'onboarding-complete.png' });
  40 |     
  41 |     // 4. Dashboard
  42 |     console.log('Navigating to dashboard...');
  43 |     await page.waitForURL('**/dashboard', { timeout: 15000 });
  44 |     
  45 |     // Wait for chart to render
  46 |     await page.waitForSelector('.recharts-surface', { timeout: 15000 });
  47 |     
  48 |     // 5. Hover and Screenshot
  49 |     console.log('Capturing dashboard screenshot with hover...');
  50 |     const chart = page.locator('.recharts-surface').first();
  51 |     const box = await chart.boundingBox();
  52 |     if (box) {
  53 |         await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  54 |     }
  55 |     
  56 |     // Wait for tooltip
  57 |     await page.waitForTimeout(1000);
  58 |     
  59 |     const screenshotPath = 'C:\\Users\\beenruuu\\Downloads\\mentha-dashboard-linkedin.png';
  60 |     await page.screenshot({ path: screenshotPath, fullPage: true });
  61 |     console.log(`Screenshot saved to: ${screenshotPath}`);
  62 | });
  63 | 
```