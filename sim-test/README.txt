@echo off
echo ============================================
echo  Run Test Order:
echo ============================================
echo.
echo 1. Start backend:
echo    sim-test\start_backend.bat
echo.
echo 2. Wait for backend to be ready (watch console)
echo.
echo 3. Start frontends (optional, for UI):
echo    sim-test\start_frontends.bat
echo.
echo 4. Run API test:
echo    python sim-test\test_client.py
echo.
echo 5. Open client portal in browser:
echo    http://localhost:5173/client/login
echo    (or http://localhost:8000/client/login with Vite proxy)
echo.
echo 6. Test credentials:
echo    Email: acme@test.com
echo    Password: password123
echo ============================================
pause
