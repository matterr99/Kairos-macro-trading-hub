import { useState } from 'react';
import { ResearchArticle, Language } from '../types';
import { RESEARCH_ARTICLES } from '../data/macroData';
import { RESEARCH_ARTICLES_ES, TRANSLATIONS } from '../locales/translations';

interface ResearchViewProps {
  onOpenArticle: (article: ResearchArticle) => void;
  language?: Language;
}

export function ResearchView({ onOpenArticle, language = 'en' }: ResearchViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const t = TRANSLATIONS[language];
  const articles = language === 'es' ? RESEARCH_ARTICLES_ES : RESEARCH_ARTICLES;

  const categories = language === 'es'
    ? ['Todas', 'Macro vs. Técnico', 'Política de Bancos Centrales', 'Riesgo Estructural', 'Dinámica de Rendimiento y Carry', 'Informes de Mercado']
    : ['All', 'Macro vs. Technical', 'Central Bank Policy', 'Structural Risk', 'Yield & Carry Dynamics', 'Market Reports'];

  const filteredArticles = articles.filter((article) => {
    const isAll = selectedCategory === 'All' || selectedCategory === 'Todas';
    const matchesCategory = isAll || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          article.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredArticle = articles.find((a) => a.featured) || articles[0];

  return (
    <div className="w-full flex flex-col selection:bg-cyan-900 selection:text-cyan-100">
      
      {/* HERO / SEARCH CONTROLS (Obsidian Dark #040406) */}
      <section className="w-full py-12 sm:py-16 border-b border-zinc-800/40 bg-[#040406]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <span className="text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider block">
                {t.research.badge}
              </span>
              <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
                {t.research.title}
              </h1>
              <p className="text-sm text-zinc-400 max-w-xl font-sans font-light">
                {t.research.subtitle}
              </p>
            </div>

            {/* Search Input */}
            <div className="w-full md:w-80">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.research.searchPlaceholder}
                  className="w-full bg-[#0c0d11] border border-zinc-800/80 focus:border-cyan-500 text-white text-xs p-3 pl-9 outline-none rounded-lg transition-colors placeholder:text-zinc-600 font-sans"
                />
                <span className="absolute left-3 top-3.5 text-zinc-500 text-xs">🔍</span>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 text-zinc-400 hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 font-mono text-xs no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat || (selectedCategory === 'All' && cat === 'Todas') || (selectedCategory === 'Todas' && cat === 'All')
                    ? 'bg-cyan-500 text-black shadow-md'
                    : 'bg-[#0c0d11] border border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* FEATURED RESEARCH DOSSIER (Dark Grey #121316) */}
      {(!searchQuery || selectedCategory === 'All' || selectedCategory === 'Todas' || selectedCategory === featuredArticle.category) && (
        <section className="w-full py-16 sm:py-20 border-b border-zinc-800/40 bg-[#121316] relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-800/40">
              <div>
                <span className="font-mono text-xs text-cyan-400 font-bold uppercase tracking-wider block mb-1">
                  {t.research.featuredBadge}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                  {t.research.featuredTitle}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 font-sans max-w-md font-light">
                {t.research.featuredSubtitle}
              </p>
            </div>

            {/* Featured Article Card */}
            <div
              onClick={() => onOpenArticle(featuredArticle)}
              className="group bg-[#0c0d11] border border-zinc-800/80 hover:border-cyan-500/50 p-6 sm:p-10 rounded-xl transition-all cursor-pointer relative overflow-hidden shadow-2xl"
            >
              <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="bg-cyan-950/60 text-cyan-300 border border-cyan-700/60 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase">
                    {featuredArticle.category}
                  </span>
                  <span className="text-zinc-500">{featuredArticle.date}</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-400">{featuredArticle.readTime}</span>
                </div>

                <h3 className="text-xl sm:text-3xl font-black text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight leading-snug">
                  {featuredArticle.title}
                </h3>

                <p className="text-zinc-300 font-sans text-sm sm:text-base leading-relaxed font-light">
                  {featuredArticle.summary}
                </p>

                <div className="pt-2 flex items-center gap-2 font-mono text-xs text-cyan-400 font-bold uppercase tracking-wider">
                  <span>{t.research.openComplete}</span>
                  <span className="group-hover:translate-x-2 transition-transform">&rarr;</span>
                </div>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* FULL RESEARCH ARCHIVE LIST (Obsidian Dark #040406) */}
      <section className="w-full py-16 sm:py-20 border-b border-zinc-800/40 bg-[#040406]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-800/40 font-mono">
            <div>
              <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider block mb-1">
                {t.research.archiveBadge}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                {t.research.archiveTitle} ({filteredArticles.length})
              </h2>
            </div>
            <span className="text-zinc-400 text-xs uppercase tracking-wider">
              {t.research.categoryLabel} <span className="text-cyan-400 font-bold">{selectedCategory}</span>
            </span>
          </div>

          <div className="space-y-4">
            {filteredArticles.map((art) => (
              <div
                key={art.id}
                onClick={() => onOpenArticle(art)}
                className="group bg-[#0c0d11] border border-zinc-800/80 hover:border-cyan-500/50 p-6 transition-all rounded-xl cursor-pointer flex flex-col md:flex-row justify-between md:items-center gap-4 shadow-md"
              >
                <div className="space-y-2 max-w-3xl">
                  <div className="flex items-center gap-3 font-mono text-xs text-zinc-500">
                    <span className="text-cyan-400 font-bold uppercase tracking-wider">
                      {art.category}
                    </span>
                    <span>•</span>
                    <span>{art.date}</span>
                    <span>•</span>
                    <span>{art.readTime}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {art.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed line-clamp-2 font-light">
                    {art.summary}
                  </p>
                </div>

                <div className="shrink-0 font-mono text-xs text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-2 group-hover:text-cyan-300 transition-colors">
                  <span>{t.research.readDossier}</span>
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </div>
            ))}

            {filteredArticles.length === 0 && (
              <div className="text-center py-12 bg-[#0c0d11] border border-zinc-800/80 rounded-xl space-y-2 font-mono">
                <p className="text-sm text-zinc-400 uppercase tracking-wider">
                  {t.research.noResults}
                </p>
                <button
                  onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                  className="text-xs text-cyan-400 underline uppercase tracking-widest cursor-pointer"
                >
                  {t.research.clearFilters}
                </button>
              </div>
            )}
          </div>

        </div>
      </section>
    </div>
  );
}
