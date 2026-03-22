'use client'

import { AnimatePresence, m } from 'motion/react'
import type * as React from 'react'
import {
  startTransition,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useIsImmersiveReadingEnabled } from '~/atoms/hooks/reading'
import { DOMCustomEvents } from '~/constants/event'
import { useForceUpdate } from '~/hooks/common/use-force-update'
import { clsxm } from '~/lib/helper'
import { throttle } from '~/lib/lodash'
import { useWrappedElement } from '~/providers/shared/WrappedElementProvider'

import { TocFocusView } from './TocFocusView'
import { useTocHeadingStrategy } from './TocHeadingStrategy'
import type { ITocItem } from './TocItem'
import { TocTree } from './TocTree'
import { useVisibleHeadingsValue } from './useVisibleHeadings'

export type TocAsideProps = {
  treeClassName?: string
  focusOverlayClassName?: string
}

export interface TocSharedProps {
  accessory?: React.ReactNode | React.FC
  as?: React.ElementType
}

export interface TocAsideRef {
  getContainer: () => HTMLUListElement | null
}

export const TocAside = ({
  ref,
  className,
  children,
  treeClassName,
  focusOverlayClassName,
  accessory,
  as: As = 'aside',
}: TocAsideProps &
  TocSharedProps &
  ComponentType & { ref?: React.RefObject<TocAsideRef | null> }) => {
  const containerRef = useRef<HTMLUListElement>(null)
  const $article = useWrappedElement()
  const isImmersive = useIsImmersiveReadingEnabled()
  const [isHoveringAside, setIsHoveringAside] = useState(false)

  const [forceUpdate, updated] = useForceUpdate()

  useEffect(() => {
    const handler = () => {
      startTransition(() => {
        forceUpdate()
      })
    }
    document.addEventListener(DOMCustomEvents.RefreshToc, handler)
    return () => {
      document.removeEventListener(DOMCustomEvents.RefreshToc, handler)
    }
  }, [])

  useImperativeHandle(ref, () => ({
    getContainer: () => containerRef.current,
  }))

  if ($article === undefined) {
    throw new TypeError('<Toc /> must be used in <WrappedElementProvider />')
  }

  const queryHeadings = useTocHeadingStrategy()
  const $headings = useMemo(() => {
    if (!$article) return []
    return queryHeadings($article)
  }, [$article, updated, queryHeadings])

  // Read-only: TocTree owns the observer and writes to the atom
  const { activeId } = useVisibleHeadingsValue()

  // Build toc items for FocusView
  const toc: ITocItem[] = useMemo(
    () =>
      Array.from($headings).map((el, idx) => {
        const depth = +el.tagName.slice(1)
        const elClone = el.cloneNode(true) as HTMLElement
        elClone.querySelectorAll('del, .katex-container').forEach((del) => {
          del.remove()
        })
        const title = elClone.textContent || ''
        return {
          depth,
          index: idx,
          title,
          anchorId: el.id,
          $heading: el,
        }
      }),
    [$headings],
  )

  const rootDepth = useMemo(
    () =>
      toc.length
        ? toc.reduce((d, cur) => Math.min(d, cur.depth), toc[0].depth)
        : 0,
    [toc],
  )

  useEffect(() => {
    const setMaxWidth = throttle(() => {
      if (containerRef.current) {
        containerRef.current.style.maxWidth = `${
          window.innerWidth -
          containerRef.current.getBoundingClientRect().x -
          30
        }px`
      }
    }, 14)
    setMaxWidth()
    window.addEventListener('resize', setMaxWidth)
    return () => {
      window.removeEventListener('resize', setMaxWidth)
    }
  }, [])

  // Reset hover state when immersive mode changes
  useEffect(() => {
    if (!isImmersive) setIsHoveringAside(false)
  }, [isImmersive])

  const showFocus = isImmersive && !isHoveringAside

  return (
    <As
      className={clsxm('st-toc z-[3]', 'relative font-sans', className)}
      onMouseEnter={() => setIsHoveringAside(true)}
      onMouseLeave={() => setIsHoveringAside(false)}
    >
      {/* TocTree always mounted so IntersectionObserver stays alive */}
      <m.div
        animate={{ opacity: showFocus ? 0 : 1 }}
        className={showFocus ? 'pointer-events-none' : undefined}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <TocTree
          $headings={$headings}
          accessory={accessory}
          className={clsxm('absolute max-h-[75vh]', treeClassName)}
          containerRef={containerRef}
        />
      </m.div>

      {/* Focus overlay: dot map + progress ring */}
      <AnimatePresence>
        {showFocus && (
          <m.div
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key="focus"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={clsxm(
              // Keep focus mode pinned to the action-aside column instead of
              // centering across the hidden TOC tree width.
              'absolute inset-y-0 left-4 flex w-6 items-center justify-center',
              focusOverlayClassName,
            )}
          >
            <TocFocusView activeId={activeId} rootDepth={rootDepth} toc={toc} />
          </m.div>
        )}
      </AnimatePresence>
      {children}
    </As>
  )
}
TocAside.displayName = 'TocAside'
