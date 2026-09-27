import { useEffect, useState } from 'react'

interface Props {
  loading: boolean
}

export default function TopLoadingBar({ loading }: Props) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (!loading) {
      setWidth(w => (w > 0 ? 100 : 0))
      const t = setTimeout(() => setWidth(0), 300)
      return () => clearTimeout(t)
    }
    setWidth(0)
    const t1 = setTimeout(() => setWidth(40), 50)
    const t2 = setTimeout(() => setWidth(70), 800)
    const t3 = setTimeout(() => setWidth(85), 2000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [loading])

  if (!loading && width === 0) return null

  return (
    <div className="fixed inset-x-0 top-0 z-[200] h-0.5" aria-hidden="true">
      <div
        className="h-full bg-accent transition-all ease-out"
        style={{ width: `${width}%`, transitionDuration: loading ? '600ms' : '250ms' }}
      />
    </div>
  )
}
