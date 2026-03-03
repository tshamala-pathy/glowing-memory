@echo off
setlocal

REM Build Sphinx HTML documentation using the project virtual environment.
REM Usage (from project root):
REM   build_docs

cd /d "%~dp0docs"

if not exist "..\venv\Scripts\python.exe" (
    echo.
    echo Could not find virtualenv Python at "..\venv\Scripts\python.exe".
    echo Please activate your virtual environment and run:
    echo   python -m sphinx -b html docs docs\_build\html
    exit /b 1
)

"..\venv\Scripts\python.exe" -m sphinx -b html . _build/html

endlocal

