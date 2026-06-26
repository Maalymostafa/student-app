# Test script to identify blocked endpoints

$baseUrl = "http://localhost:3000"
$adminEmail = "admin@academy.test"
$adminPassword = "password123"

Write-Host "=== ACADEMY MANAGEMENT SYSTEM - ENDPOINT TEST ===" -ForegroundColor Yellow
Write-Host ""

# 1. Login and get session
Write-Host "1. Testing Authentication..." -ForegroundColor Cyan
$loginData = @{
    email = $adminEmail
    password = $adminPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginData `
        -UseBasicParsing `
        -SessionVariable session
    
    Write-Host "✓ Login successful" -ForegroundColor Green
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Test missing Support POST endpoint
Write-Host ""
Write-Host "2. Testing Support Message Submission..." -ForegroundColor Cyan
$supportData = @{
    studentName = "Test Student"
    category = "Technical support"
    message = "I have a question"
} | ConvertTo-Json

try {
    $supportResponse = Invoke-WebRequest -Uri "$baseUrl/api/support/messages" `
        -Method POST `
        -ContentType "application/json" `
        -Body $supportData `
        -UseBasicParsing `
        -WebSession $session `
        -ErrorAction SilentlyContinue
    
    Write-Host "✓ POST /api/support/messages exists" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq "MethodNotAllowed" -or $_.Exception.Response.StatusCode -eq "404") {
        Write-Host "✗ POST /api/support/messages - ENDPOINT MISSING" -ForegroundColor Red
    } else {
        Write-Host "? Unexpected error: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

# 3. Test GET single student endpoint
Write-Host ""
Write-Host "3. Testing Get Single Student..." -ForegroundColor Cyan
try {
    $studentResponse = Invoke-WebRequest -Uri "$baseUrl/api/students/STU-1001" `
        -UseBasicParsing `
        -WebSession $session `
        -ErrorAction SilentlyContinue
    
    Write-Host "✓ GET /api/students/:id exists" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq "MethodNotAllowed" -or $_.Exception.Response.StatusCode -eq "404") {
        Write-Host "✗ GET /api/students/:id - ENDPOINT MISSING" -ForegroundColor Red
    } else {
        Write-Host "? Unexpected error: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

# 4. Test PATCH student endpoint
Write-Host ""
Write-Host "4. Testing Update Student..." -ForegroundColor Cyan
$studentUpdateData = @{
    fullName = "Updated Name"
} | ConvertTo-Json

try {
    $updateResponse = Invoke-WebRequest -Uri "$baseUrl/api/students/STU-1001" `
        -Method PATCH `
        -ContentType "application/json" `
        -Body $studentUpdateData `
        -UseBasicParsing `
        -WebSession $session `
        -ErrorAction SilentlyContinue
    
    Write-Host "✓ PATCH /api/students/:id exists" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq "MethodNotAllowed" -or $_.Exception.Response.StatusCode -eq "404") {
        Write-Host "✗ PATCH /api/students/:id - ENDPOINT MISSING" -ForegroundColor Red
    } else {
        Write-Host "? Unexpected error: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

# 5. Test DELETE registration endpoint
Write-Host ""
Write-Host "5. Testing Registration Rejection..." -ForegroundColor Cyan
try {
    $deleteResponse = Invoke-WebRequest -Uri "$baseUrl/api/registrations/REG-2001" `
        -Method DELETE `
        -UseBasicParsing `
        -WebSession $session `
        -ErrorAction SilentlyContinue
    
    Write-Host "✓ DELETE /api/registrations/:id exists" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq "MethodNotAllowed" -or $_.Exception.Response.StatusCode -eq "404") {
        Write-Host "✗ DELETE /api/registrations/:id - ENDPOINT MISSING" -ForegroundColor Red
    } else {
        Write-Host "? Unexpected error: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

# 6. Test PATCH quiz endpoint
Write-Host ""
Write-Host "6. Testing Update Quiz..." -ForegroundColor Cyan
$quizUpdateData = @{
    title = "Updated Quiz"
} | ConvertTo-Json

try {
    $quizResponse = Invoke-WebRequest -Uri "$baseUrl/api/quizzes/QUIZ-5001" `
        -Method PATCH `
        -ContentType "application/json" `
        -Body $quizUpdateData `
        -UseBasicParsing `
        -WebSession $session `
        -ErrorAction SilentlyContinue
    
    Write-Host "✓ PATCH /api/quizzes/:id exists" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq "MethodNotAllowed" -or $_.Exception.Response.StatusCode -eq "404") {
        Write-Host "✗ PATCH /api/quizzes/:id - ENDPOINT MISSING" -ForegroundColor Red
    } else {
        Write-Host "? Unexpected error: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

# 7. Test DELETE quiz endpoint
Write-Host ""
Write-Host "7. Testing Delete Quiz..." -ForegroundColor Cyan
try {
    $deleteQuizResponse = Invoke-WebRequest -Uri "$baseUrl/api/quizzes/QUIZ-5001" `
        -Method DELETE `
        -UseBasicParsing `
        -WebSession $session `
        -ErrorAction SilentlyContinue
    
    Write-Host "✓ DELETE /api/quizzes/:id exists" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq "MethodNotAllowed" -or $_.Exception.Response.StatusCode -eq "404") {
        Write-Host "✗ DELETE /api/quizzes/:id - ENDPOINT MISSING" -ForegroundColor Red
    } else {
        Write-Host "? Unexpected error: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

# 8. Test GET attendance record
Write-Host ""
Write-Host "8. Testing Get Attendance Record..." -ForegroundColor Cyan
try {
    $attendanceResponse = Invoke-WebRequest -Uri "$baseUrl/api/attendance/ATT-0001" `
        -UseBasicParsing `
        -WebSession $session `
        -ErrorAction SilentlyContinue
    
    Write-Host "✓ GET /api/attendance/:id exists" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq "MethodNotAllowed" -or $_.Exception.Response.StatusCode -eq "404") {
        Write-Host "✗ GET /api/attendance/:id - ENDPOINT MISSING" -ForegroundColor Red
    } else {
        Write-Host "? Unexpected error: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

# 9. Test GET attendance list
Write-Host ""
Write-Host "9. Testing Get Attendance Records List..." -ForegroundColor Cyan
try {
    $attendanceListResponse = Invoke-WebRequest -Uri "$baseUrl/api/attendance/records" `
        -UseBasicParsing `
        -WebSession $session -ErrorAction SilentlyContinue
    
    if ($attendanceListResponse) {
        Write-Host "✓ GET /api/attendance/records exists" -ForegroundColor Green
    }
} 
catch {
    if ($_.Exception.Response.StatusCode -eq "MethodNotAllowed" -or $_.Exception.Response.StatusCode -eq "404") {
        Write-Host "✗ GET /api/attendance/records - ENDPOINT MISSING" -ForegroundColor Red
    } else {
        Write-Host "? Unexpected error: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

# 10. Test Parent communication endpoint
Write-Host ""
Write-Host "10. Testing Parent Message Submission..." -ForegroundColor Cyan
$parentMessageData = @{
    message = "Test parent inquiry"
} | ConvertTo-Json

try {
    $parentResponse = Invoke-WebRequest -Uri "$baseUrl/api/parent/messages" `
        -Method POST `
        -ContentType "application/json" `
        -Body $parentMessageData `
        -UseBasicParsing `
        -WebSession $session `
        -ErrorAction SilentlyContinue
    
    Write-Host "✓ POST /api/parent/messages exists" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq "MethodNotAllowed" -or $_.Exception.Response.StatusCode -eq "404") {
        Write-Host "✗ POST /api/parent/messages - ENDPOINT MISSING" -ForegroundColor Red
    } else {
        Write-Host "? Unexpected error: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Yellow
