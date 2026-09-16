import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import Nav from './components/Nav'
import SkipLink from './components/SkipLink'
import { ThemeProvider } from './contexts/ThemeContext'

const Home = lazy(() => import('./pages/Home'))
const Ask = lazy(() => import('./pages/Ask'))
const Search = lazy(() => import('./pages/Search'))
const GraphExplorer = lazy(() => import('./pages/GraphExplorer'))
const PaperDetail = lazy(() => import('./pages/PaperDetail'))

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <SkipLink />
        <Nav />
        <main id="main-content" className="min-h-screen pt-16" tabIndex={-1}>
          <Suspense fallback={
            <div className="flex items-center justify-center h-64 text-genomic-cyan" role="status" aria-live="polite">
              <span className="sr-only">Loading page…</span>
              <span aria-hidden="true">Loading…</span>
            </div>
          }>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/ask" element={<Ask />} />
              <Route path="/search" element={<Search />} />
              <Route path="/explore" element={<GraphExplorer />} />
              <Route path="/paper/:id" element={<PaperDetail />} />
            </Routes>
          </Suspense>
        </main>
      </BrowserRouter>
    </ThemeProvider>
  )
}
