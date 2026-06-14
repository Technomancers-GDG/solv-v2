@echo off
echo Starting admin frontend on port 5173...
echo Starting driver app on port 5174...
echo.
echo Then open http://localhost:5173/client/login
echo.
start "Admin UI" cmd /k "cd /d "%~dp0..\frontend" && npm run dev"
start "Driver App" cmd /k "cd /d "%~dp0..\driver-app-main" && npm run dev"
