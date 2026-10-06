import { NavigationTab, Language } from '../types';
import { TRANSLATIONS } from '../locales/translations';

interface FooterProps {
  onSelectTab: (tab: NavigationTab) => void;
  language?: Language;
}

export function Footer({ onSelectTab, language = 'en' }: FooterProps) {
  const t = TRANSLATIONS[language];

  return (
    <footer className="w-full bg-[#010101] border-t border-zinc-900 py-10 sm:py-16 shrink-0 mt-auto">
      <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-10 sm:mb-12 text-left">
          
          {/* Brand Column */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-500"></span>
              <p className="text-white font-mono text-[11px] font-bold tracking-[0.2em] uppercase">
                Kairos Global Research
              </p>
            </div>
            <p className="text-zinc-500 font-sans text-xs sm:text-sm leading-relaxed max-w-sm">
              {t.footer.brandDesc}
            </p>
          </div>
          
          {/* Navigation Column */}
          <div className="space-y-3 sm:space-y-4">
            <p className="text-zinc-600 font-mono text-[10px] font-bold uppercase tracking-widest">
              {t.footer.navTitle}
            </p>
            <ul className="space-y-2.5 sm:space-y-3 font-mono text-xs tracking-wider uppercase">
              <li>
                <button 
                  onClick={() => { onSelectTab('console'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-zinc-400 hover:text-cyan-400 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-zinc-700">&rarr;</span> {t.nav.console}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { onSelectTab('research'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-zinc-400 hover:text-cyan-400 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-zinc-700">&rarr;</span> {t.nav.research}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { onSelectTab('academy'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-zinc-400 hover:text-cyan-400 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-zinc-700">&rarr;</span> {t.nav.academy}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { onSelectTab('tools'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-zinc-400 hover:text-cyan-400 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-zinc-700">&rarr;</span> {t.nav.tools}
                </button>
              </li>
            </ul>
          </div>

          {/* Telemetry Column */}
          <div className="space-y-3 sm:space-y-4 font-mono text-xs">
            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
              {t.footer.telemetryTitle}
            </p>
            <div className="p-3.5 sm:p-4 bg-[#050608] border border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                <span>PROTOCOL:</span>
                <span className="text-cyan-400 font-bold">{t.footer.protocol}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                <span>FEED STATUS:</span>
                <span className="text-emerald-400 font-bold">{t.footer.dataStatus}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                <span>LATENCY:</span>
                <span className="text-zinc-300">{t.footer.latency}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-6 sm:pt-8 border-t border-zinc-900/80 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] sm:text-[11px] text-zinc-600 uppercase tracking-widest">
          <p>© {new Date().getFullYear()} {t.footer.copyright}</p>
          <div className="flex items-center gap-6">
            <span>SEC-DATA: REAL-TIME</span>
            <span>CLEARANCE: LEVEL-4</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
