import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0a0f1e', 900: '#060b14', 800: '#0d1426' },
        genomic: { cyan: '#06b6d4', emerald: '#10b981', rose: '#f43f5e', amber: '#f59e0b' }
      },
      fontFamily: { mono: ['JetBrains Mono', 'monospace'] }
    }
  }
} satisfies Config
