import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api, type Stats } from '../lib/api'
import { useTheme } from '../contexts/ThemeContext'
import Skeleton from '../components/Skeleton'

function AnimatedCount({ target }: { target: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const step = target / 60
    let cur = 0
    const id = setInterval(() => {
      cur = Math.min(cur + step, target)
      setVal(Math.floor(cur))
      if (cur >= target) clearInterval(id)
    }, 16)
    return () => clearInterval(id)
  }, [target])
  return <span>{val.toLocaleString()}</span>
}

function DNABackground({ light }: { light: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let frame = 0
    let animFrameId: number
    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const strokeAlpha = light ? 0.18 : 0.15
      const dot1Alpha  = light ? 0.30 : 0.40
      const dot2Alpha  = light ? 0.30 : 0.40
      ctx.strokeStyle = `rgba(6,182,212,${strokeAlpha})`
      ctx.lineWidth = 1.5
      for (let i = 0; i < canvas.height; i += 6) {
        const t = (i + frame) / 40
        const x1 = canvas.width / 2 + Math.sin(t) * 60
        const x2 = canvas.width / 2 - Math.sin(t) * 60
        ctx.beginPath()
        ctx.arc(x1, i, 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(16,185,129,${dot1Alpha})`
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x2, i, 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(6,182,212,${dot2Alpha})`
        ctx.fill()
        if (i % 30 === 0) {
          ctx.beginPath()
          ctx.moveTo(x1, i)
          ctx.lineTo(x2, i)
          ctx.stroke()
        }
      }
      frame += 0.5
      animFrameId = requestAnimationFrame(animate)
    }
    animate()
    return () => { cancelAnimationFrame(animFrameId); ro.disconnect() }
  }, [light])
  return (
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-30"
            aria-hidden="true" role="presentation" />
  )
}

function BrainIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/>
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/>
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.3-4.3"/>
    </svg>
  )
}

function GraphIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="5" cy="12" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="19" cy="19" r="2"/>
      <path d="M7 12h10M17 6.7l-6 4M17 17.3l-6-4"/>
    </svg>
  )
}

const features = [
  {
    to: '/ask', title: 'Research Assistant', color: 'text-genomic-cyan', border: 'hover:border-genomic-cyan/40',
    icon: <BrainIcon />, iconColor: 'text-genomic-cyan',
    desc: 'Agentic Claude with live knowledge graph and grounded citations',
  },
  {
    to: '/search', title: 'Hybrid Search', color: 'text-genomic-emerald', border: 'hover:border-genomic-emerald/40',
    icon: <SearchIcon />, iconColor: 'text-genomic-emerald',
    desc: 'FAISS + BM25 + cross-encoder reranking over 7,070 abstracts',
  },
  {
    to: '/explore', title: 'Graph Explorer', color: 'text-genomic-amber', border: 'hover:border-genomic-amber/40',
    icon: <GraphIcon />, iconColor: 'text-genomic-amber',
    desc: 'Browse entity co-occurrence network interactively',
  },
]

const STAT_LABELS = [
  { key: 'paper_count',  label: 'Papers indexed' },
  { key: 'entity_count', label: 'Entity nodes' },
  { key: 'edge_count',   label: 'Graph edges' },
] as const

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const { theme } = useTheme()
  const isLight = theme === 'light'

  useEffect(() => {
    api.stats().then(setStats).catch(() => {}).finally(() => setStatsLoading(false))
  }, [])

  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6"
               aria-labelledby="hero-heading">
        <DNABackground light={isLight} />
        <div className="relative z-10 text-center max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="text-genomic-cyan text-sm font-mono tracking-widest uppercase mb-4"
          >
            NLP × Genomics × Agentic AI
          </motion.p>
          <motion.h1
            id="hero-heading"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-bold leading-tight mb-6"
          >
            Decode the literature of{' '}
            <span className="text-gradient">life itself</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/60 text-lg mb-10"
          >
            An agentic Claude-powered research assistant over 7,000+ bioRxiv genomics papers —
            hybrid retrieval, live knowledge graphs, grounded answers.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex gap-4 justify-center flex-wrap"
          >
            <Link to="/ask"
              className="px-7 py-3.5 bg-genomic-cyan text-navy-DEFAULT font-semibold rounded-xl hover:bg-genomic-cyan/90 transition-colors">
              Ask a question →
            </Link>
            <Link to="/search"
              className="px-7 py-3.5 glass rounded-xl hover:border-white/30 transition-colors">
              Search papers
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6" aria-label="Database statistics">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {STAT_LABELS.map(({ key, label }) => (
            <div key={key} className="glass rounded-2xl p-8 text-center">
              {statsLoading ? (
                <>
                  <div className="flex justify-center mb-2">
                    <Skeleton className="h-10 w-28" />
                  </div>
                  <Skeleton className="h-4 w-20 mx-auto" />
                </>
              ) : (
                <>
                  <div className="text-4xl font-bold text-gradient mb-2"
                       aria-label={`${label}: ${(stats?.[key] ?? 0).toLocaleString()}`}>
                    <AnimatedCount target={stats?.[key] ?? 0} />
                  </div>
                  <div className="text-white/50 text-sm" aria-hidden="true">{label}</div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 border-t border-white/5" aria-labelledby="features-heading">
        <div className="max-w-4xl mx-auto">
          <h2 id="features-heading" className="text-2xl font-semibold text-center mb-2">
            Three lenses on the genome
          </h2>
          <p className="text-white/40 text-sm text-center mb-10">
            Explore 7,000+ preprint papers through AI, hybrid search, and graph analysis
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-6 list-none p-0 m-0">
            {features.map((c, i) => (
              <motion.li
                key={c.to}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
              >
                <Link
                  to={c.to}
                  className={`block glass rounded-2xl p-6 transition-all duration-200 group h-full ${c.border}`}
                  aria-label={`${c.title}: ${c.desc}`}
                >
                  <div className={`mb-4 ${c.iconColor} opacity-80 group-hover:opacity-100 transition-opacity`}>
                    {c.icon}
                  </div>
                  <h3 className={`font-semibold mb-2 ${c.color}`}>{c.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{c.desc}</p>
                </Link>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
