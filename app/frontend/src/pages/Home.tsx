// src/pages/Home.tsx
import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api, type Stats } from '../lib/api'

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

function DNABackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let frame = 0
    let animFrameId: number
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = 'rgba(6,182,212,0.15)'
      ctx.lineWidth = 1.5
      for (let i = 0; i < canvas.height; i += 6) {
        const t = (i + frame) / 40
        const x1 = canvas.width / 2 + Math.sin(t) * 60
        const x2 = canvas.width / 2 - Math.sin(t) * 60
        ctx.beginPath()
        ctx.arc(x1, i, 2, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(16,185,129,0.4)'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x2, i, 2, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(6,182,212,0.4)'
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
    return () => cancelAnimationFrame(animFrameId)
  }, [])
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-30" />
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null)
  useEffect(() => {
    api.stats().then(setStats).catch(() => {})
  }, [])

  return (
    <div className="relative overflow-hidden">
      <section className="relative min-h-[90vh] flex items-center justify-center px-6">
        <DNABackground />
        <div className="relative z-10 text-center max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-genomic-cyan text-sm font-mono tracking-widest uppercase mb-4"
          >
            NLP × Genomics × Agentic AI
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-bold leading-tight mb-6"
          >
            Decode the literature of <span className="text-gradient">life itself</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/60 text-lg mb-10"
          >
            An agentic Claude-powered research assistant over 7,000+ bioRxiv genomics papers — hybrid retrieval, live knowledge graphs, grounded answers.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex gap-4 justify-center"
          >
            <Link
              to="/ask"
              className="px-7 py-3.5 bg-genomic-cyan text-navy-DEFAULT font-semibold rounded-xl hover:bg-genomic-cyan/90 transition-colors"
            >
              Ask a question →
            </Link>
            <Link
              to="/search"
              className="px-7 py-3.5 glass rounded-xl hover:border-white/30 transition-colors"
            >
              Search papers
            </Link>
          </motion.div>
        </div>
      </section>

      {stats && (
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6">
            {[
              { label: 'Papers indexed', value: stats.paper_count },
              { label: 'Entity nodes', value: stats.entity_count },
              { label: 'Graph edges', value: stats.edge_count },
            ].map(s => (
              <div key={s.label} className="glass rounded-2xl p-8 text-center">
                <div className="text-4xl font-bold text-gradient mb-2">
                  <AnimatedCount target={s.value} />
                </div>
                <div className="text-white/50 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-10">Three lenses on the genome</h2>
          <div className="grid grid-cols-3 gap-6">
            {[
              { to: '/ask', title: 'Research Assistant', desc: 'Agentic Claude with live knowledge graph and grounded citations', color: 'text-genomic-cyan' },
              { to: '/search', title: 'Hybrid Search', desc: 'FAISS + BM25 + cross-encoder reranking over 7,070 abstracts', color: 'text-genomic-emerald' },
              { to: '/explore', title: 'Graph Explorer', desc: 'Browse entity co-occurrence network interactively', color: 'text-genomic-amber' },
            ].map(c => (
              <Link
                key={c.to}
                to={c.to}
                className="glass rounded-2xl p-6 hover:border-white/30 transition-colors group"
              >
                <h3 className={`font-semibold mb-2 ${c.color}`}>{c.title}</h3>
                <p className="text-white/50 text-sm">{c.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
