import { test, expect } from '@playwright/test';

// primex-api (api.primex.ventures) — 26 critical endpoints
const API_URL = process.env.API_URL || 'http://localhost:8001';

interface Endpoint {
  path: string;
  expectedStatus: number;
  expectBody?: string;
  expectJsonKey?: string;
  label: string;
}

const CRITICAL_ENDPOINTS: Endpoint[] = [
  // Health
  { path: '/up', expectedStatus: 200, expectBody: 'OK', label: 'health check' },

  // Admin auth-protected
  { path: '/api/v1/auth/me', expectedStatus: 401, expectJsonKey: 'message', label: 'admin auth' },
  { path: '/api/v1/dashboard/overview', expectedStatus: 401, label: 'dashboard overview' },
  { path: '/api/v1/product-connections', expectedStatus: 401, label: 'product connections' },
  { path: '/api/v1/audit-logs', expectedStatus: 401, label: 'audit logs' },
  { path: '/api/v1/admin-users', expectedStatus: 401, label: 'admin users' },
  { path: '/api/v1/settings', expectedStatus: 401, label: 'settings' },

  // Founder auth-protected
  { path: '/api/v1/founder/heartbeat', expectedStatus: 401, label: 'founder heartbeat' },
  { path: '/api/v1/founder/infrastructure/droplets', expectedStatus: 401, label: 'founder droplets' },
  { path: '/api/v1/founder/infrastructure/databases', expectedStatus: 401, label: 'founder databases' },
  { path: '/api/v1/founder/infrastructure/domains', expectedStatus: 401, label: 'founder domains' },
  { path: '/api/v1/founder/products/health', expectedStatus: 401, label: 'founder products' },
  { path: '/api/v1/founder/alerts', expectedStatus: 401, label: 'founder alerts' },
  { path: '/api/v1/founder/security/feed', expectedStatus: 401, label: 'founder security' },
  { path: '/api/v1/founder/deployments/recent', expectedStatus: 401, label: 'founder deploys' },
  { path: '/api/v1/founder/revenue', expectedStatus: 401, label: 'founder revenue' },
  { path: '/api/v1/founder/activity', expectedStatus: 401, label: 'founder activity' },
  { path: '/api/v1/founder/bcmp/tenants', expectedStatus: 401, label: 'founder BCMP tenants' },
  { path: '/api/v1/founder/bcmp/subscription-stats', expectedStatus: 401, label: 'founder subscriptions' },
  { path: '/api/v1/founder/bcmp/pricing', expectedStatus: 401, label: 'founder pricing' },
  { path: '/api/v1/founder/bcmp/document-templates', expectedStatus: 401, label: 'founder templates' },
  { path: '/api/v1/founder/bcmp/marketplace/products', expectedStatus: 401, label: 'founder marketplace' },
  { path: '/api/v1/founder/psgc/provinces', expectedStatus: 401, label: 'founder PSGC' },

  // Vault auth-protected
  { path: '/api/v1/vault/heartbeat', expectedStatus: 401, label: 'vault heartbeat' },
  { path: '/api/v1/vault/categories', expectedStatus: 401, label: 'vault categories' },
  { path: '/api/v1/vault/guide', expectedStatus: 401, label: 'vault guide' },
];

for (const endpoint of CRITICAL_ENDPOINTS) {
  test(`API ${endpoint.path} → ${endpoint.expectedStatus} (${endpoint.label})`, async ({ request }) => {
    const response = await request.get(`${API_URL}${endpoint.path}`, {
      headers: { Accept: 'application/json' },
    });

    expect(response.status()).toBe(endpoint.expectedStatus);

    if (endpoint.expectBody) {
      const body = await response.text();
      expect(body).toContain(endpoint.expectBody);
    }

    if (endpoint.expectJsonKey) {
      const json = await response.json();
      expect(json).toHaveProperty(endpoint.expectJsonKey);
    }

    if (endpoint.expectedStatus === 200 || endpoint.expectedStatus === 201) {
      const body = await response.text();
      expect(body).not.toContain('Whoops, looks like something went wrong');
      expect(body).not.toContain('ErrorException');
    }
  });
}
