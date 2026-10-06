interface ChannelsBarProps {
  onChannelClick?: (channel: string) => void;
}

export function ChannelsBar({ onChannelClick }: ChannelsBarProps) {
  const channels = [
    { id: "majors", label: "G10 Currency Majors" },
    { id: "volatility", label: "Relative Pip Volatility" },
    { id: "risk", label: "Macro Event Risk Feeds" },
    { id: "rates", label: "Interest Rate Differentials" },
    { id: "central-banks", label: "Central Bank Dockets" }
  ];

  return (
    <div className="w-full bg-[#040406] border-b border-zinc-900 py-3 sm:py-3.5 overflow-x-auto select-none touch-pan-x">
      <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-3 sm:px-6 lg:px-8 flex flex-nowrap items-center justify-between min-w-max gap-6 sm:gap-12 font-mono text-[11px] sm:text-xs tracking-[0.2em] uppercase text-zinc-500">
        <span className="text-cyan-500 font-bold sticky left-0 bg-[#040406] pr-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-cyan-500"></span>
          // Channels
        </span>
        {channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => onChannelClick && onChannelClick(ch.id)}
            className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer focus:outline-none py-1"
          >
            <span className="w-1.5 h-1.5 shrink-0 bg-zinc-700" />
            <span>{ch.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
