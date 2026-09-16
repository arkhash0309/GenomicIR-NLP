import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  toggle: () => void
  highContrast: boolean
  toggleHighContrast: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggle: () => {},
  highContrast: false,
  toggleHighContrast: () => {},
})

function readStorage(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function writeStorage(key: string, val: string) {
  try { localStorage.setItem(key, val) } catch { /* ignore */ }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = readStorage('genomic-theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  })

  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return readStorage('genomic-hc') === '1'
      || window.matchMedia('(prefers-contrast: more)').matches
  })

  useEffect(() => {
    const html = document.documentElement
    html.classList.remove('dark', 'light')
    html.classList.add(theme)
    writeStorage('genomic-theme', theme)
  }, [theme])

  useEffect(() => {
    const html = document.documentElement
    if (highContrast) {
      html.classList.add('hc')
    } else {
      html.classList.remove('hc')
    }
    writeStorage('genomic-hc', highContrast ? '1' : '0')
  }, [highContrast])

  const toggle = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  const toggleHighContrast = () => setHighContrast(prev => !prev)

  return (
    <ThemeContext.Provider value={{ theme, toggle, highContrast, toggleHighContrast }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
