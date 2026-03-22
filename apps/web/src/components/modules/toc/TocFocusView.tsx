'use client'

import { useReadPercent } from '~/hooks/shared/use-read-percent'
import { clsxm } from '~/lib/helper'

import type { ITocItem } from './TocItem'

const RING_SIZE = 28
const RING_RADIUS = 11
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

export const TocFocusView = ({
  toc,
  activeId,
  rootDepth,
}: {
  toc: ITocItem[]
  activeId: string | null
  rootDepth: number
}) => {
  const readPercent = useReadPercent()

  const topLevelItems = toc.filter((item) => item.depth === rootDepth)

  if (topLevelItems.length === 0) return null

  // Resolve activeId to its nearest root-level ancestor so the dot lights up
  // even when a nested heading (h3/h4) is the active one.
  const activeRootId = (() => {
    if (!activeId) return null
    const activeItem = toc.find((i) => i.anchorId === activeId)
    if (!activeItem) return null
    if (activeItem.depth === rootDepth) return activeId
    // Walk backwards to find the closest root-depth predecessor
    for (let i = activeItem.index - 1; i >= 0; i--) {
      if (toc[i].depth === rootDepth) return toc[i].anchorId
    }
    return null
  })()

  const gap = topLevelItems.length > 15 ? 8 : 14

  const dashOffset =
    RING_CIRCUMFERENCE - (readPercent / 100) * RING_CIRCUMFERENCE

  return (
    <div className="flex h-full flex-col items-center justify-center gap-0">
      <div className="flex flex-col items-center" style={{ gap }}>
        {topLevelItems.map((item) => {
          const isActive = item.anchorId === activeRootId
          return (
            <span
              key={item.anchorId}
              className={clsxm(
                'rounded-full transition-all duration-300',
                isActive
                  ? 'size-1.5 bg-neutral-8/65 animate-[dotPulse_2.5s_ease-in-out_infinite]'
                  : 'size-1 bg-neutral-8/15',
              )}
            />
          )
        })}
      </div>

      <div className="mt-6 flex flex-col items-center">
        <svg
          className="-rotate-90"
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          width={RING_SIZE}
        >
          <circle
            className="stroke-neutral-8/10"
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            fill="none"
            r={RING_RADIUS}
            strokeWidth={1.5}
          />
          <circle
            className="stroke-neutral-8/45 transition-[stroke-dashoffset] duration-300"
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            fill="none"
            r={RING_RADIUS}
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            strokeWidth={1.5}
          />
        </svg>
        <span className="mt-1 text-[9px] tabular-nums text-neutral-8/45">
          {readPercent}%
        </span>
      </div>
    </div>
  )
}
