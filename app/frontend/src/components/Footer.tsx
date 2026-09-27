import { Link } from 'react-router-dom'

const REPO_URL = 'https://github.com/arkhash0309/GenomicIR-NLP'

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-line" aria-label="Site footer">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          GenomicIR — agentic retrieval over bioRxiv genomics preprints.{' '}
          <span className="whitespace-nowrap">MIT licensed.</span>
        </p>
        <nav aria-label="Footer">
          <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0">
            <li><Link to="/ask" className="hover:text-fg">Ask</Link></li>
            <li><Link to="/search" className="hover:text-fg">Search</Link></li>
            <li><Link to="/explore" className="hover:text-fg">Graph</Link></li>
            <li><a href={REPO_URL} target="_blank" rel="noreferrer" className="hover:text-fg">Source</a></li>
          </ul>
        </nav>
      </div>
    </footer>
  )
}
