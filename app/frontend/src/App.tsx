import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import Nav from './components/Nav'
import SkipLink from './components/SkipLink'
import Spinner from './components/Spinner'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import { FontSizeProvider } from './contexts/FontSizeContext'

const Home        = lazy(() => import('./pages/Home'))
const Ask         = lazy(() => import('./pages/Ask'))
const Search      = lazy(() => import('./pages/Search'))
const GraphExplorer = lazy(() => import('./pages/GraphExplorer'))
const PaperDetail = lazy(() => import('./pages/PaperDetail'))

export default function App() {
  return (
    <ThemeProvider>
      <FontSizeProvider>
        <ToastProvider>
          <BrowserRouter>
            <SkipLink />
            <Nav />
            <main id="main-content" className="min-h-screen pt-16" tabIndex={-1}>
              <Suspense fallback={
                <div className="flex flex-col items-center justify-center h-64 gap-3" role="status">
                  <Spinner size="lg" label="Loading page…" />
                </div>
              }>
                <Routes>
                  <Route path="/"        element={<Home />} />
                  <Route path="/ask"     element={<Ask />} />
                  <Route path="/search"  element={<Search />} />
                  <Route path="/explore" element={<GraphExplorer />} />
                  <Route path="/paper/:id" element={<PaperDetail />} />
                </Routes>
              </Suspense>
            </main>
          </BrowserRouter>
        </ToastProvider>
      </FontSizeProvider>
    </ThemeProvider>
  )
}
