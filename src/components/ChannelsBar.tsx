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
    <div className="w-full bg-[#040406] border-b border-zinc-900 py-3.5 sm:py-4 overflow-x-auto select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-nowrap items-center justify-between min-w-max gap-8 sm:gap-12 font-mono text-xs tracking-[0.2em] uppercase text-zinc-500">
        <span className="text-cyan-500 font-bold sticky left-0 bg-[#040406] pr-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-cyan-500 rounded-sm"></span>
          // Channels
        </span>
        {channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => onChannelClick && onChannelClick(ch.id)}
            className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer focus:outline-none"
          >
            <span className="w-1.5 h-1.5 shrink-0 bg-zinc-700 rounded-full" />
            <span>{ch.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
