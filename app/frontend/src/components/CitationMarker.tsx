import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, TriangleAlert } from 'lucide-react'
import {
  MorphingPopover,
  MorphingPopoverContent,
  MorphingPopoverClose,
  MorphingPopoverTrigger,
} from './ui/morphing-popover'
import type { Citation } from '../lib/citations'
import { bareDoi, doiUrl } from '../lib/doi'
import { cn } from '../lib/utils'

/** Open the card toward whichever side of the viewport has room. */
function useAlign() {
  const ref = useRef<HTMLSpanElement>(null)
  const [align, setAlign] = useState<'left' | 'right'>('left')
  const measure = () => {
    const rect = ref.current?.getBoundingClientRect()
    if (rect) setAlign(rect.left > window.innerWidth / 2 ? 'right' : 'left')
  }
  return { ref, align, measure }
}

const markerBase =
  'mx-0.5 inline-flex h-[1.15rem] min-w-[1.15rem] items-center justify-center rounded px-1 align-[0.15em] font-mono text-[0.7rem] font-medium leading-none transition-colors'

export function CitationMarker({ n, citation }: { n: number; citation: Citation }) {
  const { ref, align, measure } = useAlign()
  return (
    <span ref={ref} onPointerEnter={measure} onFocusCapture={measure} className="inline-flex">
      <MorphingPopover>
        <MorphingPopoverTrigger
          className={cn(markerBase, 'bg-accent/15 text-accent hover:bg-accent/25')}
          aria-label={`Source ${n}: ${citation.title}`}
        >
          {n}
        </MorphingPopoverTrigger>
        <MorphingPopoverContent
          className={cn('top-0 w-72 max-w-[80vw] pr-8', align === 'left' ? 'left-0' : 'right-0')}
          aria-label={`Source ${n}`}
        >
          <MorphingPopoverClose />
          <span className="eyebrow mb-1 block">Source {n}</span>
          <span className="mb-2 block text-sm font-medium leading-snug">{citation.title || bareDoi(citation.doi)}</span>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <Link to={`/paper/${citation.paper_id}`} className="font-medium text-accent hover:underline">
              Open paper
            </Link>
            <a
              href={doiUrl(citation.doi)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 font-mono text-subtle hover:text-fg"
            >
              {bareDoi(citation.doi)}
              <ArrowUpRight size={12} aria-hidden="true" />
              <span className="sr-only">(opens in new tab)</span>
            </a>
          </span>
        </MorphingPopoverContent>
      </MorphingPopover>
    </span>
  )
}

export function UnverifiedMarker({ doi }: { doi: string }) {
  const { ref, align, measure } = useAlign()
  return (
    <span ref={ref} onPointerEnter={measure} onFocusCapture={measure} className="inline-flex">
      <MorphingPopover>
        <MorphingPopoverTrigger
          className={cn(markerBase, 'gap-0.5 bg-warn/15 text-warn hover:bg-warn/25')}
          aria-label={`Unverified reference ${doi}`}
        >
          <TriangleAlert size={10} aria-hidden="true" />?
        </MorphingPopoverTrigger>
        <MorphingPopoverContent
          className={cn('top-0 w-72 max-w-[80vw] pr-8', align === 'left' ? 'left-0' : 'right-0')}
          aria-label="Unverified reference"
        >
          <MorphingPopoverClose />
          <span className="eyebrow mb-1 block text-warn">Unverified</span>
          <span className="block text-sm leading-snug">
            <span className="font-mono text-xs">{doi}</span> was cited but isn’t among the papers the agent
            retrieved, so it can’t be checked against the corpus.
          </span>
        </MorphingPopoverContent>
      </MorphingPopover>
    </span>
  )
}
