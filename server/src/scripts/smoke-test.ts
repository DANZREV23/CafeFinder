// server/src/scripts/smoke-test.ts
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.APP_URL || `http://localhost:${PORT}`;

async function runSmokeTest() {
  console.log(`[SmokeTest]: Starting tests on ${BASE_URL}`);
  
  const endpoints = [
    { path: '/api/live', expectedStatus: 200, name: 'Liveness Probe' },
    { path: '/api/ready', expectedStatus: 200, name: 'Readiness Probe' },
    { path: '/api/health', expectedStatus: 200, name: 'Health Status' },
    { path: '/', expectedStatus: 200, name: 'Root/SPA' },
    { path: '/manifest.webmanifest', expectedStatus: 200, name: 'PWA Manifest' },
    { path: '/sw.js', expectedStatus: 200, name: 'Service Worker' },
    { path: '/api/cafes', expectedStatus: 200, name: 'Cafes List API' },
    { path: '/api/blog', expectedStatus: 200, name: 'Blog API' },
    { path: '/api/lists', expectedStatus: 200, name: 'Lists API' },
    { path: '/robots.txt', expectedStatus: 200, name: 'Robots.txt' },
    { path: '/sitemap.xml', expectedStatus: 200, name: 'Sitemap' },
  ];

  let failedCount = 0;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint.path}`);
      if (response.status === endpoint.expectedStatus) {
        console.log(`[PASS] ${endpoint.name}: Status ${response.status}`);
      } else {
        console.error(`[FAIL] ${endpoint.name}: Expected ${endpoint.expectedStatus}, got ${response.status}`);
        failedCount++;
      }
    } catch (err: any) {
      console.error(`[FAIL] ${endpoint.name}: Connection error - ${err.message}`);
      failedCount++;
    }
  }

  if (failedCount > 0) {
    console.error(`[SmokeTest]: ${failedCount} tests failed.`);
    process.exit(1);
  } else {
    console.log('[SmokeTest]: All tests passed.');
    process.exit(0);
  }
}

runSmokeTest();
