import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  loading: boolean
}

export default function TopLoadingBar({ loading }: Props) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (!loading) {
      setWidth(100)
      const t = setTimeout(() => setWidth(0), 400)
      return () => clearTimeout(t)
    }
    setWidth(0)
    const t1 = setTimeout(() => setWidth(40), 50)
    const t2 = setTimeout(() => setWidth(70), 800)
    const t3 = setTimeout(() => setWidth(85), 2000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [loading])

  return (
    <AnimatePresence>
      {(loading || width > 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 z-[200] h-0.5"
          aria-hidden="true"
        >
          <div
            className="h-full bg-gradient-to-r from-genomic-cyan to-genomic-emerald transition-all ease-out"
            style={{
              width: `${width}%`,
              transitionDuration: loading ? '600ms' : '250ms',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
