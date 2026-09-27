import type { Config } from 'tailwindcss'

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas:  token('canvas'),
        surface: { DEFAULT: token('surface'), 2: token('surface-2') },
        line:    { DEFAULT: token('line'), strong: token('line-strong') },
        fg:      token('fg'),
        muted:   token('muted'),
        subtle:  token('subtle'),
        accent:  { DEFAULT: token('accent'), fg: token('accent-fg') },
        warn:    token('warn'),
        danger:  token('danger'),
        success: token('success'),
        entity: {
          paper:    token('entity-paper'),
          gene:     token('entity-gene'),
          disease:  token('entity-disease'),
          chemical: token('entity-chemical'),
        },
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
} satisfies Config
