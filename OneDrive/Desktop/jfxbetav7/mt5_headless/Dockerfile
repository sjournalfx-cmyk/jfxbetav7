# Use a slim Debian base image
FROM debian:bookworm-slim

# Set environment variables for non-interactive installs
ENV DEBIAN_FRONTEND=noninteractive
ENV DISPLAY=:99
ENV WINEARCH=win64
ENV WINEPREFIX=/home/mt5user/.wine
ENV WINEDEBUG=fixme,err
ENV WINEDLLOVERRIDES="mscoree,mshtml,winealsa.drv,winepulse.drv,mmdevapi,d3d8,d3d9,d3d11,dxgi=d"
ENV PATH="/usr/bin:/usr/local/bin:/usr/sbin:/sbin:${PATH}"

# Install necessary tools: wine, wine64, xvfb, and basic CA certificates
RUN dpkg --add-architecture i386 && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    wine \
    wine64 \
    wine32 \
    xvfb \
    xauth \
    ca-certificates \
    procps \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Create a dedicated app user
RUN useradd -m -s /bin/bash mt5user
WORKDIR /home/mt5user

# Copy installer and configuration files
COPY --chown=mt5user:mt5user mt5setup.exe /home/mt5user/mt5setup.exe
COPY --chown=mt5user:mt5user terminal.ini /home/mt5user/terminal.ini
COPY --chown=mt5user:mt5user jfx_socket_bridge.mq5 /home/mt5user/jfx_socket_bridge.mq5
COPY --chown=mt5user:mt5user entrypoint.sh /home/mt5user/entrypoint.sh
RUN chmod +x /home/mt5user/entrypoint.sh
# Prepare X11 directory and install MT5
RUN mkdir -p /tmp/.X11-unix && chmod 1777 /tmp/.X11-unix && \
    chown -R mt5user:mt5user /home/mt5user && \
    su mt5user -c "wine wineboot --init && sleep 10 && \
    xvfb-run -a -s '-screen 0 800x600x16' wine /home/mt5user/mt5setup.exe /auto && \
    sleep 120 && \
    echo 'Checking if MT5 installed...' && \
    ls -R /home/mt5user/.wine/drive_c/'Program Files'/'MetaTrader 5'"

# Ensure the config folder and Scripts folder exist, copy files, and compile mq5
RUN su mt5user -c "mkdir -p /home/mt5user/.wine/drive_c/'Program Files'/'MetaTrader 5'/config && \
    mkdir -p /home/mt5user/.wine/drive_c/'Program Files'/'MetaTrader 5'/MQL5/Scripts && \
    cp /home/mt5user/terminal.ini /home/mt5user/.wine/drive_c/'Program Files'/'MetaTrader 5'/config/terminal.ini && \
    cp /home/mt5user/jfx_socket_bridge.mq5 /home/mt5user/.wine/drive_c/'Program Files'/'MetaTrader 5'/MQL5/Scripts/jfx_socket_bridge.mq5 && \
    xvfb-run -a -s '-screen 0 800x600x16' wine /home/mt5user/.wine/drive_c/'Program Files'/'MetaTrader 5'/metaeditor64.exe /compile:/home/mt5user/.wine/drive_c/'Program Files'/'MetaTrader 5'/MQL5/Scripts/jfx_socket_bridge.mq5"

USER mt5user
EXPOSE 8888

# Entrypoint script handles Xvfb and MT5 correctly
ENTRYPOINT ["/home/mt5user/entrypoint.sh"]
