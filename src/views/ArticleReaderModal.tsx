import { ResearchArticle, Language } from '../types';

interface ArticleReaderModalProps {
  article: ResearchArticle | null;
  onClose: () => void;
  language?: Language;
}

export function ArticleReaderModal({ article, onClose, language = 'en' }: ArticleReaderModalProps) {
  if (!article) return null;

  const isEs = language === 'es';

  return (
    <div className="fixed inset-0 z-50 bg-[#020203]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#040406] border border-zinc-800 rounded-xl max-w-4xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top bar */}
        <div className="px-6 py-4 border-b border-zinc-800/80 bg-[#07080d] flex items-center justify-between font-mono">
          <div className="flex items-center gap-3">
            <span className="text-cyan-500 font-bold text-[10px] tracking-widest uppercase">
              {isEs ? '// DOSSIER DE INVESTIGACIÓN' : '// RESEARCH DOSSIER'}
            </span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-400 text-[10px] uppercase font-semibold">
              {article.category}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition cursor-pointer text-sm font-mono"
            aria-label="Close article"
          >
            [ ESC / {isEs ? 'CERRAR' : 'CLOSE'} ✕ ]
          </button>
        </div>

        {/* Article scrollable container */}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-8 font-sans">
          
          <header className="space-y-4 border-b border-zinc-900 pb-8">
            <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-500">
              <span className="bg-cyan-950/60 text-cyan-400 px-2 py-0.5 rounded border border-cyan-900/60 font-bold uppercase text-[9px]">
                {isEs ? 'Informe Institucional' : 'Institutional Brief'}
              </span>
              <span>•</span>
              <span>{article.readTime}</span>
              <span>•</span>
              <span>{isEs ? 'ESTADO: INTELIGENCIA ARCHIVADA' : 'STATUS: ARCHIVED INTELLIGENCE'}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight leading-tight">
              {article.title}
            </h1>

            <p className="text-base text-zinc-400 font-light leading-relaxed">
              {article.summary}
            </p>
          </header>

          {/* Body Sections */}
          {article.contentSections ? (
            <div className="space-y-8 text-zinc-300 leading-relaxed text-sm sm:text-base font-light">
              {article.contentSections.map((sec, idx) => (
                <section key={idx} className="space-y-4">
                  <h2 className="text-lg sm:text-xl font-bold font-mono text-white tracking-tight uppercase border-l-2 border-cyan-500 pl-3">
                    {sec.heading}
                  </h2>
                  
                  {sec.subheading && (
                    <h3 className="text-sm font-mono text-cyan-400 font-semibold uppercase">
                      {sec.subheading}
                    </h3>
                  )}

                  {sec.paragraphs.map((p, pIdx) => (
                    <p key={pIdx} className="leading-relaxed text-zinc-300">
                      {p}
                    </p>
                  ))}

                  {sec.callout && (
                    <div className="p-4 bg-cyan-950/20 border-l-2 border-cyan-500 text-zinc-200 font-mono text-xs sm:text-sm my-4">
                      {sec.callout}
                    </div>
                  )}

                  {sec.gridItems && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs pt-3">
                      {sec.gridItems.map((g, gIdx) => (
                        <div key={gIdx} className="bg-[#07080d] border border-zinc-800/80 rounded-lg p-5 space-y-2">
                          <div className="text-cyan-400 font-bold uppercase tracking-wider">
                            // {g.title}
                          </div>
                          <p className="font-sans text-zinc-400 leading-relaxed text-xs">
                            {g.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          ) : (
            <div className="space-y-6 text-zinc-300 font-light text-sm sm:text-base">
              <p>
                {isEs
                  ? 'En este informe de investigación, el equipo de Kairos explora la interacción sistemática entre la reducción de compras de activos por bancos centrales, las dinámicas de diferenciales de swap y la transmisión a los cruces de divisas del G10.'
                  : 'In this research paper, the Kairos desk explores the systematic interaction between central bank asset purchase unwinds, swap spread dynamics, and the transmission into G10 currency crosses.'}
              </p>
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded font-mono text-xs text-zinc-400">
                {isEs
                  ? '// REGISTRO CUANTITATIVO COMPLETO RESTRINGIDO A CLIENTES VERIFICADOS.'
                  : '// FULL QUANTITATIVE LOG RESTRICTED TO VERIFIED CLIENT KEYS.'}
                <br />
                {isEs
                  ? 'Solicita autorización institucional en la pestaña Consola para descargar los parámetros históricos de regresión.'
                  : 'Request institutional API clearance on the Console tab to download raw historical regression parameters and tick data.'}
              </div>
            </div>
          )}

          {/* Footer of modal */}
          <div className="pt-6 border-t border-zinc-900 flex flex-col sm:flex-row justify-between items-center gap-4 font-mono text-xs">
            <span className="text-zinc-600 uppercase text-[10px]">
              // KAIROS GLOBAL RESEARCH ARCHIVES • AUTHENTICATED
            </span>
            <button
              onClick={onClose}
              className="bg-zinc-900 hover:bg-zinc-800 text-cyan-400 border border-zinc-800 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              {isEs ? 'Cerrar Dossier' : 'Close Dossier'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
