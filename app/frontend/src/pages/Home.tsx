import { useEffect, useRef, useState, type RefObject } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useReducedMotion, AnimatePresence } from 'framer-motion'
import { api, type Stats } from '../lib/api'
import { useTheme } from '../contexts/ThemeContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import SplitText from '../components/SplitText'
import TiltCard from '../components/TiltCard'
import Skeleton from '../components/Skeleton'

/* ── Animation variants ─────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
}
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.05 } },
}

/* ── Animated counter ───────────────────────────────────────────── */
function AnimatedCount({ target, inView }: { target: number; inView: boolean }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) return
    const duration = 1800
    const start = performance.now()
    const frame = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setVal(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, [inView, target])
  return <span>{val.toLocaleString()}</span>
}

/* ── DNA helix canvas ───────────────────────────────────────────── */
function DNABackground({ light }: { light: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let frame = 0, animId: number
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const alpha = light ? 0.08 : 0.13
      const d1    = light ? 0.20 : 0.38
      const d2    = light ? 0.20 : 0.38
      const d3    = light ? 0.14 : 0.28

      for (let i = 0; i < canvas.height; i += 5) {
        const t  = (i + frame) / 40
        const t2 = (i + frame) / 55
        const x1 = canvas.width / 2 + Math.sin(t)  * 65
        const x2 = canvas.width / 2 - Math.sin(t)  * 65
        const x3 = canvas.width / 2 + Math.sin(t2 + Math.PI * 0.7) * 90

        ctx.beginPath(); ctx.arc(x1, i, 2.8, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(16,185,129,${d1})`; ctx.fill()
        ctx.beginPath(); ctx.arc(x2, i, 2.8, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(6,182,212,${d2})`; ctx.fill()
        ctx.beginPath(); ctx.arc(x3, i, 1.8, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(168,85,247,${d3})`; ctx.fill()

        if (i % 28 === 0) {
          ctx.strokeStyle = `rgba(6,182,212,${alpha})`
          ctx.lineWidth = 1.2
          ctx.beginPath(); ctx.moveTo(x1, i); ctx.lineTo(x2, i); ctx.stroke()
        }
        if (i % 56 === 0) {
          ctx.strokeStyle = `rgba(168,85,247,${alpha * 0.6})`
          ctx.lineWidth = 0.8
          ctx.beginPath(); ctx.moveTo(x2, i); ctx.lineTo(x3, i); ctx.stroke()
        }
      }
    }
    const animate = () => {
      draw()
      if (!prefersReduced) frame += 0.38
      animId = requestAnimationFrame(animate)
    }
    animate()
    return () => { cancelAnimationFrame(animId); ro.disconnect() }
  }, [light])
  return (
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full"
            aria-hidden="true" role="presentation" />
  )
}

/* ── Cycling headline words ─────────────────────────────────────── */
const CYCLE_WORDS = ['genomics', 'oncology', 'proteomics', 'transcriptomics', 'epigenomics']

function CyclingWord() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % CYCLE_WORDS.length), 2800)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="inline-block relative" style={{ minWidth: '12ch', textAlign: 'left' }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={CYCLE_WORDS[idx]}
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -24, opacity: 0 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block text-gradient"
          style={{ display: 'inline-block' }}
        >
          {CYCLE_WORDS[idx]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

/* ── Floating metric chip ───────────────────────────────────────── */
function MetricChip({ label, value, color, delay }: {
  label: string; value: string; color: string; delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="glass rounded-2xl px-4 py-3 float"
      style={{ animationDelay: `${delay * 0.5}s` }}
      aria-label={`${label}: ${value}`}
    >
      <div className={`text-xs font-mono font-medium ${color} tabular-nums`}>{value}</div>
      <div className="text-[10px] text-white/35 mt-0.5">{label}</div>
    </motion.div>
  )
}

/* ── Feature icons ──────────────────────────────────────────────── */
function BrainIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
    </svg>
  )
}
function SearchIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
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
function ArrowRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  )
}

/* ── Feature config ─────────────────────────────────────────────── */
const features = [
  {
    to: '/ask',
    label: 'Research Assistant',
    headline: 'Ask anything.',
    subline: 'Get grounded answers.',
    color: 'text-genomic-cyan',
    accent: '#06b6d4',
    glowColor: 'rgba(6,182,212,0.18)',
    borderHover: 'group-hover:border-genomic-cyan/35',
    icon: <BrainIcon />,
    iconBg: 'bg-genomic-cyan/10 text-genomic-cyan',
    desc: 'Agentic AI with hybrid retrieval, live knowledge graph construction, and grounded paper citations.',
    perks: ['Agentic multi-step tool use', 'Live knowledge graph', 'Grounded citations'],
    badge: 'AI-Powered',
  },
  {
    to: '/search',
    label: 'Hybrid Search',
    headline: 'Find the right paper.',
    subline: 'Dense + sparse + reranked.',
    color: 'text-genomic-emerald',
    accent: '#10b981',
    glowColor: 'rgba(16,185,129,0.15)',
    borderHover: 'group-hover:border-genomic-emerald/35',
    icon: <SearchIcon />,
    iconBg: 'bg-genomic-emerald/10 text-genomic-emerald',
    desc: 'FAISS vector search + BM25 keyword matching + cross-encoder reranking for precision retrieval.',
    perks: ['Dense + sparse retrieval', 'Cross-encoder reranking', 'Relevance scoring'],
    badge: 'Hybrid IR',
  },
  {
    to: '/explore',
    label: 'Graph Explorer',
    headline: 'See the connections.',
    subline: 'Entity co-occurrence.',
    color: 'text-genomic-violet',
    accent: '#a855f7',
    glowColor: 'rgba(168,85,247,0.15)',
    borderHover: 'group-hover:border-genomic-violet/35',
    icon: <GraphIcon />,
    iconBg: 'bg-genomic-violet/10 text-genomic-violet',
    desc: 'Browse the entity co-occurrence network extracted from 7,000+ paper abstracts via spaCy NER.',
    perks: ['Entity co-occurrence', 'Interactive D3 graph', 'Subgraph exploration'],
    badge: 'Knowledge Graph',
  },
]

const STAT_LABELS = [
  { key: 'paper_count',  label: 'Papers indexed',  suffix: '',  accent: '#06b6d4' },
  { key: 'entity_count', label: 'Entity nodes',    suffix: '+', accent: '#a855f7' },
  { key: 'edge_count',   label: 'Graph edges',     suffix: '+', accent: '#10b981' },
] as const

const techStack = [
  { name: 'LLM Agent', color: 'rgba(6,182,212,0.15)' },
  { name: 'FAISS',      color: 'rgba(16,185,129,0.12)' },
  { name: 'BM25',       color: 'rgba(245,158,11,0.12)' },
  { name: 'D3.js',      color: 'rgba(168,85,247,0.12)' },
  { name: 'FastAPI',    color: 'rgba(6,182,212,0.12)' },
  { name: 'spaCy',      color: 'rgba(16,185,129,0.12)' },
  { name: 'React 18',   color: 'rgba(6,182,212,0.12)' },
  { name: 'PyTorch',    color: 'rgba(244,63,94,0.12)' },
]

/* ── Main component ─────────────────────────────────────────────── */
export default function Home() {
  const heroRef  = useRef<HTMLElement>(null)
  const statsRef = useRef<HTMLElement>(null)
  const [statsInView, setStatsInView] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const reduced = useReducedMotion()
  useDocumentTitle()

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const dnaY        = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const heroScale   = useTransform(scrollYProgress, [0, 0.6], [1, 0.95])

  useEffect(() => {
    api.stats().then(setStats).catch(() => {}).finally(() => setStatsLoading(false))
  }, [])

  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsInView(true) }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div className="relative overflow-x-hidden">

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden"
        aria-labelledby="hero-heading"
      >
        {/* DNA canvas — parallax */}
        <motion.div
          style={reduced ? {} : { y: dnaY }}
          className="absolute inset-[-10%] opacity-45"
        >
          <DNABackground light={isLight} />
        </motion.div>

        {/* Aurora gradients */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-60"
               style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.1) 0%, transparent 65%)' }} />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-50"
               style={{ background: 'radial-gradient(circle at 100% 100%, rgba(16,185,129,0.08) 0%, transparent 60%)' }} />
          <div className="absolute top-1/3 left-0 w-[400px] h-[400px] rounded-full opacity-40"
               style={{ background: 'radial-gradient(circle at 0% 50%, rgba(168,85,247,0.07) 0%, transparent 60%)' }} />
        </div>

        {/* Hero content */}
        <motion.div
          style={reduced ? {} : { opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 text-center max-w-5xl mx-auto"
        >
          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center justify-center mb-10"
          >
            <span className="tag-pill">
              <span className="tag-pill-dot" aria-hidden="true" />
              <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-genomic-cyan">
                NLP × Genomics × Agentic AI
              </span>
            </span>
          </motion.div>

          {/* Main headline */}
          <h1
            id="hero-heading"
            className="font-display text-[clamp(56px,9vw,120px)] leading-[0.95] tracking-[-0.02em] mb-8"
          >
            <SplitText delay={0.1} scrollTriggered={false} className="block mb-2">
              Decode the
            </SplitText>
            <SplitText delay={0.22} scrollTriggered={false} className="block mb-2">
              literature of
            </SplitText>
            <span className="block overflow-hidden">
              <motion.span
                initial={{ y: '110%' }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, delay: 0.52, ease: [0.22, 1, 0.36, 1] }}
                className="block text-gradient"
              >
                life itself.
              </motion.span>
            </span>
          </h1>

          {/* Sub-copy */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.0, delay: 1.0 }}
            className="text-[var(--text-45,rgba(240,244,255,0.45))] text-lg md:text-xl max-w-2xl mx-auto mb-4 leading-relaxed"
            style={{ color: 'rgba(240,244,255,0.48)' }}
          >
            An agentic AI-powered research assistant over
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.0, delay: 1.1 }}
            className="text-[var(--text-60)] text-xl md:text-2xl max-w-2xl mx-auto mb-12 leading-relaxed font-medium"
          >
            7,000+ bioRxiv <span className="text-gradient-static">genomics papers</span>
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="flex gap-4 justify-center flex-wrap"
          >
            <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}>
              <Link
                to="/ask"
                className="inline-flex items-center gap-2.5 px-8 py-4 bg-genomic-cyan text-navy-DEFAULT font-bold rounded-2xl text-[15px]"
                style={{ boxShadow: '0 0 40px rgba(6,182,212,0.35), 0 4px 16px rgba(6,182,212,0.2)' }}
              >
                Ask a question <ArrowRight />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}>
              <Link
                to="/search"
                className="inline-flex items-center gap-2.5 px-8 py-4 glass rounded-2xl hover:border-white/25 transition-colors text-[15px] font-medium"
              >
                Search papers
              </Link>
            </motion.div>
          </motion.div>

          {/* Floating metric chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.8 }}
            className="flex flex-wrap gap-3 justify-center mt-14"
            aria-label="Key metrics"
          >
            <MetricChip label="Papers indexed"  value="7,070+"  color="text-genomic-cyan"   delay={1.8} />
            <MetricChip label="Entity nodes"    value="28k+"    color="text-genomic-violet"  delay={2.0} />
            <MetricChip label="Graph edges"     value="120k+"   color="text-genomic-emerald" delay={2.2} />
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.4, duration: 0.6 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 select-none pointer-events-none"
          aria-hidden="true"
        >
          <span className="text-[9px] font-mono text-white/20 tracking-[0.35em] uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="text-white/20 text-sm"
          >
            ↓
          </motion.div>
        </motion.div>
      </section>

      {/* ── DIVIDER ─────────────────────────────────────────────────── */}
      <div className="section-divider mx-auto max-w-4xl" aria-hidden="true" />

      {/* ── FEATURES ────────────────────────────────────────────────── */}
      <section className="relative py-40 px-6" aria-labelledby="features-heading">
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full opacity-60"
               style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(168,85,247,0.05) 0%, transparent 65%)' }} />
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-24"
          >
            <p className="text-genomic-cyan text-[11px] font-mono tracking-[0.3em] uppercase mb-6 select-none">
              Three lenses
            </p>
            <h2
              id="features-heading"
              className="font-display text-[clamp(36px,5vw,68px)] leading-tight tracking-[-0.02em] mb-4"
            >
              One platform.{' '}
              <span className="text-gradient-static">Three ways to discover.</span>
            </h2>
            <p className="text-[var(--text-40)] text-lg max-w-md mx-auto">
              Explore 7,000+ preprint papers through AI reasoning, hybrid search, and graph analysis
            </p>
          </motion.div>

          {/* Feature cards */}
          <motion.ul
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5 list-none p-0 m-0"
          >
            {features.map((f) => (
              <motion.li key={f.to} variants={fadeUp}>
                <TiltCard className="h-full" intensity={6}>
                  <Link
                    to={f.to}
                    className={`group block glass-card rounded-3xl p-8 h-full ${f.borderHover} transition-all duration-300 relative overflow-hidden`}
                    aria-label={`${f.label}: ${f.desc}`}
                  >
                    {/* Background glow on hover */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
                      style={{ background: `radial-gradient(ellipse at 30% 20%, ${f.glowColor} 0%, transparent 60%)` }}
                      aria-hidden="true"
                    />

                    {/* Badge */}
                    <span className={`relative inline-flex text-[9px] font-mono tracking-[0.25em] uppercase px-2.5 py-1 rounded-full mb-5 ${f.iconBg} opacity-70 group-hover:opacity-100 transition-opacity`}>
                      {f.badge}
                    </span>

                    {/* Icon */}
                    <div className={`relative inline-flex p-3 rounded-2xl mb-5 ${f.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                      {f.icon}
                    </div>

                    {/* Headline */}
                    <h3 className="relative text-[22px] font-bold tracking-tight mb-1 text-[var(--text-100)]">
                      {f.headline}
                    </h3>
                    <p className={`relative text-sm ${f.color} mb-4 opacity-70 group-hover:opacity-100 transition-opacity font-medium`}>
                      {f.subline}
                    </p>

                    {/* Description */}
                    <p className="relative text-[var(--text-45,rgba(240,244,255,0.45))] text-sm leading-relaxed mb-6"
                       style={{ color: 'rgba(240,244,255,0.5)' }}>
                      {f.desc}
                    </p>

                    {/* Perks */}
                    <ul className="relative space-y-2.5 list-none p-0 m-0">
                      {f.perks.map(p => (
                        <li key={p} className="flex items-center gap-2.5 text-xs text-[var(--text-40)]">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${f.iconBg} opacity-80`}>
                            <CheckIcon />
                          </span>
                          {p}
                        </li>
                      ))}
                    </ul>

                    {/* Arrow */}
                    <div className={`relative mt-6 flex items-center gap-1.5 text-xs ${f.color} opacity-0 group-hover:opacity-70 transition-all duration-300 translate-x-0 group-hover:translate-x-1`}>
                      <span className="font-medium">Explore</span>
                      <ArrowRight />
                    </div>
                  </Link>
                </TiltCard>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </section>

      {/* ── DIVIDER ─────────────────────────────────────────────────── */}
      <div className="section-divider mx-auto max-w-4xl" aria-hidden="true" />

      {/* ── RESEARCH ASSISTANT SHOWCASE ─────────────────────────────── */}
      <section className="relative py-40 px-6 overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-60"
               style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 65%)' }} />
          <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-50"
               style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 65%)' }} />
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Text column */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-genomic-cyan text-[11px] font-mono tracking-[0.3em] uppercase mb-6">
              Research Assistant
            </p>
            <h2 className="font-display text-[clamp(32px,4.5vw,58px)] leading-[1.0] tracking-[-0.02em] mb-6">
              Ask anything.
              <br />
              <span className="text-gradient-static">Grounded in science.</span>
            </h2>
            <p className="text-[var(--text-50)] text-lg leading-relaxed mb-10">
              Our AI agent reasons over 7,000+ bioRxiv papers using hybrid retrieval
              and live knowledge graph construction — every answer is grounded and cited.
            </p>

            <motion.ul
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="space-y-4 list-none p-0 m-0 mb-10"
            >
              {[
                'Agentic reasoning with multi-step tool use',
                'Hybrid FAISS + BM25 retrieval pipeline',
                'Live knowledge graph built during response',
                'Citations with paper IDs and abstracts',
              ].map((item) => (
                <motion.li key={item} variants={fadeUp} className="flex items-start gap-3.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-genomic-cyan/12 text-genomic-cyan flex items-center justify-center mt-0.5"
                        style={{ background: 'rgba(6,182,212,0.1)' }}>
                    <CheckIcon />
                  </span>
                  <span className="text-[var(--text-60)] text-[15px] leading-relaxed">{item}</span>
                </motion.li>
              ))}
            </motion.ul>

            <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }} className="inline-block">
              <Link
                to="/ask"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-genomic-cyan text-navy-DEFAULT font-bold rounded-2xl text-[14px]"
                style={{ boxShadow: '0 0 32px rgba(6,182,212,0.28)' }}
              >
                Try Research Assistant <ArrowRight />
              </Link>
            </motion.div>
          </motion.div>

          {/* Visual column — reasoning trace mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.85, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
            aria-hidden="true"
          >
            {/* Terminal header */}
            <div className="glass rounded-3xl overflow-hidden"
                 style={{ boxShadow: '0 0 0 1px rgba(6,182,212,0.12), 0 32px 64px rgba(0,0,0,0.35)' }}>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-genomic-rose/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-genomic-amber/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-genomic-emerald/50" />
                </div>
                <span className="text-[10px] font-mono text-white/30 ml-2">agent.reasoning_trace</span>
              </div>
              <div className="p-5 space-y-2.5 font-mono">
                {[
                  { kind: 'reasoning',   text: 'Analyzing query for relevant genomic entities…',                             color: 'text-white/50',        bg: 'bg-white/[0.03]' },
                  { kind: 'tool_call',   text: 'hybrid_search({ query: "BRCA1 breast cancer", top_k: 20 })',                color: 'text-genomic-cyan',    bg: 'bg-genomic-cyan/[0.06]' },
                  { kind: 'tool_result', text: 'Retrieved 20 papers · top score 0.94 · entities: BRCA1, TP53, PTEN',       color: 'text-genomic-emerald', bg: 'bg-genomic-emerald/[0.06]' },
                  { kind: 'tool_call',   text: 'graph_query({ entity: "BRCA1", depth: 2 })',                                color: 'text-genomic-violet',  bg: 'bg-genomic-violet/[0.06]' },
                  { kind: 'reasoning',   text: 'Synthesising findings from 12 relevant studies across 3 research groups…', color: 'text-white/50',        bg: 'bg-white/[0.03]' },
                ].map((entry, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.14, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className={`rounded-xl px-3.5 py-2.5 text-[11px] ${entry.bg} border border-white/[0.04]`}
                  >
                    <span className="text-white/20 mr-2">{String(i + 1).padStart(2, '0')}</span>
                    <span className={`${entry.color} leading-relaxed`}>{entry.text}</span>
                    {i === 4 && (
                      <span className="inline-block ml-1 w-1.5 h-3 bg-genomic-cyan/70 rounded-sm animate-pulse" />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Floating stats chip */}
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.88 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -bottom-5 -right-3 glass rounded-2xl px-5 py-3 flex items-center gap-3"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)' }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-genomic-emerald animate-pulse" />
              <span className="text-xs font-mono text-[var(--text-55,rgba(240,244,255,0.55))]"
                    style={{ color: 'rgba(240,244,255,0.6)' }}>
                12 papers · 47 entities
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── DIVIDER ─────────────────────────────────────────────────── */}
      <div className="section-divider mx-auto max-w-4xl" aria-hidden="true" />

      {/* ── STATS ───────────────────────────────────────────────────── */}
      <section
        ref={statsRef as RefObject<HTMLElement>}
        className="relative py-40 px-6"
        aria-label="Database statistics"
      >
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-64 opacity-50"
               style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(16,185,129,0.05) 0%, transparent 65%)' }} />
        </div>

        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.75 }}
            className="text-center mb-20"
          >
            <p className="text-[11px] font-mono tracking-[0.3em] uppercase text-[var(--text-30)] mb-5">
              The numbers
            </p>
            <h2 className="font-display text-[clamp(32px,4.5vw,56px)] tracking-[-0.02em]">
              Scale that matters.
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/[0.05] rounded-3xl overflow-hidden"
          >
            {STAT_LABELS.map(({ key, label, suffix, accent }) => (
              <motion.div
                key={key}
                variants={fadeUp}
                className="bg-[var(--bg)] sm:bg-transparent px-10 py-16 text-center relative group"
              >
                {/* Hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                     style={{ background: `radial-gradient(ellipse at 50% 0%, ${accent}18 0%, transparent 65%)` }}
                     aria-hidden="true" />

                {statsLoading ? (
                  <>
                    <div className="flex justify-center mb-3"><Skeleton className="h-14 w-32" /></div>
                    <Skeleton className="h-4 w-24 mx-auto" />
                  </>
                ) : (
                  <>
                    <div
                      className="font-display text-[clamp(52px,6.5vw,88px)] leading-none mb-3 tabular-nums"
                      style={{
                        background: `linear-gradient(135deg, ${accent} 0%, ${accent}aa 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                      aria-label={`${label}: ${(stats?.[key] ?? 0).toLocaleString()}${suffix}`}
                    >
                      <AnimatedCount target={stats?.[key] ?? 0} inView={statsInView} />
                      <span className="text-[0.45em] opacity-50">{suffix}</span>
                    </div>
                    <div className="text-[var(--text-40)] text-sm font-medium tracking-wide" aria-hidden="true">
                      {label}
                    </div>
                    {/* Accent line */}
                    <div className="absolute bottom-0 left-1/4 right-1/4 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                         style={{ background: `linear-gradient(90deg, transparent, ${accent}60, transparent)` }}
                         aria-hidden="true" />
                  </>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── DIVIDER ─────────────────────────────────────────────────── */}
      <div className="section-divider-violet mx-auto max-w-4xl" aria-hidden="true" />

      {/* ── TECH STACK ──────────────────────────────────────────────── */}
      <section className="py-16 px-6" aria-label="Technology stack">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <p className="text-[11px] font-mono tracking-[0.3em] uppercase text-[var(--text-25)] mb-7">
              Powered by
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {techStack.map((tech, i) => (
                <motion.span
                  key={tech.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.08, y: -2 }}
                  transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="px-4 py-1.5 glass rounded-full text-xs font-mono text-[var(--text-45,rgba(240,244,255,0.45))] hover:text-[var(--text-75,rgba(240,244,255,0.75))] transition-colors cursor-default"
                  style={{ color: 'rgba(240,244,255,0.5)' }}
                >
                  {tech.name}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── DIVIDER ─────────────────────────────────────────────────── */}
      <div className="section-divider mx-auto max-w-4xl" aria-hidden="true" />

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="relative py-48 px-6 overflow-hidden" aria-label="Call to action">
        {/* Aurora backdrop */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0"
               style={{ background: 'radial-gradient(ellipse 100% 80% at 50% 50%, rgba(6,182,212,0.06) 0%, transparent 60%)' }} />
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-60"
               style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 65%)' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-3xl mx-auto text-center"
        >
          <p className="text-[11px] font-mono tracking-[0.3em] uppercase text-[var(--text-30)] mb-7">
            Ready to start
          </p>
          <h2 className="font-display text-[clamp(40px,6vw,80px)] leading-[0.95] tracking-[-0.025em] mb-7">
            Decode the genome.{' '}
            <span className="text-gradient">Today.</span>
          </h2>
          <p className="text-[var(--text-40)] text-lg mb-14 max-w-xl mx-auto leading-relaxed">
            Explore 7,000+ genomics preprints with AI-grounded answers,
            hybrid semantic search, and an interactive knowledge graph.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <motion.div whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.96 }}>
              <Link
                to="/ask"
                className="inline-flex items-center gap-2.5 px-10 py-4 bg-genomic-cyan text-navy-DEFAULT font-bold rounded-2xl text-base"
                style={{ boxShadow: '0 0 56px rgba(6,182,212,0.40), 0 4px 20px rgba(6,182,212,0.25)' }}
              >
                Get started <ArrowRight />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.96 }}>
              <Link
                to="/explore"
                className="inline-flex items-center gap-2.5 px-10 py-4 glass rounded-2xl hover:border-genomic-violet/30 transition-colors text-base"
              >
                Explore the graph
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

    </div>
  )
}
