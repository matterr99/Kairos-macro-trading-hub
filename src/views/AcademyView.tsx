import { Language } from '../types';
import { TRANSLATIONS } from '../locales/translations';

interface AcademyViewProps {
  language?: Language;
}

export function AcademyView({ language = 'en' }: AcademyViewProps) {
  const t = TRANSLATIONS[language];

  return (
    <div className="w-full min-h-[70vh] flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 selection:bg-cyan-900 selection:text-cyan-100 bg-[#040406]">
      <div className="max-w-xl w-full text-center space-y-6 p-8 sm:p-12 rounded-2xl bg-[#0c0d11] border border-zinc-800/80 shadow-2xl">
        {/* Status Indicator */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 font-mono text-xs text-cyan-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-bold uppercase tracking-widest text-[11px]">{t.academy.badge}</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight font-mono">
          {t.academy.title}
        </h1>

        {/* Simple Note */}
        <p className="text-sm sm:text-base text-zinc-400 font-sans leading-relaxed font-light">
          {t.academy.description}
        </p>
      </div>
    </div>
  );
}
