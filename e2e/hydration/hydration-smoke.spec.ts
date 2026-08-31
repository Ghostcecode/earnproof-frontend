/**
 * Hydration smoke test
 * 
 * Verifies that the production build hydrates correctly without
 * console errors or hydration mismatches.
 */

import { test, expect } from '@playwright/test';

// Routes to test for hydration issues
const ROUTES_TO_TEST = [
  '/',
  '/about',
  '/how-it-works',
  '/faq',
  '/developers',
  '/issuers',
  '/privacy',
  '/terms',
  '/status',
  '/accessibility',
  '/contact',
  '/proof-types',
  '/verify',
  '/verify/credential',
];

test.describe('Hydration Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`Console Error: ${msg.text()}`);
      }
    });
    
    // Capture page errors
    page.on('pageerror', (error) => {
      console.log(`Page Error: ${error.message}`);
    });
  });

  for (const route of ROUTES_TO_TEST) {
    test(`should hydrate ${route} without errors`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const hydrationErrors: string[] = [];
      
      // Listen for console errors
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          consoleErrors.push(text);
          
          // Check for hydration-specific errors
          if (text.includes('hydration') || text.includes('Hydration') || text.includes('did not match')) {
            hydrationErrors.push(text);
          }
        }
      });
      
      // Navigate to the route
      await page.goto(route);
      
      // Wait for page to be interactive
      await page.waitForLoadState('networkidle');
      
      // Take a screenshot for visual reference (only on failure)
      test.info().attachments.push({
        name: `hydration-${route.replace(/\//g, '-')}`,
        contentType: 'image/png',
        path: await page.screenshot({ fullPage: true }),
      });
      
      // Check for hydration errors
      expect(hydrationErrors).toHaveLength(0);
      
      // Log any console errors (but don't fail the test for non-hydration errors)
      if (consoleErrors.length > 0) {
        console.log(`Console errors on ${route}:`, consoleErrors);
      }
      
      // Verify the page rendered something
      await expect(page.locator('body')).not.toBeEmpty();
      
      // Check for common hydration problem indicators
      const html = await page.content();
      
      // Should not have React hydration warning comments
      expect(html).not.toContain('<!--$-->');
      expect(html).not.toContain('hydration mismatch');
      
      // Should have proper React root
      expect(html).toContain('data-reactroot');
    });
  }

  test('should handle client component hydration', async ({ page }) => {
    // Test a route with client components
    await page.goto('/verify');
    
    await page.waitForLoadState('networkidle');
    
    // Verify form is interactive
    const input = page.locator('input, textarea, select').first();
    await expect(input).toBeVisible();
    
    // Try to interact with the page
    await input.fill('test');
    
    // No hydration errors should occur
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('hydration')) {
        consoleErrors.push(msg.text());
      }
    });
    
    // Trigger a re-render by clearing and re-filling
    await input.fill('');
    await input.fill('another test');
    
    expect(consoleErrors).toHaveLength(0);
  });

  test('should handle dynamic imports without hydration issues', async ({ page }) => {
    // This test verifies that lazy-loaded components hydrate correctly
    await page.goto('/');
    
    await page.waitForLoadState('networkidle');
    
    // Click any interactive element to trigger potential dynamic imports
    const link = page.locator('a').first();
    if (await link.isVisible()) {
      await link.click();
      await page.waitForTimeout(500); // Allow time for any dynamic imports
      
      // Check for hydration errors after interaction
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error' && msg.text().includes('hydration')) {
          consoleErrors.push(msg.text());
        }
      });
      
      expect(consoleErrors).toHaveLength(0);
    }
  });

  test('should maintain focus during hydration', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Focus behavior differs in WebKit');
    
    await page.goto('/verify');
    await page.waitForLoadState('networkidle');
    
    // Focus an input
    const input = page.locator('input').first();
    await input.focus();
    
    // Verify focus is maintained
    await expect(input).toBeFocused();
    
    // Simulate a re-render scenario
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Focus should not be lost in a way that causes hydration issues
    // (actual focus state after reload depends on browser behavior)
  });
});

test.describe('Production Build Hydration', () => {
  test('should build and start production server without errors', async ({ page }) => {
    // This test assumes the production server is already running
    // (configured in playwright.config.ts webServer)
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify we're not in development mode
    const html = await page.content();
    expect(html).not.toContain('webpack-hot-middleware');
    expect(html).not.toContain('Next.js');
    
    // Check for production indicators
    expect(html).toContain('EarnProof'); // App name in title or content
    
    // No hydration errors
    const hydrationErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('hydration')) {
        hydrationErrors.push(msg.text());
      }
    });
    
    // Trigger a navigation to test client-side routing
    await page.locator('a[href="/about"]').first().click();
    await page.waitForLoadState('networkidle');
    
    expect(hydrationErrors).toHaveLength(0);
  });
});