import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Suspense, lazy, useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import Nav from './components/Nav'
import SkipLink from './components/SkipLink'
import Spinner from './components/Spinner'
import BackToTop from './components/BackToTop'
import PageWrapper from './components/PageWrapper'
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import { FontSizeProvider } from './contexts/FontSizeContext'
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut'

const Home          = lazy(() => import('./pages/Home'))
const Ask           = lazy(() => import('./pages/Ask'))
const Search        = lazy(() => import('./pages/Search'))
const GraphExplorer = lazy(() => import('./pages/GraphExplorer'))
const PaperDetail   = lazy(() => import('./pages/PaperDetail'))
const NotFound      = lazy(() => import('./pages/NotFound'))

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/"          element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/ask"       element={<PageWrapper><Ask /></PageWrapper>} />
        <Route path="/search"    element={<PageWrapper><Search /></PageWrapper>} />
        <Route path="/explore"   element={<PageWrapper><GraphExplorer /></PageWrapper>} />
        <Route path="/paper/:id" element={<PageWrapper><PaperDetail /></PageWrapper>} />
        <Route path="*"          element={<PageWrapper><NotFound /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  )
}

function AppShell() {
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const openShortcuts = useCallback(() => setShortcutsOpen(true), [])
  useKeyboardShortcut({ '?': openShortcuts })

  return (
    <>
      <SkipLink />
      <Nav onOpenShortcuts={openShortcuts} />
      <BackToTop />
      <main id="main-content" className="min-h-screen pt-16" tabIndex={-1}>
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center h-64 gap-3" role="status">
            <Spinner size="lg" label="Loading page…" />
          </div>
        }>
          <AnimatedRoutes />
        </Suspense>
      </main>
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <FontSizeProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
        </ToastProvider>
      </FontSizeProvider>
    </ThemeProvider>
  )
}
