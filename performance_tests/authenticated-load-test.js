
import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = 'http://localhost:8080';

// Load test credentials from a local file.
// Do not commit this file to Git.
const accounts = JSON.parse(
  open('./test-accounts.json')
);

if (!Array.isArray(accounts) || accounts.length < 2) {
  throw new Error('At least 2 test accounts required');
}

const workflowFailures = new Rate('workflow_failures');

export const options = {
stages: [
  { duration: '30s', target: 10 },
  { duration: '1m', target: 25 },
  { duration: '1m', target: 50 },
  { duration: '1m', target: 75 },
  { duration: '1m', target: 100 },
  { duration: '1m', target: 100 },
  { duration: '1m', target: 10 },
  { duration: '30s', target: 0 },
],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
    workflow_failures: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

export default function () {
  // Assign one account to each virtual user.
  const account = accounts[
    (__VU - 1) % accounts.length
  ];

  // 1. Login
  const login = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: account.email,
      password: account.password,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
      tags: { endpoint: 'login' },
    }
  );

  let auth = null;

  try {
    auth = login.json();
  } catch {
    // Invalid JSON will fail validation below.
  }

  const loginOK =
    login.status === 200 &&
    typeof auth?.token === 'string' &&
    auth.token.length > 0 &&
    Number.isInteger(auth?.userId);

  check(login, {
    'Login successful with JWT': () => loginOK,
  });

  if (!loginOK) {
    workflowFailures.add(true);
    return;
  }

  const headers = {
    Authorization: `Bearer ${auth.token}`,
    'Content-Type': 'application/json',
  };

  // 2. Current user
  const me = http.get(
    `${BASE_URL}/api/auth/me`,
    {
      headers,
      tags: { endpoint: 'current_user' },
    }
  );

  let meData = null;

  try {
    meData = me.json();
  } catch {}

  const meOK =
    me.status === 200 &&
    meData?.userId === auth.userId &&
    meData?.email === account.email;

  check(me, {
    'Current user matches login': () => meOK,
  });

  sleep(1);

  // 3. Authenticated feed
  const feed = http.get(
    `${BASE_URL}/api/feed`,
    {
      headers,
      tags: { endpoint: 'feed' },
    }
  );

  const feedOK = feed.status === 200;

  check(feed, {
    'Authenticated feed returns 200': () => feedOK,
  });

  sleep(1);

  // 4. User profile
  const profile = http.get(
    `${BASE_URL}/api/users/${auth.userId}/profile`,
    {
      headers,
      tags: { endpoint: 'profile' },
    }
  );

  const profileOK = profile.status === 200;

  check(profile, {
    'User profile returns 200': () => profileOK,
  });

  workflowFailures.add(
    !(meOK && feedOK && profileOK)
  );

  sleep(1);
}
