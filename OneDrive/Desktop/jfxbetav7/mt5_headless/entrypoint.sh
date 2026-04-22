#!/bin/bash
set -e
export PATH=/usr/lib/wine:/usr/bin:/usr/local/bin:/usr/sbin:/sbin:$PATH
export DISPLAY=:99

# Start Xvfb as root
/usr/bin/Xvfb :99 -screen 0 800x600x16 &
sleep 3

# Run MT5 as mt5user
su mt5user -c "
export PATH=/usr/lib/wine:/usr/bin:/usr/local/bin:/usr/sbin:/sbin:\$PATH
export DISPLAY=:99
export WINEARCH=win64
export WINEPREFIX=/home/mt5user/.wine
export WINEDEBUG=-all

if [ ! -d "/home/mt5user/.wine/drive_c/Program Files/MetaTrader 5" ]; then
  wine64 /home/mt5user/mt5setup.exe /auto
  sleep 10
fi

exec wine64 "/home/mt5user/.wine/drive_c/Program Files/MetaTrader 5/terminal64.exe" /portable /config:config/terminal.ini
"
