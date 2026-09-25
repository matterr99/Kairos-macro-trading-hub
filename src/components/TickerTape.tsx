import { useEffect, useRef } from 'react';
import { Language } from '../types';

interface TickerTapeProps {
  language?: Language;
}

export function TickerTape({ language = 'en' }: TickerTapeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous children before mounting to prevent duplicates
    containerRef.current.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    containerRef.current.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: "FOREXCOM:EURUSD", title: "EUR/USD" },
        { proName: "FOREXCOM:GBPUSD", title: "GBP/USD" },
        { proName: "FOREXCOM:USDJPY", title: "USD/JPY" },
        { proName: "FOREXCOM:AUDUSD", title: "AUD/USD" },
        { proName: "FOREXCOM:USDCAD", title: "USD/CAD" },
        { proName: "FOREXCOM:USDCHF", title: "USD/CHF" },
        { proName: "FOREXCOM:NZDUSD", title: "NZD/USD" },
        { proName: "FOREXCOM:EURGBP", title: "EUR/GBP" },
        { proName: "FOREXCOM:GBPJPY", title: "GBP/JPY" },
        { proName: "CAPITALCOM:DXY", title: language === 'es' ? "DXY (Índice Dólar)" : "DXY (Dollar Index)" },
        { proName: "TVC:US10Y", title: language === 'es' ? "Bono US 10A" : "US 10Y Yield" },
        { proName: "OANDA:XAUUSD", title: language === 'es' ? "Oro (XAU/USD)" : "Gold (XAU/USD)" },
        { proName: "TVC:USOIL", title: language === 'es' ? "Petróleo (WTI)" : "Crude Oil (WTI)" },
        { proName: "FOREXCOM:SPX500", title: "S&P 500" },
        { proName: "TVC:VIX", title: language === 'es' ? "VIX (Volatilidad)" : "VIX Volatility" },
        { proName: "BITSTAMP:BTCUSD", title: "Bitcoin" }
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: "adaptive",
      colorTheme: "dark",
      locale: language === 'es' ? 'es' : 'en'
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [language]);

  return (
    <div className="w-full bg-[#040406] border-b border-zinc-800/40 overflow-hidden h-[46px] flex items-center shrink-0 select-none">
      <div className="tradingview-widget-container w-full" ref={containerRef} />
    </div>
  );
}
