
const fs = require('node:fs');
const crypto = require('node:crypto');

// Number of users to generate
const TOTAL_USERS = 100;

// Unique identifier for this test run
const runId = crypto.randomBytes(4).toString('hex');

const users = [];

for (let i = 1; i <= TOTAL_USERS; i++) {
  const number = String(i).padStart(3, '0');

  const username = `perf_${runId}_${number}`;

  const user = {
    fullName: `Performance Test User ${number}`,
    username: username,
    email: `${username}@example.com`,
    password: crypto.randomBytes(18).toString('base64url'),
    dateOfBirth: '1998-05-15'
  };

  users.push(user);
}

// Save generated users to JSON file
const fileName = 'test-accounts.json';

if (fs.existsSync(fileName)) {
  console.error(
    'test-accounts.json already exists. Rename it before generating new users.'
  );
  process.exit(1);
}

fs.writeFileSync(
  fileName,
  JSON.stringify(users, null, 2),
  { mode: 0o600 }
);

console.log('Test users generated successfully!');
console.log(`Total users: ${users.length}`);
console.log(`Saved file: ${fileName}`);
