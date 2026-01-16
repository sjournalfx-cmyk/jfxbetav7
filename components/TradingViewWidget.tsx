import React, { useEffect, useRef, memo, useCallback } from 'react';

interface TradingViewWidgetProps {
  symbol?: string;
  theme?: 'light' | 'dark';
  interval?: string;
  autosize?: boolean;
  /** Unique identifier for this chart instance to maintain stable DOM */
  chartId?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  showToolbar?: boolean;
}

function TradingViewWidget({
  symbol = "IG:NASDAQ",
  theme = "dark",
  interval = "240",
  autosize = true,
  chartId = "default",
  showLegend = true,
  showGrid = true,
  showToolbar = true
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const currentConfigRef = useRef({ symbol: '', interval: '', theme: '', showToolbar: true, showLegend: true, showGrid: true });

  const initializeWidget = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Only re-initialize if relevant props changed
    const needsReinit =
      !isInitializedRef.current ||
      currentConfigRef.current.symbol !== symbol ||
      currentConfigRef.current.interval !== interval ||
      currentConfigRef.current.theme !== theme ||
      currentConfigRef.current.showToolbar !== showToolbar ||
      currentConfigRef.current.showLegend !== showLegend ||
      currentConfigRef.current.showGrid !== showGrid;

    if (!needsReinit) return;

    container.innerHTML = '';

    const widgetId = `tradingview_${chartId.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const widgetDiv = document.createElement('div');
    widgetDiv.id = widgetId;
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";
    container.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.type = "text/javascript";
    script.async = true;
    script.onload = () => {
      if ((window as any).TradingView) {
        new (window as any).TradingView.widget({
          "autosize": autosize,
          "symbol": symbol,
          "interval": interval,
          "timezone": "Africa/Johannesburg",
          "theme": theme,
          "style": "1",
          "locale": "en",
          "toolbar_bg": theme === 'dark' ? "#09090b" : "#f1f3f6",
          "enable_publishing": false,
          "hide_side_toolbar": !showToolbar,
          "hide_volume": true,
          "disabled_features": ["create_volume_indicator_by_default"],
          "allow_symbol_change": true,
          "container_id": widgetId,
          "save_image": true,
          "hide_legend": !showLegend,
          "withdateranges": true,
          "show_popup_button": true,
          "popup_height": "650",
          "popup_width": "1000",
          "studies_overrides": {},
          "overrides": {
            "paneProperties.vertGridProperties.color": showGrid ? (theme === 'dark' ? "rgba(42, 46, 57, 0.6)" : "rgba(240, 243, 250, 0.6)") : "rgba(0,0,0,0)",
            "paneProperties.horzGridProperties.color": showGrid ? (theme === 'dark' ? "rgba(42, 46, 57, 0.6)" : "rgba(240, 243, 250, 0.6)") : "rgba(0,0,0,0)"
          }
        });
      }
    };
    container.appendChild(script);

    currentConfigRef.current = { symbol, interval, theme, showToolbar, showLegend, showGrid };
    isInitializedRef.current = true;
  }, [symbol, interval, theme, autosize, chartId, showToolbar, showLegend, showGrid]);

  useEffect(() => {
    initializeWidget();
  }, [initializeWidget]);

  return (
    <div
      className="tradingview-widget-container"
      ref={containerRef}
      style={{ height: "100%", width: "100%" }}
    />
  );
}

export default memo(TradingViewWidget, (prevProps, nextProps) => {
  return (
    prevProps.symbol === nextProps.symbol &&
    prevProps.interval === nextProps.interval &&
    prevProps.theme === nextProps.theme &&
    prevProps.showToolbar === nextProps.showToolbar &&
    prevProps.showLegend === nextProps.showLegend &&
    prevProps.showGrid === nextProps.showGrid &&
    prevProps.chartId === nextProps.chartId
  );
});