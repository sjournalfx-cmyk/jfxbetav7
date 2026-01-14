
import React, { useEffect, useRef, memo } from 'react';

interface TradingViewWidgetProps {
  symbol?: string;
  theme?: 'light' | 'dark';
  interval?: string;
  autosize?: boolean;
}

function TradingViewWidget({
  symbol = "IG:NASDAQ",
  theme = "dark",
  interval = "240",
  autosize = true
}: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef(`tv-widget-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const currentContainer = container.current;
    if (!currentContainer) return;

    // Clear previous widget if it exists to allow updates
    currentContainer.innerHTML = '';

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.id = widgetId.current;

    const widgetConfig = {
      "allow_symbol_change": true,
      "calendar": false,
      "details": false,
      "hide_side_toolbar": false,
      "hide_top_toolbar": false,
      "hide_legend": false,
      "hide_volume": true,
      "hotlist": false,
      "interval": interval,
      "locale": "en",
      "save_image": true,
      "enable_publishing": false,
      "style": "1",
      "symbol": symbol,
      "theme": theme,
      "timezone": "Africa/Johannesburg",
      "backgroundColor": theme === 'dark' ? "#09090b" : "#ffffff",
      "gridColor": "rgba(0, 0, 0, 0)",
      "withdateranges": true,
      "show_popup_button": true,
      "popup_height": "650",
      "popup_width": "1000",
      "autosize": autosize
    };

    script.innerHTML = JSON.stringify(widgetConfig);

    const widgetWrapper = document.createElement('div');
    widgetWrapper.className = "tradingview-widget-container__widget";
    widgetWrapper.style.height = "calc(100% - 32px)";
    widgetWrapper.style.width = "100%";

    const copyright = document.createElement('div');
    copyright.className = "tradingview-widget-copyright";
    copyright.innerHTML = `<a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span class="blue-text">Chart by TradingView</span></a>`;

    currentContainer.appendChild(widgetWrapper);
    currentContainer.appendChild(copyright);
    currentContainer.appendChild(script);

    return () => {
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
    };

  }, [symbol, theme, interval, autosize]);

  return (
    <div className="tradingview-widget-container" ref={container} style={{ height: "100%", width: "100%" }} />
  );
}

export default memo(TradingViewWidget);
