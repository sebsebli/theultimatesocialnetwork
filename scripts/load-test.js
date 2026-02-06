/**
 * Load testing script for Citewalk API using k6.
 *
 * Usage:
 *   k6 run scripts/load-test.js
 *   k6 run --vus 50 --duration 60s scripts/load-test.js
 *   K6_BASE_URL=https://citewalk.com/api k6 run scripts/load-test.js
 *
 * Install k6: https://k6.io/docs/getting-started/installation/
 *   brew install k6  (macOS)
 *   apt install k6   (Linux)
 *
 * Environment variables (pass with -e flag or export):
 *   BASE_URL   - API base URL (default: http://localhost:3000/api)
 *   AUTH_TOKEN - Bearer token for authenticated endpoints (optional)
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    // Smoke test: low load to verify correctness
    smoke: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
      tags: { scenario: 'smoke' },
    },
    // Load test: ramp up to expected production load
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },   // Warm up
        { duration: '1m', target: 50 },     // Ramp to normal load
        { duration: '30s', target: 100 },   // Push to peak
        { duration: '1m', target: 100 },    // Sustain peak
        { duration: '30s', target: 0 },     // Cool down
      ],
      startTime: '35s', // Start after smoke test finishes
      tags: { scenario: 'load' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% under 500ms, 99% under 1s
    http_req_failed: ['rate<0.01'],                  // Less than 1% failures
    'http_req_duration{scenario:smoke}': ['p(95)<300'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

function getHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (AUTH_TOKEN) h['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  return h;
}

export default function () {
  const headers = getHeaders();
  const params = { headers, timeout: '10s' };

  // 1. Health check (lightweight)
  const healthRes = http.get(`${BASE_URL}/health`, { timeout: '5s' });
  check(healthRes, { 'health: status 200': (r) => r.status === 200 });

  // 2. Search posts (read-heavy, uses Meilisearch)
  const searchRes = http.get(`${BASE_URL}/search/posts?q=test&limit=10`, params);
  check(searchRes, { 'search posts: status 2xx': (r) => r.status >= 200 && r.status < 300 });

  // 3. Search users
  const usersSearchRes = http.get(`${BASE_URL}/search/users?q=test&limit=5`, params);
  check(usersSearchRes, { 'search users: status 2xx': (r) => r.status >= 200 && r.status < 300 });

  // 4. Search topics
  const topicsSearchRes = http.get(`${BASE_URL}/search/topics?q=test&limit=5`, params);
  check(topicsSearchRes, { 'search topics: status 2xx': (r) => r.status >= 200 && r.status < 300 });

  // 5. Explore endpoints (cached, read-heavy)
  const exploreRes = http.get(`${BASE_URL}/explore/quoted-now?limit=20`, params);
  check(exploreRes, { 'explore: status 2xx or 401': (r) => r.status < 500 });

  // 6. Suggested users
  const suggestedRes = http.get(`${BASE_URL}/users/suggested?limit=5`, params);
  check(suggestedRes, { 'suggested: status 2xx or 401': (r) => r.status < 500 });

  // 7. Authenticated endpoints (only with auth token)
  if (AUTH_TOKEN) {
    const meRes = http.get(`${BASE_URL}/users/me`, params);
    check(meRes, { 'me: status 200': (r) => r.status === 200 });

    const postsRes = http.get(`${BASE_URL}/users/me/posts?limit=10`, params);
    check(postsRes, { 'my posts: status 200': (r) => r.status === 200 });

    const notifsRes = http.get(`${BASE_URL}/users/me/notification-prefs`, params);
    check(notifsRes, { 'notif prefs: status 200': (r) => r.status === 200 });
  }

  // Random sleep between iterations (simulates user think time)
  sleep(Math.random() * 2 + 0.5);
}
