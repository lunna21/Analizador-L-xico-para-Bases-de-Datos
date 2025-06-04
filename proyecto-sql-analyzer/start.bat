@echo off
setlocal

REM Establecer rutas base con comillas para manejar espacios
set "PROJECT_ROOT=%~dp0"
echo Compilando el analizador SQL...

REM Compilar el lexer
cd "%PROJECT_ROOT%backend\lexer"
mingw32-make clean
mingw32-make
if %ERRORLEVEL% neq 0 (
    echo Error compilando el lexer
    pause
    exit /b %ERRORLEVEL%
)

REM Compilar el backend
cd "%PROJECT_ROOT%backend\api"
mingw32-make clean
mingw32-make
if %ERRORLEVEL% neq 0 (
    echo Error compilando el backend
    pause
    exit /b %ERRORLEVEL%
)

REM Iniciar el servidor API
cd "%PROJECT_ROOT%backend\api-server"
echo Iniciando servidor API...
node api-server.js

pause
endlocal