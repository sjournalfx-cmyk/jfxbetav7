@echo off
echo ========================================
echo   JournalFX Bridge - Executable Builder
echo ========================================
echo.

REM Check if PyInstaller is installed
pip show pyinstaller >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [*] Installing PyInstaller...
    pip install pyinstaller
)

echo [*] Building JournalFX Bridge executable...
echo.

pyinstaller --noconfirm --onefile --windowed ^
    --name "JournalFX_Bridge" ^
    --icon "NONE" ^
    --hidden-import "tkinter" ^
    --hidden-import "requests" ^
    --hidden-import "MetaTrader5" ^
    --hidden-import "numpy" ^
    --hidden-import "numpy._core" ^
    --hidden-import "numpy._core.multiarray" ^
    --hidden-import "numpy._core._multiarray_umath" ^
    --collect-all "numpy" ^
    --collect-all "MetaTrader5" ^
    jfx_bridge_gui.py

echo.
if exist "dist\JournalFX_Bridge.exe" (
    echo ========================================
    echo   BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo   Your executable is ready at:
    echo   dist\JournalFX_Bridge.exe
    echo.
    echo   You can now distribute this file.
    echo   No Python installation required!
    echo ========================================
) else (
    echo [ERROR] Build failed. Check the output above for errors.
)

pause
