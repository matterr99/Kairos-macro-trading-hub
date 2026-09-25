import React from 'react';
import { MacroIndicator } from '../types';

interface CurrencyIndicatorChartProps {
  currency: string;
  indicators: MacroIndicator[];
  totalScore: number;
}

export const CurrencyIndicatorChart: React.FC<CurrencyIndicatorChartProps> = ({
  currency,
  indicators,
  totalScore
}) => {
  return (
    <div className="bg-[#0c0d11] border border-zinc-800/80 rounded-xl p-5 font-mono shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 mb-4 border-b border-zinc-800/60 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 text-sm">📈</span>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            {currency} Fundamental Factor Breakdown
          </h3>
          <span className="text-xs text-zinc-500 uppercase hidden sm:inline">
            // Indicator Contributions
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-400">Net Valuation:</span>
          <span className={`font-bold px-2.5 py-0.5 rounded text-xs ${
            totalScore > 0
              ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40'
              : totalScore < 0
              ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
          }`}>
            {totalScore > 0 ? `+${totalScore}` : totalScore} PTS
          </span>
        </div>
      </div>

      {/* Indicator Bars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
        {indicators.map((ind) => {
          const score = ind.score ?? 0;
          const isPositive = score > 0;
          const isNegative = score < 0;
          const absScore = Math.abs(score);
          const maxScale = 2; // typical range is -2 to +2
          const barWidthPct = Math.min(100, (absScore / maxScale) * 100);

          return (
            <div key={ind.name} className="flex flex-col space-y-1 bg-[#121318] border border-zinc-800/70 p-3 rounded-lg hover:border-zinc-700 transition">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-200 font-bold truncate max-w-[210px]" title={ind.name}>
                  {ind.name}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-zinc-500">wt: {ind.weight}</span>
                  <span className={`font-bold tabular-nums text-xs px-2 py-0.5 rounded ${
                    isPositive
                      ? 'text-cyan-400 bg-cyan-950/50'
                      : isNegative
                      ? 'text-rose-400 bg-rose-950/50'
                      : 'text-zinc-500 bg-zinc-900'
                  }`}>
                    {score > 0 ? `+${score}` : score}
                  </span>
                </div>
              </div>

              {/* Bipolar score bar */}
              <div className="w-full h-2 bg-zinc-950 rounded-full flex overflow-hidden border border-zinc-800 relative">
                {/* Center marker */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-zinc-700 z-10 -ml-px" />
                
                {/* Left side (negative) */}
                <div className="w-1/2 flex justify-end">
                  {isNegative && (
                    <div
                      className="bg-rose-500 h-full rounded-l-full shadow-[0_0_8px_rgba(244,63,94,0.6)] transition-all duration-300"
                      style={{ width: `${barWidthPct}%` }}
                    />
                  )}
                </div>

                {/* Right side (positive) */}
                <div className="w-1/2 flex justify-start">
                  {isPositive && (
                    <div
                      className="bg-cyan-400 h-full rounded-r-full shadow-[0_0_8px_rgba(34,211,238,0.6)] transition-all duration-300"
                      style={{ width: `${barWidthPct}%` }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
