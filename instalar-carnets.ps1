# Script PowerShell para instalar el sistema de carnets
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Instalando Sistema de Carnets" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$sqlFile = "backend\sql\INSTALAR_SISTEMA_CARNETS.sql"

if (-not (Test-Path $sqlFile)) {
    Write-Host "ERROR: No se encontró el archivo SQL" -ForegroundColor Red
    Write-Host "Ruta esperada: $sqlFile" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "Ejecutando script SQL..." -ForegroundColor Yellow
Write-Host ""

# Buscar MySQL en ubicaciones comunes
$mysqlPaths = @(
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe",
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe"
)

$mysqlPath = $null
foreach ($path in $mysqlPaths) {
    if (Test-Path $path) {
        $mysqlPath = $path
        break
    }
}

if ($null -eq $mysqlPath) {
    Write-Host "ERROR: No se encontró MySQL" -ForegroundColor Red
    Write-Host ""
    Write-Host "Opciones:" -ForegroundColor Yellow
    Write-Host "1. Ejecuta desde MySQL Workbench:" -ForegroundColor White
    Write-Host "   - Abre: backend\sql\INSTALAR_SISTEMA_CARNETS.sql" -ForegroundColor Gray
    Write-Host "   - Ejecuta todo el script" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. O ejecuta manualmente:" -ForegroundColor White
    Write-Host "   mysql -u root -p123 sdr_domino < backend\sql\INSTALAR_SISTEMA_CARNETS.sql" -ForegroundColor Gray
    pause
    exit 1
}

Write-Host "MySQL encontrado: $mysqlPath" -ForegroundColor Green
Write-Host ""

try {
    # Ejecutar SQL
    $content = Get-Content $sqlFile -Raw
    $content | & $mysqlPath -u root -p123 sdr_domino 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "   INSTALACION EXITOSA!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Ahora puedes:" -ForegroundColor Yellow
        Write-Host "1. Acceder a: http://localhost:5174" -ForegroundColor White
        Write-Host "2. Ir a: Mantenimientos > Gestión de Carnets" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "   ERROR EN LA INSTALACION" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "Verifica:" -ForegroundColor Yellow
        Write-Host "- Usuario: root" -ForegroundColor White
        Write-Host "- Contraseña: 123" -ForegroundColor White
        Write-Host "- Base de datos: sdr_domino" -ForegroundColor White
    }
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}

Write-Host ""
pause
