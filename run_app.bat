@echo off
echo ==========================================
echo STARTING AI HEALTH GUARDIAN V3
echo ==========================================

echo [1] Starting FastAPI Backend...
cd backend
start cmd /k "pip install -r requirements.txt && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo [2] Starting React Frontend...
cd ../frontend
start cmd /k "npm run dev"

echo.
echo Both servers are starting in new windows.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000
echo ==========================================
pause
