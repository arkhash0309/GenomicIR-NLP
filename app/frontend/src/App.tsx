import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Suspense, lazy, useState, useCallback, useEffect, useTransition, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import Nav from './components/Nav'
import SkipLink from './components/SkipLink'
import Spinner from './components/Spinner'
import BackToTop from './components/BackToTop'
import Footer from './components/Footer'
import PageWrapper from './components/PageWrapper'
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal'
import TopLoadingBar from './components/TopLoadingBar'
import ErrorBoundary from './components/ErrorBoundary'
import RouteAnnouncer from './components/RouteAnnouncer'
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

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [pathname])
  return null
}

function AnimatedRoutes({ onLoadingChange }: { onLoadingChange: (v: boolean) => void }) {
  const location = useLocation()
  const [isPending, startTransition] = useTransition()

  useEffect(() => { onLoadingChange(isPending) }, [isPending, onLoadingChange])

  const navigate = (fn: () => void) => { startTransition(fn) }

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

function CustomCursor() {
  const dotRef  = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let rx = 0, ry = 0
    const onMove = (e: MouseEvent) => {
      const { clientX: x, clientY: y } = e
      dotRef.current!.style.left  = x + 'px'
      dotRef.current!.style.top   = y + 'px'
      rx += (x - rx) * 0.18
      ry += (y - ry) * 0.18
      ringRef.current!.style.left = rx + 'px'
      ringRef.current!.style.top  = ry + 'px'
    }
    const onEnter = () => document.body.classList.add('cursor-hover')
    const onLeave = () => document.body.classList.remove('cursor-hover')
    document.addEventListener('mousemove', onMove)
    const interactives = () => document.querySelectorAll('a,button,[role=button],[tabindex]')
    let observer: MutationObserver
    const attachHover = () => {
      interactives().forEach(el => {
        el.addEventListener('mouseenter', onEnter)
        el.addEventListener('mouseleave', onLeave)
      })
    }
    attachHover()
    observer = new MutationObserver(attachHover)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      document.removeEventListener('mousemove', onMove)
      observer.disconnect()
    }
  }, [])

  return (
    <>
      <div id="cursor-dot"  ref={dotRef}  aria-hidden="true" />
      <div id="cursor-ring" ref={ringRef} aria-hidden="true" />
    </>
  )
}

function AppShell() {
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [pageLoading, setPageLoading] = useState(false)
  const openShortcuts = useCallback(() => setShortcutsOpen(true), [])
  useKeyboardShortcut({ '?': openShortcuts })

  return (
    <>
      <CustomCursor />
      <SkipLink />
      <TopLoadingBar loading={pageLoading} />
      <Nav onOpenShortcuts={openShortcuts} />
      <BackToTop />
      <ScrollToTop />
      <RouteAnnouncer />
      <main id="main-content" className="min-h-screen pt-16 flex flex-col" tabIndex={-1}>
        <div className="flex-1">
          <ErrorBoundary>
            <Suspense fallback={
              <div className="flex flex-col items-center justify-center h-64 gap-3" role="status"
                   aria-label="Loading page content">
                <Spinner size="lg" label="Loading page…" />
              </div>
            }>
              <AnimatedRoutes onLoadingChange={setPageLoading} />
            </Suspense>
          </ErrorBoundary>
        </div>
        <Footer />
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
