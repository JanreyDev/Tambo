import { test, expect } from '@playwright/test';

// primex-founder-web (founder.primex.ventures) — 19 critical pages
const CRITICAL_PAGES: Array<{ path: string; expectText: string }> = [
  { path: '/', expectText: 'PrimeX' },
  { path: '/passcode', expectText: 'Passcode' },
  { path: '/vault', expectText: 'Vault' },
  { path: '/vault/guide', expectText: 'Vault' },
  { path: '/dashboard', expectText: 'Dashboard' },
  { path: '/dashboard/bcmp', expectText: 'BCMP' },
  { path: '/dashboard/bcmp/tenants', expectText: 'Tenant' },
  { path: '/dashboard/bcmp/subscriptions', expectText: 'Subscription' },
  { path: '/dashboard/bcmp/analytics', expectText: 'Analytics' },
  { path: '/dashboard/bcmp/templates', expectText: 'Template' },
  { path: '/dashboard/bcmp/marketplace', expectText: 'Marketplace' },
  { path: '/dashboard/lgmp', expectText: 'LGMP' },
  { path: '/dashboard/pdmp', expectText: 'PDMP' },
  { path: '/dashboard/infrastructure', expectText: 'Infrastructure' },
  { path: '/dashboard/users', expectText: 'User' },
  { path: '/dashboard/support', expectText: 'Support' },
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
