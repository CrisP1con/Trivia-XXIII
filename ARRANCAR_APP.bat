@echo off
title Servidor Juego Historia - Juan XXIII
echo ==========================================
echo   INSTITUTO JUAN XXIII - JUEGO HISTORIA
echo ==========================================
echo.
echo Revisa que Node.js este instalado...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado. Por favor instala Node.js desde https://nodejs.org/
    pause
    exit
)

echo Iniciando aplicacion en modo produccion...
echo (Este proceso puede tardar unos segundos la primera vez)
echo.
npm run prod
pause
