'use client'

import type { TargetAndTransition } from 'motion/react'
import { m } from 'motion/react'
import { memo } from 'react'
import { tv } from 'tailwind-variants'

import { LeftToRightTransitionView } from '~/components/ui/transition'
import { Link } from '~/i18n/navigation'
import { clsxm } from '~/lib/helper'
import { routeBuilder, Routes } from '~/lib/route-builder'
import { springScrollToTop } from '~/lib/scroller'

const styles = tv({
  base: 'text-neutral-8 min-w-0 truncate text-left opacity-50 transition-all tabular-nums hover:opacity-80',
  variants: {
    status: {
      active: 'ml-2 opacity-100',
    },
  },
})
const initialLi: TargetAndTransition = {
  opacity: 0.0001,
}
const animateLi: TargetAndTransition = {
  opacity: 1,
}

export const NoteTimelineItem = memo<{
  active: boolean
  created?: Date | string
  title: string
  nid: number
  slug?: string | null

  layout?: boolean
}>((props) => {
  const { active, nid, title, layout, slug, created } = props
  const href = routeBuilder(Routes.Note, {
    id: nid,
    slug: slug || undefined,
    created,
  })
  return (
    <m.li
      animate={animateLi}
      className="flex items-center"
      exit={initialLi}
      initial={initialLi}
      layout={layout}
      layoutId={layout ? `note-${nid}` : undefined}
    >
      {active && (
        <LeftToRightTransitionView
          as="span"
          className="inline-flex items-center"
        >
          <i className="i-material-symbols-arrow-circle-right-outline-rounded duration-200" />
        </LeftToRightTransitionView>
      )}
      <Link
        href={href}
        className={clsxm(
          active
            ? styles({
                status: 'active',
              })
            : styles(),
        )}
        onClick={springScrollToTop}
      >
        {title}
      </Link>
    </m.li>
  )
})
NoteTimelineItem.displayName = 'MemoedItem'
