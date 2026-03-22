'use client'

import { useTranslations } from 'next-intl'
import type { FC } from 'react'

import { useCurrentRoomCount } from '~/atoms/hooks/activity'
import { FloatPopover } from '~/components/ui/float-popover'

import { useMaybeInRoomContext } from '../activity'

export const CurrentReadingCountingMetaBarItem: FC<{
  leftElement?: React.ReactNode
}> = ({ leftElement }) => {
  const t = useTranslations('activity')
  const roomCtx = useMaybeInRoomContext()

  const count = useCurrentRoomCount(roomCtx?.roomName || '')

  if (!roomCtx || count <= 1) return null

  return (
    <>
      {leftElement}
      <FloatPopover
        asChild
        mobileAsSheet
        type="tooltip"
        triggerElement={
          <span>
            {t('current_readers')}
            <span className="mx-1 font-medium">{count}</span>
            {t('reading_now')}
          </span>
        }
      >
        {t('realtime_tooltip')}
      </FloatPopover>
    </>
  )
}
