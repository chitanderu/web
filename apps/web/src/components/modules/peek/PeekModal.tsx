'use client'

import { m } from 'motion/react'
import { useTranslations } from 'next-intl'
import type { PropsWithChildren } from 'react'
import { useEffect } from 'react'

import { ImpressionView } from '~/components/common/ImpressionTracker'
import { useModalStack } from '~/components/ui/modal'
import { microReboundPreset } from '~/constants/spring'
import { TrackerAction } from '~/constants/tracker'
import { Link } from '~/i18n/navigation'

export const PeekModal = (
  props: PropsWithChildren<{
    to?: string
  }>,
) => {
  const t = useTranslations('common')
  const { dismissAll, dismissTop } = useModalStack()
  const { to, children } = props

  useEffect(() => {
    if (!to) return
    history.replaceState({}, '', `?peek-to=${to}`)

    return () => {
      history.replaceState({}, '', location.pathname)
    }
  }, [to])
  return (
    <div className="scrollbar-none relative mx-auto mt-[10vh] max-w-full px-2 lg:max-w-[65rem] lg:p-0">
      <ImpressionView
        action={TrackerAction.Impression}
        trackerMessage="Peek Modal"
      />
      <m.div
        animate={{ opacity: 1, y: 0 }}
        className="scrollbar-none"
        exit={{ opacity: 0, y: 50 }}
        initial={{ opacity: 0.5, y: 50 }}
        transition={microReboundPreset}
      >
        {children}
      </m.div>

      <m.div
        className="fixed right-2 top-2 flex items-center gap-4"
        initial={true}
        exit={{
          opacity: 0,
        }}
      >
        {to && (
          <Link
            className="center flex size-8 rounded-full p-1 shadow-xs ring-1 ring-neutral-3"
            href={to}
            onClick={dismissAll}
          >
            <i className="i-mingcute-fullscreen-2-line text-lg" />
            <span className="sr-only">{t('aria_open_link')}</span>
          </Link>
        )}

        <button
          className="center flex size-8 rounded-full p-1 shadow-xs ring-1 ring-neutral-3"
          onClick={dismissTop}
        >
          <i className="i-mingcute-close-line text-lg" />
          <span className="sr-only">{t('actions_close')}</span>
        </button>
      </m.div>
    </div>
  )
}
