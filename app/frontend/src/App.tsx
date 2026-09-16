import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import Nav from './components/Nav'

const Home = lazy(() => import('./pages/Home'))
const Ask = lazy(() => import('./pages/Ask'))
const Search = lazy(() => import('./pages/Search'))
const GraphExplorer = lazy(() => import('./pages/GraphExplorer'))
const PaperDetail = lazy(() => import('./pages/PaperDetail'))

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <main className="min-h-screen pt-16">
        <Suspense fallback={<div className="flex items-center justify-center h-64 text-genomic-cyan">Loading…</div>}>
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
  )
}
