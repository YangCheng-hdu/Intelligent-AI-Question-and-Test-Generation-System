Write-Host "Starting exam paper generation system..." -ForegroundColor Green
Write-Host ""

# Check Java installation
try {
    $javaVersion = java -version 2>&1
    Write-Host "Java environment check passed" -ForegroundColor Green
} catch {
    Write-Host "Error: Java not found, please install Java 17 first" -ForegroundColor Red
    Read-Host "Press any key to exit"
    exit 1
}

Write-Host "Environment check passed, starting project..." -ForegroundColor Green
Write-Host ""

# Clean and compile project
Write-Host "Compiling project..." -ForegroundColor Yellow
& .\mvnw.cmd clean compile -q
if ($LASTEXITCODE -ne 0) {
    Write-Host "Compilation failed, please check project configuration" -ForegroundColor Red
    Read-Host "Press any key to exit"
    exit 1
}

Write-Host "Compilation successful, starting application..." -ForegroundColor Green
Write-Host ""
Write-Host "After application starts, you can access:" -ForegroundColor Cyan
Write-Host "- Main page: http://localhost:8080" -ForegroundColor White
Write-Host "- H2 console: http://localhost:8080/h2-console" -ForegroundColor White
Write-Host "- AI test page: http://localhost:8080/ai-test.html" -ForegroundColor White
Write-Host ""

# Start project
& .\mvnw.cmd spring-boot:run

Write-Host ""
Write-Host "Application stopped" -ForegroundColor Yellow
Read-Host "Press any key to exit" 