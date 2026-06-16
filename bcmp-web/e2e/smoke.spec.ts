import { test, expect } from '@playwright/test';

// bcmp-web (kapitan.ph) — 33 critical pages
// Most routes redirect to login when not authenticated.
// expectText verifies the correct page rendered (not blank/crashed).
const CRITICAL_PAGES: Array<{ path: string; expectText: string }> = [
  { path: '/', expectText: 'Sign in' },
  { path: '/login', expectText: 'Sign in' },
  { path: '/forgot-password', expectText: 'Forgot' },
  { path: '/census', expectText: 'Census' },
  { path: '/dashboard', expectText: 'Dashboard' },
  { path: '/dashboard/ai', expectText: 'AI' },
  { path: '/dashboard/residents', expectText: 'Resident' },
  { path: '/dashboard/establishments', expectText: 'Establishment' },
  { path: '/dashboard/lots-buildings', expectText: 'Lot' },
  { path: '/dashboard/voters', expectText: 'Voter' },
  { path: '/dashboard/households', expectText: 'Household' },
  { path: '/dashboard/judicial/kp-cases', expectText: 'KP' },
  { path: '/dashboard/judicial/blotter', expectText: 'Blotter' },
  { path: '/dashboard/vawc', expectText: 'VAWC' },
  { path: '/dashboard/tanod', expectText: 'Tanod' },
  { path: '/dashboard/finance', expectText: 'Finance' },
  { path: '/dashboard/inventory', expectText: 'Inventory' },
  { path: '/dashboard/drive', expectText: 'Drive' },
  { path: '/dashboard/email', expectText: 'Email' },
  { path: '/dashboard/marketplace', expectText: 'Marketplace' },
  { path: '/dashboard/documents', expectText: 'Document' },
  { path: '/dashboard/documents/templates', expectText: 'Template' },
  { path: '/dashboard/gad', expectText: 'GAD' },
  { path: '/dashboard/hris', expectText: 'HR' },
  { path: '/dashboard/disaster', expectText: 'Disaster' },
  { path: '/dashboard/map', expectText: 'Map' },
  { path: '/dashboard/public-portal', expectText: 'Portal' },
  { path: '/dashboard/reports', expectText: 'Report' },
  { path: '/dashboard/requests', expectText: 'Request' },
  { path: '/dashboard/support', expectText: 'Support' },
  { path: '/dashboard/account', expectText: 'Account' },
  { path: '/dashboard/settings', expectText: 'Setting' },
  { path: '/dashboard/updates', expectText: 'Update' },
  { path: '/dashboard/help', expectText: 'Help' },
];

for (const { path, expectText } of CRITICAL_PAGES) {
  test(`page renders: ${path}`, async ({ page }) => {
    const response = await page.goto(path, { waitUntil: 'networkidle' });
    expect(response?.status()).toBeLessThan(400);
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.trim().length).toBeGreaterThan(0);
    await expect(page.locator('body')).toContainText(expectText);
  });
}

const consoleErrors: string[] = [];
test.beforeEach(async ({ page }) => {
  consoleErrors.length = 0;
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('favicon.ico')) return;
      if (text.includes('third-party cookie')) return;
      consoleErrors.push(text);
    }
  });
  page.on('pageerror', (error) => {
    consoleErrors.push(`PAGE ERROR: ${error.message}`);
  });
});

test.afterEach(async ({}, testInfo) => {
  if (testInfo.title.startsWith('page renders:') && consoleErrors.length > 0) {
    console.log('Console errors detected:');
    consoleErrors.forEach((e) => console.log(`  - ${e}`));
  }
});
