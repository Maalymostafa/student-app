// API Test Script
const http = require('http');

const tests = [
  { method: 'POST', path: '/api/support/messages', name: 'Submit support message' },
  { method: 'GET', path: '/api/students/STU-1001', name: 'Get single student' },
  { method: 'PATCH', path: '/api/students/STU-1001', name: 'Update student' },
  { method: 'DELETE', path: '/api/registrations/REG-2001', name: 'Reject registration' },
  { method: 'PATCH', path: '/api/quizzes/QUIZ-5001', name: 'Update quiz' },
  { method: 'DELETE', path: '/api/quizzes/QUIZ-5001', name: 'Delete quiz' },
  { method: 'GET', path: '/api/attendance/records', name: 'Get attendance history' },
  { method: 'POST', path: '/api/parent/messages', name: 'Parent submit inquiry' }
];

console.log('\n=== BLOCKED ENDPOINTS TEST ===\n');

function testEndpoint(method, path, name) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const status = res.statusCode;
        const blocked = status === 404 || status === 405;
        const symbol = blocked ? '✗' : '✓';
        const color = blocked ? '\x1b[31m' : '\x1b[32m';
        const label = blocked ? 'BLOCKED' : 'Available';
        console.log(`${color}${symbol}\x1b[0m ${method.padEnd(6)} ${path.padEnd(35)} - ${name} [${status}] ${label}`);
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`Error testing ${path}: ${e.message}`);
      resolve();
    });

    req.write(JSON.stringify({}));
    req.end();
  });
}

async function runTests() {
  for (const test of tests) {
    await testEndpoint(test.method, test.path, test.name);
  }
  console.log('\n=== TEST COMPLETE ===\n');
  process.exit(0);
}

runTests();
