import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto px-6 py-24 text-center"
      role="main"
      aria-labelledby="not-found-heading"
    >
      <div className="text-8xl font-bold text-gradient mb-6 select-none" aria-hidden="true">404</div>
      <h1 id="not-found-heading" className="text-2xl font-semibold mb-3">Page not found</h1>
      <p className="text-white/50 mb-8">
        The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link to="/" className="px-6 py-3 bg-genomic-cyan text-navy-DEFAULT font-semibold rounded-xl hover:bg-genomic-cyan/90 transition-colors">
          Go home
        </Link>
        <Link to="/search" className="px-6 py-3 glass rounded-xl hover:border-white/30 transition-colors">
          Search papers
        </Link>
      </div>
    </motion.div>
  )
}
