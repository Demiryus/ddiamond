@echo off
echo D Diamond CRM baslatiliyor...

:: Backend
start "D Diamond Backend" cmd /k "cd /d %~dp0backend && pip install -r requirements.txt -q && uvicorn main:app --port 8765 --reload"

:: Frontend (2 saniye bekle)
timeout /t 2 /nobreak > nul
start "D Diamond Frontend" cmd /k "cd /d %~dp0frontend && npm install --silent && npm run dev"

echo.
echo Backend: http://localhost:8765
echo Frontend: http://localhost:5173
echo.
pause
