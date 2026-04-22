# JournalFX Bridge - Build Script (Fixed for NumPy)
# This script compiles the GUI bridge into a standalone .exe file

import subprocess
import sys
import os

def install_pyinstaller():
    """Install PyInstaller if not present"""
    try:
        import PyInstaller
        print("[OK] PyInstaller is already installed")
    except ImportError:
        print("[*] Installing PyInstaller...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])

def build_executable():
    """Build the executable using PyInstaller"""
    print("\n" + "="*50)
    print("  JournalFX Bridge - Executable Builder")
    print("="*50 + "\n")
    
    install_pyinstaller()
    
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    gui_script = os.path.join(script_dir, "jfx_bridge_gui.py")
    
    if not os.path.exists(gui_script):
        print(f"[ERROR] Could not find {gui_script}")
        return False
    
    print(f"[*] Building from: {gui_script}")
    print("[*] This may take a few minutes...\n")
    
    # PyInstaller command with proper numpy/MetaTrader5 support
    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--noconfirm",
        "--onefile",
        "--windowed",
        "--name", "JournalFX_Bridge",
        "--distpath", os.path.join(script_dir, "dist"),
        "--workpath", os.path.join(script_dir, "build"),
        "--specpath", os.path.join(script_dir, "build"),
        # Hidden imports for NumPy and MetaTrader5
        "--hidden-import", "numpy",
        "--hidden-import", "numpy.core",
        "--hidden-import", "numpy.core.multiarray",
        "--hidden-import", "numpy.core._multiarray_umath",
        "--hidden-import", "numpy._core",
        "--hidden-import", "numpy._core.multiarray",
        "--hidden-import", "numpy._core._multiarray_umath",
        "--hidden-import", "numpy.random",
        "--hidden-import", "numpy.linalg",
        "--hidden-import", "MetaTrader5",
        "--hidden-import", "requests",
        "--hidden-import", "tkinter",
        "--hidden-import", "tkinter.ttk",
        "--hidden-import", "tkinter.scrolledtext",
        "--hidden-import", "tkinter.messagebox",
        # Collect all numpy data
        "--collect-all", "numpy",
        "--collect-all", "MetaTrader5",
        gui_script
    ]
    
    try:
        subprocess.check_call(cmd)
        exe_path = os.path.join(script_dir, "dist", "JournalFX_Bridge.exe")
        
        if os.path.exists(exe_path):
            print("\n" + "="*50)
            print("  BUILD SUCCESSFUL!")
            print("="*50)
            print(f"\n  Your executable is ready at:")
            print(f"  {exe_path}")
            print("\n  You can now distribute this file.")
            print("  No Python installation required!")
            print("="*50 + "\n")
            return True
        else:
            print("[ERROR] Build completed but executable not found")
            return False
            
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Build failed: {e}")
        return False

if __name__ == "__main__":
    build_executable()
    input("\nPress Enter to exit...")
