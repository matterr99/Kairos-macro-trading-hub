import { useEffect, useRef } from 'react';
import { Language, Theme } from '../types';

interface TickerTapeProps {
  language?: Language;
  theme?: Theme;
}

export function TickerTape({ language = 'en', theme = 'dark' }: TickerTapeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous children before mounting to prevent duplicates
    containerRef.current.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.width = '100%';
    widgetDiv.style.height = '46px';
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
      displayMode: "regular",
      colorTheme: theme === 'light' ? 'light' : 'dark',
      locale: language === 'es' ? 'es' : 'en'
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [language, theme]);

  return (
    <div className={`w-full ${theme === 'light' ? 'bg-[#f8fafc] border-b border-slate-200' : 'bg-[#040406] border-b border-zinc-800/40'} h-[46px] flex items-center shrink-0 select-none overflow-hidden relative z-10`}>
      <div 
        className="tradingview-widget-container w-full h-[46px]" 
        ref={containerRef} 
      />
    </div>
  );
}
