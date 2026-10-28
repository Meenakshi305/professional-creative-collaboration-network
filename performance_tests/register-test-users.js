
const fs = require('node:fs');

const BASE_URL = 'http://localhost:8080';
const accounts = JSON.parse(
  fs.readFileSync('test-accounts.json', 'utf8')
);

async function main() {
  if (process.env.CONFIRM_TEST_DB !== 'yes') {
    throw new Error(
      'Run only against a disposable local test database. Set CONFIRM_TEST_DB=yes after verifying it.'
    );
  }

  if (!Array.isArray(accounts) || accounts.length === 0) {
    throw new Error('No test accounts found');
  }

  let registered = 0;
  let failed = 0;
  let alreadyExists = 0;

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];

    const payload = {
      fullName: account.fullName,
      username: account.username,
      email: account.email,
      password: account.password,
      dateOfBirth: account.dateOfBirth,
    };

    try {
      const response = await fetch(
        `${BASE_URL}/api/auth/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (response.ok) {
        registered++;
        console.log(
          `[${i + 1}/${accounts.length}] Registered`
        );
      } else {
        failed++;
        const error = await response.text();
        console.log(
          `[${i + 1}/${accounts.length}] Failed: HTTP ${response.status} - ${error.slice(0, 200)}`
        );
      }
    } catch (error) {
      failed++;
      console.log(
        `[${i + 1}/${accounts.length}] Error: ${error.message}`
      );
    }
  }

  console.log('\nRegistration summary');
  console.log(`Registered: ${registered}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${accounts.length}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
