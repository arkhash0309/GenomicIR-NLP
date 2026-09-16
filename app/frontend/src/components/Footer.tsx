import { Link } from 'react-router-dom'

const LINKS = [
  { to: '/',        label: 'Home' },
  { to: '/ask',     label: 'Research Assistant' },
  { to: '/search',  label: 'Search' },
  { to: '/explore', label: 'Graph Explorer' },
]

export default function Footer() {
  return (
    <footer
      className="border-t border-white/5 mt-auto py-10 px-6"
      aria-label="Site footer"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-gradient font-semibold text-sm">GenomicIR</span>
          <p className="text-white/30 text-xs mt-1">
            Agentic genomics research over 7,000+ bioRxiv preprints
          </p>
        </div>

        <nav aria-label="Footer navigation">
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 list-none p-0 m-0">
            {LINKS.map(l => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="text-white/40 hover:text-white/70 text-xs transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="text-white/20 text-xs text-center sm:text-right">
          NLP × Genomics × Agentic AI
        </p>
      </div>
    </footer>
  )
}
