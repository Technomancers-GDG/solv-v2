@echo off
echo Starting Logisight backend...
echo.
echo Demo mode: ON (simulation starts automatically)
echo.
cd /d "%~dp0.."
python -m uvicorn main:app --reload --port 8000
pause
