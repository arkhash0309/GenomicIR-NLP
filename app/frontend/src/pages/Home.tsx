import { useEffect, useRef, useState, type RefObject } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { api, type Stats } from '../lib/api'
import { useTheme } from '../contexts/ThemeContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import SplitText from '../components/SplitText'
import TiltCard from '../components/TiltCard'
import Skeleton from '../components/Skeleton'

/* ── Animation variants ─────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] } },
}
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.05 } },
}

/* ── Animated counter ───────────────────────────────────────────── */
function AnimatedCount({ target, inView }: { target: number; inView: boolean }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) return
    const duration = 1600
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
      const sa = light ? 0.12 : 0.10
      const d1 = light ? 0.22 : 0.32
      const d2 = light ? 0.22 : 0.32
      ctx.strokeStyle = `rgba(6,182,212,${sa})`
      ctx.lineWidth = 1.5
      for (let i = 0; i < canvas.height; i += 6) {
        const t = (i + frame) / 44
        const x1 = canvas.width / 2 + Math.sin(t) * 70
        const x2 = canvas.width / 2 - Math.sin(t) * 70
        ctx.beginPath(); ctx.arc(x1, i, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(16,185,129,${d1})`; ctx.fill()
        ctx.beginPath(); ctx.arc(x2, i, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(6,182,212,${d2})`; ctx.fill()
        if (i % 32 === 0) {
          ctx.beginPath(); ctx.moveTo(x1, i); ctx.lineTo(x2, i); ctx.stroke()
        }
      }
    }
    const animate = () => { draw(); if (!prefersReduced) frame += 0.45; animId = requestAnimationFrame(animate) }
    animate()
    return () => { cancelAnimationFrame(animId); ro.disconnect() }
  }, [light])
  return (
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full"
            aria-hidden="true" role="presentation" />
  )
}

/* ── Inline SVG icons ───────────────────────────────────────────── */
function BrainIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  )
}

function GraphIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="5" cy="12" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="19" cy="19" r="2"/>
      <path d="M7 12h10M17 6.7l-6 4M17 17.3l-6-4"/>
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
    color: 'text-genomic-cyan',
    glowColor: 'rgba(6,182,212,0.15)',
    borderHover: 'group-hover:border-genomic-cyan/30',
    icon: <BrainIcon />,
    iconBg: 'bg-genomic-cyan/10 text-genomic-cyan',
    desc: 'Agentic Claude with hybrid retrieval, live knowledge graph, and grounded citations.',
    perks: ['Agentic tool use', 'Live knowledge graph', 'Grounded citations'],
  },
  {
    to: '/search',
    label: 'Hybrid Search',
    headline: 'Find the right paper.',
    color: 'text-genomic-emerald',
    glowColor: 'rgba(16,185,129,0.12)',
    borderHover: 'group-hover:border-genomic-emerald/30',
    icon: <SearchIcon />,
    iconBg: 'bg-genomic-emerald/10 text-genomic-emerald',
    desc: 'FAISS vector search + BM25 keyword matching + cross-encoder reranking.',
    perks: ['Dense + sparse retrieval', 'Cross-encoder reranking', 'Relevance scoring'],
  },
  {
    to: '/explore',
    label: 'Graph Explorer',
    headline: 'See the connections.',
    color: 'text-genomic-amber',
    glowColor: 'rgba(245,158,11,0.12)',
    borderHover: 'group-hover:border-genomic-amber/30',
    icon: <GraphIcon />,
    iconBg: 'bg-genomic-amber/10 text-genomic-amber',
    desc: 'Browse the entity co-occurrence network extracted from 7,000+ abstracts.',
    perks: ['Entity co-occurrence', 'Interactive D3 graph', 'Subgraph exploration'],
  },
]

const STAT_LABELS = [
  { key: 'paper_count',  label: 'Papers indexed', suffix: '' },
  { key: 'entity_count', label: 'Entity nodes',   suffix: '+' },
  { key: 'edge_count',   label: 'Graph edges',    suffix: '+' },
] as const

const techStack = ['Claude 3.5', 'FAISS', 'BM25', 'D3.js', 'FastAPI', 'spaCy', 'React 18', 'Framer Motion']

/* ── Main component ─────────────────────────────────────────────── */
export default function Home() {
  const heroRef = useRef<HTMLElement>(null)
  const statsRef = useRef<HTMLElement>(null)
  const [statsInView, setStatsInView] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const reduced = useReducedMotion()
  useDocumentTitle()

  /* Parallax on scroll */
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const dnaY       = useTransform(scrollYProgress, [0, 1], ['0%', '45%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0])
  const heroScale   = useTransform(scrollYProgress, [0, 0.55], [1, 0.96])

  useEffect(() => {
    api.stats().then(setStats).catch(() => {}).finally(() => setStatsLoading(false))
  }, [])

  /* Stats section IntersectionObserver */
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
        {/* DNA canvas — parallax layer */}
        <motion.div
          style={reduced ? {} : { y: dnaY }}
          className="absolute inset-[-10%] opacity-40"
        >
          <DNABackground light={isLight} />
        </motion.div>

        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-genomic-cyan/[0.04] blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-genomic-emerald/[0.04] blur-3xl" />
        </div>

        {/* Hero content */}
        <motion.div
          style={reduced ? {} : { opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 text-center max-w-5xl mx-auto"
        >
          {/* Tag line */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-genomic-cyan text-[11px] font-mono tracking-[0.3em] uppercase mb-8 select-none"
          >
            NLP × Genomics × Agentic AI
          </motion.p>

          {/* Main headline — word-by-word reveal */}
          <h1
            id="hero-heading"
            className="text-[clamp(52px,8.5vw,112px)] font-bold leading-[1.0] tracking-[-0.03em] mb-8"
          >
            <SplitText delay={0.15} scrollTriggered={false} className="block mb-1">Decode the</SplitText>
            <SplitText delay={0.28} scrollTriggered={false} className="block mb-1">literature of</SplitText>
            <span className="block overflow-hidden">
              <motion.span
                initial={{ y: '105%' }}
                animate={{ y: 0 }}
                transition={{ duration: 0.75, delay: 0.56, ease: [0.22, 1, 0.36, 1] }}
                className="block text-gradient"
              >
                life itself
              </motion.span>
            </span>
          </h1>

          {/* Sub-copy */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.9 }}
            className="text-[var(--text-50)] text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            An agentic Claude-powered research assistant over 7,000+ bioRxiv
            genomics papers — hybrid retrieval, live knowledge graphs, grounded answers.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="flex gap-4 justify-center flex-wrap"
          >
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link
                to="/ask"
                className="inline-flex items-center gap-2.5 px-8 py-4 bg-genomic-cyan text-navy-DEFAULT font-semibold rounded-2xl shadow-[0_0_32px_rgba(6,182,212,0.3)] hover:shadow-[0_0_48px_rgba(6,182,212,0.45)] transition-shadow duration-300"
              >
                Ask a question <ArrowRight />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link
                to="/search"
                className="inline-flex items-center gap-2.5 px-8 py-4 glass rounded-2xl hover:border-white/25 transition-colors"
              >
                Search papers
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.6 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 select-none pointer-events-none"
          aria-hidden="true"
        >
          <span className="text-[10px] font-mono text-white/25 tracking-[0.3em] uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="text-white/25 text-sm"
          >
            ↓
          </motion.div>
        </motion.div>
      </section>

      {/* ── SECTION DIVIDER ─────────────────────────────────────────── */}
      <div className="section-divider mx-auto max-w-4xl" aria-hidden="true" />

      {/* ── FEATURES ────────────────────────────────────────────────── */}
      <section className="relative py-36 px-6" aria-labelledby="features-heading">
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-genomic-cyan/[0.03] blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-24"
          >
            <p className="text-genomic-cyan text-[11px] font-mono tracking-[0.25em] uppercase mb-5">
              Three lenses
            </p>
            <h2
              id="features-heading"
              className="text-[clamp(32px,4.5vw,60px)] font-bold tracking-[-0.025em] mb-4 leading-tight"
            >
              One platform.{' '}
              <span className="text-gradient-static">Three ways to discover.</span>
            </h2>
            <p className="text-[var(--text-40)] text-lg max-w-lg mx-auto">
              Explore 7,000+ preprint papers through AI, hybrid search, and graph analysis
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
                <TiltCard className="h-full" intensity={5}>
                  <Link
                    to={f.to}
                    className={`group block glass-card rounded-3xl p-8 h-full ${f.borderHover} transition-all duration-300`}
                    aria-label={`${f.label}: ${f.desc}`}
                  >
                    {/* Icon */}
                    <div className={`inline-flex p-3 rounded-2xl mb-6 ${f.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                      {f.icon}
                    </div>

                    {/* Label */}
                    <p className={`text-[11px] font-mono tracking-[0.2em] uppercase mb-2 ${f.color} opacity-70 group-hover:opacity-100 transition-opacity`}>
                      {f.label}
                    </p>

                    {/* Headline */}
                    <h3 className="text-2xl font-bold tracking-tight mb-3 text-[var(--text-100)]">
                      {f.headline}
                    </h3>

                    {/* Description */}
                    <p className="text-[var(--text-50)] text-sm leading-relaxed mb-6">
                      {f.desc}
                    </p>

                    {/* Perks */}
                    <ul className="space-y-2 list-none p-0 m-0">
                      {f.perks.map(p => (
                        <li key={p} className="flex items-center gap-2 text-xs text-[var(--text-40)]">
                          <span className={`${f.color} opacity-70`}><CheckIcon /></span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </Link>
                </TiltCard>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </section>

      {/* ── SECTION DIVIDER ─────────────────────────────────────────── */}
      <div className="section-divider mx-auto max-w-4xl" aria-hidden="true" />

      {/* ── RESEARCH ASSISTANT SHOWCASE ─────────────────────────────── */}
      <section className="relative py-36 px-6 overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-genomic-cyan/[0.05] blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-genomic-emerald/[0.04] blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text column */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-genomic-cyan text-[11px] font-mono tracking-[0.25em] uppercase mb-5">
              Research Assistant
            </p>
            <h2 className="text-[clamp(30px,4vw,52px)] font-bold tracking-[-0.025em] leading-tight mb-6">
              Ask anything.
              <br />
              <span className="text-gradient-static">Get answers grounded in science.</span>
            </h2>
            <p className="text-[var(--text-50)] text-lg leading-relaxed mb-10">
              Our Claude agent reasons over 7,000+ bioRxiv papers using hybrid retrieval
              and live knowledge graph construction — every answer is grounded and cited.
            </p>

            {/* Feature list */}
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
                <motion.li key={item} variants={fadeUp} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-genomic-cyan/15 text-genomic-cyan flex items-center justify-center mt-0.5">
                    <CheckIcon />
                  </span>
                  <span className="text-[var(--text-60)] text-sm leading-relaxed">{item}</span>
                </motion.li>
              ))}
            </motion.ul>

            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="inline-block">
              <Link
                to="/ask"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-genomic-cyan text-navy-DEFAULT font-semibold rounded-2xl shadow-[0_0_24px_rgba(6,182,212,0.25)] hover:shadow-[0_0_36px_rgba(6,182,212,0.4)] transition-shadow duration-300"
              >
                Try Research Assistant <ArrowRight />
              </Link>
            </motion.div>
          </motion.div>

          {/* Visual column — abstract reasoning trace mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
            aria-hidden="true"
          >
            <div className="glass rounded-3xl p-6 space-y-3">
              {/* Mock trace entries */}
              {[
                { kind: 'reasoning', text: 'Analyzing query for relevant genomic entities…', color: 'text-white/60', bg: 'bg-white/3' },
                { kind: 'tool_call', text: 'hybrid_search({ query: "BRCA1 breast cancer", top_k: 20 })', color: 'text-genomic-cyan', bg: 'bg-genomic-cyan/5' },
                { kind: 'tool_result', text: 'Retrieved 20 papers · top score 0.94 · entities: BRCA1, TP53, PTEN', color: 'text-genomic-emerald', bg: 'bg-genomic-emerald/5' },
                { kind: 'tool_call', text: 'graph_query({ entity: "BRCA1", depth: 2 })', color: 'text-genomic-cyan', bg: 'bg-genomic-cyan/5' },
                { kind: 'reasoning', text: 'Synthesising findings from 12 relevant studies…', color: 'text-white/60', bg: 'bg-white/3' },
              ].map((entry, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className={`rounded-xl px-4 py-3 text-xs font-mono ${entry.bg} border border-white/5`}
                >
                  <span className={`${entry.color} leading-relaxed`}>{entry.text}</span>
                  {i === 4 && (
                    <span className="inline-block ml-1 w-1.5 h-3 bg-genomic-cyan/60 rounded-sm animate-pulse" />
                  )}
                </motion.div>
              ))}
            </div>

            {/* Floating stats pill */}
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1.0, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -bottom-5 -right-4 glass rounded-2xl px-5 py-3 flex items-center gap-3 shadow-xl"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-genomic-emerald animate-pulse" />
              <span className="text-xs font-mono text-[var(--text-60)]">12 papers · 47 entities</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION DIVIDER ─────────────────────────────────────────── */}
      <div className="section-divider mx-auto max-w-4xl" aria-hidden="true" />

      {/* ── STATS ───────────────────────────────────────────────────── */}
      <section
        ref={statsRef as RefObject<HTMLElement>}
        className="relative py-36 px-6"
        aria-label="Database statistics"
      >
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-64 bg-genomic-emerald/[0.03] blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7 }}
            className="text-center mb-20"
          >
            <p className="text-[11px] font-mono tracking-[0.25em] uppercase text-[var(--text-30)] mb-4">
              The numbers
            </p>
            <h2 className="text-[clamp(28px,4vw,48px)] font-bold tracking-[-0.025em]">
              Scale that matters.
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/5 rounded-3xl overflow-hidden"
          >
            {STAT_LABELS.map(({ key, label, suffix }) => (
              <motion.div
                key={key}
                variants={fadeUp}
                className="bg-[var(--bg)] sm:bg-transparent px-10 py-14 text-center"
              >
                {statsLoading ? (
                  <>
                    <div className="flex justify-center mb-3"><Skeleton className="h-14 w-32" /></div>
                    <Skeleton className="h-4 w-24 mx-auto" />
                  </>
                ) : (
                  <>
                    <div
                      className="text-[clamp(48px,6vw,80px)] font-bold tracking-[-0.04em] text-gradient leading-none mb-3"
                      aria-label={`${label}: ${(stats?.[key] ?? 0).toLocaleString()}${suffix}`}
                    >
                      <AnimatedCount target={stats?.[key] ?? 0} inView={statsInView} />
                      <span className="text-[0.5em] opacity-60">{suffix}</span>
                    </div>
                    <div className="text-[var(--text-40)] text-sm font-medium tracking-wide" aria-hidden="true">
                      {label}
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SECTION DIVIDER ─────────────────────────────────────────── */}
      <div className="section-divider mx-auto max-w-4xl" aria-hidden="true" />

      {/* ── TECH STACK ──────────────────────────────────────────────── */}
      <section className="py-16 px-6" aria-label="Technology stack">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="text-[11px] font-mono tracking-[0.25em] uppercase text-[var(--text-25)] mb-6">
              Powered by
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {techStack.map((tech, i) => (
                <motion.span
                  key={tech}
                  initial={{ opacity: 0, scale: 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="px-4 py-1.5 glass rounded-full text-xs font-mono text-[var(--text-40)] hover:text-[var(--text-70)] transition-colors"
                >
                  {tech}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION DIVIDER ─────────────────────────────────────────── */}
      <div className="section-divider mx-auto max-w-4xl" aria-hidden="true" />

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="relative py-40 px-6 overflow-hidden" aria-label="Call to action">
        {/* Glow backdrop */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-genomic-cyan/[0.03] to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full bg-genomic-cyan/[0.05] blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-3xl mx-auto text-center"
        >
          <p className="text-[11px] font-mono tracking-[0.25em] uppercase text-[var(--text-30)] mb-6">
            Ready to start
          </p>
          <h2 className="text-[clamp(36px,5.5vw,72px)] font-bold tracking-[-0.03em] leading-tight mb-6">
            Decode the genome.{' '}
            <span className="text-gradient">Today.</span>
          </h2>
          <p className="text-[var(--text-40)] text-lg mb-12 max-w-xl mx-auto leading-relaxed">
            Explore 7,000+ genomics preprints with AI-grounded answers,
            hybrid semantic search, and an interactive knowledge graph.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
              <Link
                to="/ask"
                className="inline-flex items-center gap-2.5 px-9 py-4 bg-genomic-cyan text-navy-DEFAULT font-bold rounded-2xl shadow-[0_0_48px_rgba(6,182,212,0.35)] hover:shadow-[0_0_64px_rgba(6,182,212,0.5)] transition-shadow duration-300 text-base"
              >
                Get started <ArrowRight />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 px-9 py-4 glass rounded-2xl hover:border-white/25 transition-colors text-base"
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
