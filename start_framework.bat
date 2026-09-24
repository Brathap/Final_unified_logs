@echo off
REM ==============================================================================
REM Universal Log Pre-processing Framework (ULPF) - SIH 26156
REM Windows Orchestration Launcher (FastAPI + React Vite + UDP Firehose + Vector)
REM ==============================================================================

echo ======================================================================
echo     STARTING ULPF ENTERPRISE LOG PROCESSING FRAMEWORK (SIH 26156)
echo     Mode: Local Air-Gapped / Privacy-Preserving / OCSF Standard
echo ======================================================================

REM 1. Start FastAPI Backend Server
echo [1/4] Launching FastAPI Backend Server on port 8000...
start "ULPF Backend" cmd /k "python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000"

REM 2. Start React Vite Frontend
echo [2/4] Launching React SOC Dashboard on port 5173...
start "ULPF Frontend" cmd /k "cd frontend && npm run dev"

REM 3. Vector Ingestion Check
where vector >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    if not exist "%TEMP%\vector" mkdir "%TEMP%\vector"
    echo [3/4] Vector.dev detected in PATH. Starting Vector Ingestion Engine on UDP 5140...
    start "ULPF Vector" cmd /k "vector vector\vector.yaml"
) else (
    echo [3/4] Notice: 'vector' binary not in PATH.
    echo       FastAPI's embedded high-speed UDP listener is active and
    echo       executing the identical VRL pipeline (OCSF, PII Redaction, Threat Intel).
)

REM 4. Start Firehose Simulator
echo [4/4] Starting Heterogeneous Log Firehose Simulator (~10 EPS)...
start "ULPF Firehose" cmd /k "python backend\simulate_firehose.py"

echo ======================================================================
echo  ALL SERVICES LAUNCHED IN SEPARATE CONSOLES!
echo  Web SOC Console: http://localhost:5173
echo  FastAPI Backend: http://localhost:8000
echo  UDP Ingestion  : 127.0.0.1:514
echo ======================================================================
pause
