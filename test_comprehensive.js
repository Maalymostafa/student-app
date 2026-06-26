// Comprehensive API Test
const http = require('http');

const tests = [
  // Students
  { method: 'GET', path: '/api/students', name: 'List students' },
  { method: 'GET', path: '/api/students/STU-1001', name: 'Get single student' },
  { method: 'POST', path: '/api/students', name: 'Create student' },
  { method: 'PATCH', path: '/api/students/STU-1001', name: 'Update student' },
  { method: 'DELETE', path: '/api/students/STU-1001', name: 'Delete student' },
  
  // Registrations
  { method: 'GET', path: '/api/registrations', name: 'List registrations' },
  { method: 'PATCH', path: '/api/registrations/REG-2001/confirm', name: 'Confirm registration' },
  { method: 'PATCH', path: '/api/registrations/REG-2001/reject', name: 'Reject registration' },
  
  // Quizzes
  { method: 'GET', path: '/api/quizzes', name: 'List quizzes' },
  { method: 'POST', path: '/api/quizzes', name: 'Create quiz' },
  { method: 'GET', path: '/api/quizzes/QUIZ-5001', name: 'Get quiz' },
  { method: 'PATCH', path: '/api/quizzes/QUIZ-5001', name: 'Update quiz' },
  { method: 'DELETE', path: '/api/quizzes/QUIZ-5001', name: 'Delete quiz' },
  
  // Support
  { method: 'GET', path: '/api/support/messages', name: 'List support messages' },
  { method: 'POST', path: '/api/support/messages', name: 'Submit support message' },
  
  // Attendance
  { method: 'GET', path: '/api/attendance', name: 'Get attendance setup' },
  { method: 'GET', path: '/api/attendance/records', name: 'Get attendance records' },
  { method: 'GET', path: '/api/attendance/ATT-0001', name: 'Get single attendance' },
  
  // Parent
  { method: 'GET', path: '/api/parent/overview', name: 'Get parent overview' },
  { method: 'POST', path: '/api/parent/messages', name: 'Submit parent message' },
  { method: 'GET', path: '/api/parent/messages', name: 'Get parent messages' },
  
  // Grading
  { method: 'GET', path: '/api/grading/submissions', name: 'List submissions' },
  { method: 'GET', path: '/api/my-results', name: 'Get my results' },
  
  // Dashboard
  { method: 'GET', path: '/api/dashboard', name: 'Get dashboard' },
];

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║          COMPREHENSIVE API ENDPOINT TEST                          ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

let available = 0;
let blocked = 0;
let error = 0;

function testEndpoint(method, path, name) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const status = res.statusCode;
        const isBlocked = status === 404 || status === 405;
        const isAvailable = (status >= 200 && status < 500) && !isBlocked;
        
        if (isAvailable) {
          console.log(`  ✓ ${method.padEnd(6)} ${path.padEnd(40)} [${status}] ✓`);
          available++;
        } else if (isBlocked) {
          console.log(`  ✗ ${method.padEnd(6)} ${path.padEnd(40)} [${status}] ✗ BLOCKED`);
          blocked++;
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.log(`  ? ${method.padEnd(6)} ${path.padEnd(40)} [ERR] ${e.code}`);
      error++;
      resolve();
    });

    req.on('timeout', () => {
      req.destroy();
      console.log(`  ? ${method.padEnd(6)} ${path.padEnd(40)} [TIMEOUT]`);
      error++;
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
  
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log(`║  Available: ${String(available).padEnd(2)} | Blocked: ${String(blocked).padEnd(2)} | Errors: ${String(error).padEnd(2)} | Total: ${tests.length.toString().padEnd(2)} │`);
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  process.exit(blocked > 0 ? 1 : 0);
}

runTests();
