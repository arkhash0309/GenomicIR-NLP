import { Link } from 'react-router-dom'

const NAV_SECTIONS = [
  {
    heading: 'Explore',
    links: [
      { to: '/ask',     label: 'Research Assistant' },
      { to: '/search',  label: 'Hybrid Search' },
      { to: '/explore', label: 'Graph Explorer' },
    ],
  },
  {
    heading: 'Technology',
    links: [
      { to: '/ask',     label: 'LLM Tool-Use' },
      { to: '/search',  label: 'FAISS + BM25' },
      { to: '/explore', label: 'D3.js Visualisation' },
    ],
  },
]

function HelixMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <circle cx="11" cy="4"  r="2.5" fill="#06b6d4" />
      <circle cx="11" cy="18" r="2.5" fill="#10b981" />
      <circle cx="5"  cy="9"  r="2"   fill="#06b6d4" opacity="0.6" />
      <circle cx="17" cy="9"  r="2"   fill="#10b981" opacity="0.6" />
      <circle cx="5"  cy="14" r="2"   fill="#a855f7" opacity="0.5" />
      <circle cx="17" cy="14" r="2"   fill="#06b6d4" opacity="0.5" />
      <path d="M11 6.5 L5 9 M11 6.5 L17 9 M5 9 L5 14 M17 9 L17 14 M5 14 L11 16 M17 14 L11 16"
            stroke="rgba(6,182,212,0.3)" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer
      className="border-t mt-auto"
      style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      aria-label="Site footer"
    >
      {/* Gradient divider accent */}
      <div className="h-px w-full"
           style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.25) 30%, rgba(168,85,247,0.20) 70%, transparent 100%)' }}
           aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 mb-4 group"
              aria-label="GenomicIR — go to home page"
            >
              <div className="transition-transform duration-300 group-hover:rotate-12">
                <HelixMark />
              </div>
              <span className="text-base font-semibold tracking-tight text-gradient-static">GenomicIR</span>
            </Link>
            <p className="text-[var(--text-35,rgba(240,244,255,0.35))] text-sm leading-relaxed max-w-xs">
              Agentic AI research assistant for genomics. Explore 7,000+ bioRxiv preprints with
              hybrid retrieval and live knowledge graph construction.
            </p>
            <div className="flex items-center gap-2 mt-5">
              <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-[var(--text-25)] mr-1">Stack</span>
              {['LLM', 'FAISS', 'spaCy', 'FastAPI', 'React'].map(t => (
                <span key={t}
                      className="text-[10px] font-mono glass px-2 py-0.5 rounded-md"
                      style={{ color: 'rgba(240,244,255,0.35)' }}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Nav sections */}
          {NAV_SECTIONS.map(section => (
            <div key={section.heading}>
              <h3 className="text-[10px] font-mono tracking-[0.25em] uppercase text-[var(--text-25)] mb-4">
                {section.heading}
              </h3>
              <nav aria-label={`${section.heading} links`}>
                <ul className="space-y-2.5 list-none p-0 m-0">
                  {section.links.map(l => (
                    <li key={l.label}>
                      <Link
                        to={l.to}
                        className="text-[var(--text-40)] hover:text-[var(--text-70)] text-sm transition-colors"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <p className="text-[var(--text-25)] text-xs font-mono">
            NLP × Genomics × Agentic AI
          </p>
          <p className="text-[var(--text-20)] text-xs">
            7,070 bioRxiv papers · Hybrid retrieval + knowledge graph
          </p>
        </div>
      </div>
    </footer>
  )
}
