import type { RecentlyModel } from '@mx-space/api-client'
import * as React from 'react'

import { routeBuilder, Routes } from '~/lib/route-builder'
import { toast } from '~/lib/toast'
import { EventTypes } from '~/types/events'

import type { EventHandler } from './types'
import { trackerRealtimeEvent } from './types'

export const recentlyCreateHandler: EventHandler = (data, { router }) => {
  trackerRealtimeEvent()
  if (location.pathname === routeBuilder(Routes.Thinking, {})) {
    // 页面上已经做了更新
  } else {
    toast.success(`写下一点小思考：\n${(data as RecentlyModel).content}`, {
      autoClose: 10000,
      iconElement: React.createElement('i', {
        className: 'i-mingcute-bulb-line',
      }),
      onClick: () => {
        router.push(routeBuilder(Routes.Thinking, {}))
      },
    })
  }
}

export const recentlyHandlers = {
  [EventTypes.RECENTLY_CREATE]: recentlyCreateHandler,
} as const
