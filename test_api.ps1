# Simple test script for blocked endpoints

$baseUrl = "http://localhost:3000"

Write-Host "=== BLOCKED ENDPOINTS TEST ===" -ForegroundColor Yellow
Write-Host ""

# Get session
$loginData = @{email="admin@academy.test"; password="password123"} | ConvertTo-Json
$login = Invoke-WebRequest -Uri "$baseUrl/login" -Method POST -ContentType "application/json" -Body $loginData -UseBasicParsing -SessionVariable sess

Write-Host "Testing missing/blocked endpoints:" -ForegroundColor Cyan
Write-Host ""

# Test 1
Write-Host "1. POST /api/support/messages (submit support ticket)" -ForegroundColor Gray
$test1 = Invoke-WebRequest -Uri "$baseUrl/api/support/messages" -Method POST -ContentType "application/json" -Body '{}' -UseBasicParsing -WebSession $sess -ErrorAction SilentlyContinue 2>&1
if ($test1 -like "*404*" -or $test1 -like "*MethodNotAllowed*") { Write-Host "   ✗ BLOCKED" -ForegroundColor Red } else { Write-Host "   ✓ Available" -ForegroundColor Green }

# Test 2
Write-Host "2. GET /api/students/:id (get single student details)" -ForegroundColor Gray
$test2 = Invoke-WebRequest -Uri "$baseUrl/api/students/STU-1001" -UseBasicParsing -WebSession $sess -ErrorAction SilentlyContinue 2>&1
if ($test2 -like "*404*" -or $test2 -like "*MethodNotAllowed*") { Write-Host "   ✗ BLOCKED" -ForegroundColor Red } else { Write-Host "   ✓ Available" -ForegroundColor Green }

# Test 3
Write-Host "3. PATCH /api/students/:id (update student)" -ForegroundColor Gray
$test3 = Invoke-WebRequest -Uri "$baseUrl/api/students/STU-1001" -Method PATCH -ContentType "application/json" -Body '{}' -UseBasicParsing -WebSession $sess -ErrorAction SilentlyContinue 2>&1
if ($test3 -like "*404*" -or $test3 -like "*MethodNotAllowed*") { Write-Host "   ✗ BLOCKED" -ForegroundColor Red } else { Write-Host "   ✓ Available" -ForegroundColor Green }

# Test 4
Write-Host "4. DELETE /api/registrations/:id (reject registration)" -ForegroundColor Gray
$test4 = Invoke-WebRequest -Uri "$baseUrl/api/registrations/REG-2001" -Method DELETE -UseBasicParsing -WebSession $sess -ErrorAction SilentlyContinue 2>&1
if ($test4 -like "*404*" -or $test4 -like "*MethodNotAllowed*") { Write-Host "   ✗ BLOCKED" -ForegroundColor Red } else { Write-Host "   ✓ Available" -ForegroundColor Green }

# Test 5
Write-Host "5. PATCH /api/quizzes/:id (update quiz)" -ForegroundColor Gray
$test5 = Invoke-WebRequest -Uri "$baseUrl/api/quizzes/QUIZ-5001" -Method PATCH -ContentType "application/json" -Body '{}' -UseBasicParsing -WebSession $sess -ErrorAction SilentlyContinue 2>&1
if ($test5 -like "*404*" -or $test5 -like "*MethodNotAllowed*") { Write-Host "   ✗ BLOCKED" -ForegroundColor Red } else { Write-Host "   ✓ Available" -ForegroundColor Green }

# Test 6
Write-Host "6. DELETE /api/quizzes/:id (delete quiz)" -ForegroundColor Gray
$test6 = Invoke-WebRequest -Uri "$baseUrl/api/quizzes/QUIZ-5001" -Method DELETE -UseBasicParsing -WebSession $sess -ErrorAction SilentlyContinue 2>&1
if ($test6 -like "*404*" -or $test6 -like "*MethodNotAllowed*") { Write-Host "   ✗ BLOCKED" -ForegroundColor Red } else { Write-Host "   ✓ Available" -ForegroundColor Green }

# Test 7
Write-Host "7. GET /api/attendance/records (get attendance history)" -ForegroundColor Gray
$test7 = Invoke-WebRequest -Uri "$baseUrl/api/attendance/records" -UseBasicParsing -WebSession $sess -ErrorAction SilentlyContinue 2>&1
if ($test7 -like "*404*" -or $test7 -like "*MethodNotAllowed*") { Write-Host "   ✗ BLOCKED" -ForegroundColor Red } else { Write-Host "   ✓ Available" -ForegroundColor Green }

# Test 8
Write-Host "8. POST /api/parent/messages (parent submit inquiry)" -ForegroundColor Gray
$test8 = Invoke-WebRequest -Uri "$baseUrl/api/parent/messages" -Method POST -ContentType "application/json" -Body '{}' -UseBasicParsing -WebSession $sess -ErrorAction SilentlyContinue 2>&1
if ($test8 -like "*404*" -or $test8 -like "*MethodNotAllowed*") { Write-Host "   ✗ BLOCKED" -ForegroundColor Red } else { Write-Host "   ✓ Available" -ForegroundColor Green }

Write-Host ""
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Yellow
