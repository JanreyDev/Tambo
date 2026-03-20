import { test, expect } from '@playwright/test';

// bcmp-api (api.kapitan.ph) — 31 critical endpoints
const API_URL = process.env.API_URL || 'http://localhost:8000';

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

  // Public
  { path: '/api/v1/psgc/provinces', expectedStatus: 200, expectJsonKey: 'data', label: 'PSGC provinces' },

  // Auth-protected (must return 401 without token)
  { path: '/api/v1/auth/me', expectedStatus: 401, expectJsonKey: 'message', label: 'auth protection' },
  { path: '/api/v1/residents', expectedStatus: 401, label: 'residents' },
  { path: '/api/v1/dashboard/stats', expectedStatus: 401, label: 'dashboard stats' },
  { path: '/api/v1/settings', expectedStatus: 401, label: 'settings' },
  { path: '/api/v1/ai/credits', expectedStatus: 401, label: 'AI credits' },
  { path: '/api/v1/voters', expectedStatus: 401, label: 'voters' },
  { path: '/api/v1/issued-documents', expectedStatus: 401, label: 'issued documents' },
  { path: '/api/v1/kp-cases', expectedStatus: 401, label: 'KP cases' },
  { path: '/api/v1/blotters', expectedStatus: 401, label: 'blotters' },
  { path: '/api/v1/vawc-cases', expectedStatus: 401, label: 'VAWC cases' },
  { path: '/api/v1/tanods', expectedStatus: 401, label: 'tanods' },
  { path: '/api/v1/budgets', expectedStatus: 401, label: 'budgets' },
  { path: '/api/v1/inventory-items', expectedStatus: 401, label: 'inventory' },
  { path: '/api/v1/drive/files', expectedStatus: 401, label: 'drive files' },
  { path: '/api/v1/marketplace/products', expectedStatus: 401, label: 'marketplace' },
  { path: '/api/v1/messages', expectedStatus: 401, label: 'messages' },
  { path: '/api/v1/establishments', expectedStatus: 401, label: 'establishments' },
  { path: '/api/v1/lots-buildings', expectedStatus: 401, label: 'lots/buildings' },
  { path: '/api/v1/map/residents', expectedStatus: 401, label: 'map residents' },
  { path: '/api/v1/households', expectedStatus: 401, label: 'households' },
  { path: '/api/v1/officials', expectedStatus: 401, label: 'officials' },
  { path: '/api/v1/puroks', expectedStatus: 401, label: 'puroks' },
  { path: '/api/v1/document-templates', expectedStatus: 401, label: 'document templates' },
  { path: '/api/v1/posts', expectedStatus: 401, label: 'posts' },
  { path: '/api/v1/employees', expectedStatus: 401, label: 'employees' },
  { path: '/api/v1/evacuations', expectedStatus: 401, label: 'evacuations' },
  { path: '/api/v1/gad-plans', expectedStatus: 401, label: 'GAD plans' },
  { path: '/api/v1/assets', expectedStatus: 401, label: 'assets' },

  // Admin-protected
  { path: '/api/v1/admin/barangays', expectedStatus: 401, label: 'admin barangays' },
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

    // Catch Laravel debug HTML masquerading as JSON
    if (endpoint.expectedStatus === 200 || endpoint.expectedStatus === 201) {
      const body = await response.text();
      expect(body).not.toContain('Whoops, looks like something went wrong');
      expect(body).not.toContain('ErrorException');
    }
  });
}
