
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
stages: [
  { duration: '30s', target: 100 },
  { duration: '2m', target: 100 },
  { duration: '30s', target: 0 },
],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
    checks: ['rate>0.99'],
  },
};

const BASE_URL = 'http://localhost:8080';

export default function () {
  // Retrieve events
  const events = http.get(`${BASE_URL}/api/events`);

  check(events, {
    'Events API returns 200': (r) => r.status === 200,
    'Events API returns JSON array': (r) => {
      try {
        return Array.isArray(r.json());
      } catch {
        return false;
      }
    },
  });

  sleep(1);

  // Retrieve opportunities
  const opportunities = http.get(`${BASE_URL}/api/opportunities`);

  check(opportunities, {
    'Opportunities API returns 200': (r) => r.status === 200,
    'Opportunities API returns JSON array': (r) => {
      try {
        return Array.isArray(r.json());
      } catch {
        return false;
      }
    },
  });

  sleep(1);
}
