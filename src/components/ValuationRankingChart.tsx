import React from 'react';

interface ValuationRankingChartProps {
  totals: Record<string, number>;
  selectedCurrency?: string;
  onSelectCurrency?: (ccy: string) => void;
}

export const ValuationRankingChart: React.FC<ValuationRankingChartProps> = ({
  totals,
  selectedCurrency,
  onSelectCurrency
}) => {
  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF'];
  const scores = currencies.map(c => totals[c] !== undefined ? totals[c] : 0);

  // Compute scale boundaries
  const maxScore = Math.max(10, Math.max(...scores.map(s => Math.abs(s))) + 2);

  return (
    <div className="bg-[#0c0d11] rounded-xl border border-zinc-800/80 p-5 shadow-xl font-mono">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-3 border-b border-zinc-800/60 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold text-sm">📊</span>
          <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
            Valuation Ranking Matrix
          </h3>
          <span className="text-[11px] text-zinc-500 uppercase hidden sm:inline">
            // G8 Currencies
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.6)]"></span>
            <span className="text-zinc-400">Bullish</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]"></span>
            <span className="text-zinc-400">Bearish</span>
          </div>
        </div>
      </div>

      {/* SVG Interactive Bar Chart */}
      <div className="relative w-full h-48 select-none">
        {/* Background Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
          <div className="border-b border-dashed border-zinc-700 w-full" />
          <div className="border-b border-dashed border-zinc-700 w-full" />
          <div className="border-b border-dashed border-zinc-700 w-full" />
          <div className="border-b border-dashed border-zinc-700 w-full" />
          <div className="border-b border-dashed border-zinc-700 w-full" />
        </div>

        {/* Center Zero Baseline */}
        <div className="absolute left-0 right-0 top-1/2 border-b border-zinc-600/60 pointer-events-none z-10" />

        {/* Bars Container */}
        <div className="absolute inset-0 grid grid-cols-8 gap-2 sm:gap-4 px-2 sm:px-6">
          {currencies.map(curr => {
            const score = totals[curr] || 0;
            const isSelected = selectedCurrency === curr;
            const isPositive = score > 0;
            const isNegative = score < 0;

            // Height in percentage of half chart
            const heightPct = Math.min(92, Math.abs(score) / maxScore * 90);

            const barColor = isPositive
              ? 'bg-cyan-500 hover:bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.35)]'
              : isNegative
              ? 'bg-rose-500 hover:bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.35)]'
              : 'bg-zinc-700 hover:bg-zinc-600';

            return (
              <div
                key={curr}
                onClick={() => onSelectCurrency && onSelectCurrency(curr)}
                className={`relative flex flex-col items-center justify-center h-full group cursor-pointer transition-transform ${
                  isSelected ? 'scale-105' : 'hover:scale-102'
                }`}
              >
                {/* Upper Half (Positive Bars) */}
                <div className="w-full flex-1 flex flex-col justify-end items-center pb-0.5 relative">
                  {isPositive && (
                    <>
                      <span className="text-[10px] font-bold text-cyan-400 mb-1">
                        +{score}
                      </span>
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full max-w-[34px] rounded-t-sm transition-all duration-300 ${barColor} ${
                          isSelected ? 'ring-2 ring-cyan-300' : ''
                        }`}
                      />
                    </>
                  )}
                  {score === 0 && (
                    <span className="text-[10px] font-bold text-zinc-500 mb-1">0</span>
                  )}
                </div>

                {/* Lower Half (Negative Bars) */}
                <div className="w-full flex-1 flex flex-col justify-start items-center pt-0.5 relative">
                  {isNegative && (
                    <>
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full max-w-[34px] rounded-b-sm transition-all duration-300 ${barColor} ${
                          isSelected ? 'ring-2 ring-rose-300' : ''
                        }`}
                      />
                      <span className="text-[10px] font-bold text-rose-400 mt-1">
                        {score}
                      </span>
                    </>
                  )}
                </div>

                {/* Currency Label at bottom */}
                <div className="absolute -bottom-6 flex items-center justify-center">
                  <span
                    className={`text-xs font-bold tracking-wider px-2 py-0.5 rounded transition ${
                      isSelected
                        ? 'bg-cyan-500 text-black shadow-md'
                        : 'text-zinc-400 group-hover:text-white'
                    }`}
                  >
                    {curr}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 pt-3 border-t border-zinc-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-zinc-400 gap-2">
        <span>Click on any currency to filter indicators & view breakdown.</span>
        <span className="text-cyan-400">
          Selected: <strong className="text-white">{selectedCurrency || 'USD'}</strong> ({totals[selectedCurrency || 'USD'] || 0} pts)
        </span>
      </div>
    </div>
  );
};
