import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type FontSize = 'normal' | 'large' | 'xlarge'

interface FontSizeContextValue {
  fontSize: FontSize
  setFontSize: (s: FontSize) => void
}

const FontSizeContext = createContext<FontSizeContextValue>({
  fontSize: 'normal',
  setFontSize: () => {},
})

const SIZE_CLASS: Record<FontSize, string> = {
  normal: '',
  large:  'text-lg-base',
  xlarge: 'text-xl-base',
}

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    try {
      const s = localStorage.getItem('genomic-font-size')
      if (s === 'normal' || s === 'large' || s === 'xlarge') return s
    } catch { /* ignore */ }
    return 'normal'
  })

  useEffect(() => {
    const html = document.documentElement
    html.classList.remove('text-lg-base', 'text-xl-base')
    if (SIZE_CLASS[fontSize]) html.classList.add(SIZE_CLASS[fontSize])
    try { localStorage.setItem('genomic-font-size', fontSize) } catch { /* ignore */ }
  }, [fontSize])

  const setFontSize = (s: FontSize) => setFontSizeState(s)

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontSizeContext.Provider>
  )
}

export function useFontSize() {
  return useContext(FontSizeContext)
}
