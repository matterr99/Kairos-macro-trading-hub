import { NavigationTab, Language } from '../types';
import { TRANSLATIONS } from '../locales/translations';

interface FooterProps {
  onSelectTab: (tab: NavigationTab) => void;
  language?: Language;
}

export function Footer({ onSelectTab, language = 'en' }: FooterProps) {
  const t = TRANSLATIONS[language];

  return (
    <footer className="w-full bg-[#010101] border-t border-zinc-900 py-12 sm:py-16 shrink-0 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 mb-12 text-left">
          
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-500 rounded-sm"></span>
              <p className="text-white font-mono text-[11px] font-bold tracking-[0.2em] uppercase">
                Kairos Global Research
              </p>
            </div>
            <p className="text-zinc-500 font-sans text-sm leading-relaxed max-w-sm">
              {t.footer.brandDesc}
            </p>
          </div>
          
          {/* Navigation Column */}
          <div className="space-y-4">
            <p className="text-zinc-600 font-mono text-[10px] font-bold uppercase tracking-widest">
              {t.footer.navTitle}
            </p>
            <ul className="space-y-3 font-mono text-xs tracking-wider uppercase">
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
          <div className="space-y-4">
            <p className="text-zinc-600 font-mono text-[10px] font-bold uppercase tracking-widest">
              {t.footer.telemetryTitle}
            </p>
            <div className="font-mono text-[10px] space-y-2.5 tracking-widest uppercase">
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500">{language === 'es' ? 'Protocolo de Interfaz:' : 'Interface Protocol:'}</span> 
                <span className="text-cyan-500">{t.footer.protocol}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500">{language === 'es' ? 'Estado de Datos:' : 'Data Status:'}</span> 
                <span className="text-emerald-500">{t.footer.dataStatus}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500">{language === 'es' ? 'Latencia del Servidor:' : 'Network Latency:'}</span> 
                <span className="text-zinc-400">{t.footer.latency}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-zinc-900 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono text-zinc-600">
          <p>© {new Date().getFullYear()} {t.footer.copyright}</p>
          <div className="flex items-center gap-6">
            <span>{language === 'es' ? 'Soberanía Cuantitativa' : 'Quantitative Sovereignty'}</span>
            <span>•</span>
            <span>{language === 'es' ? 'Modelos de Asimetría Macro' : 'Macro Asymmetry Models'}</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
