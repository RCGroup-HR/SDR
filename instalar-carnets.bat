@echo off
echo ========================================
echo Instalando Sistema de Carnets
echo ========================================
echo.

REM Buscar mysql en rutas comunes
set MYSQL_PATH=

if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe
) else if exist "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe" (
    set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe
) else if exist "C:\xampp\mysql\bin\mysql.exe" (
    set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe
) else (
    echo ERROR: No se encontro MySQL.
    echo Por favor, ejecuta manualmente desde MySQL Workbench:
    echo - Abre: backend\sql\INSTALAR_SISTEMA_CARNETS.sql
    echo - Ejecuta todo el script
    pause
    exit /b 1
)

echo Ejecutando SQL con: %MYSQL_PATH%
echo.

"%MYSQL_PATH%" -u root -p123 sdr_domino < "backend\sql\INSTALAR_SISTEMA_CARNETS.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo INSTALACION EXITOSA!
    echo ========================================
    echo.
    echo Ahora puedes:
    echo 1. Reiniciar el servidor: npm run dev
    echo 2. Probar los endpoints
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR EN LA INSTALACION
    echo ========================================
    echo.
    echo Opciones:
    echo 1. Verifica que la contraseña de MySQL sea correcta (123)
    echo 2. Ejecuta manualmente desde MySQL Workbench
    echo.
)

pause
