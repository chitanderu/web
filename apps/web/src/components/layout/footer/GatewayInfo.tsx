'use client'

import NumberFlow from '@number-flow/react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'

import { useOnlineCount } from '~/atoms'
import { useSocketIsConnect } from '~/atoms/hooks/socket'
import { ImpressionView } from '~/components/common/ImpressionTracker'
import { PeekLink } from '~/components/modules/peek/PeekLink'
import { Divider } from '~/components/ui/divider'
import { FloatPopover } from '~/components/ui/float-popover'
import { TrackerAction } from '~/constants/tracker'
import { usePageIsActive } from '~/hooks/common/use-is-active'
import { getNoteRouteParams } from '~/lib/note-route'
import { apiClient } from '~/lib/request'
import { routeBuilder, Routes } from '~/lib/route-builder'

const Help = () => {
  const t = useTranslations('gateway')
  return (
    <FloatPopover
      asChild
      mobileAsSheet
      as="span"
      triggerElement={<i className="i-mingcute-question-line cursor-help" />}
      type="tooltip"
      sheet={{
        triggerAsChild: true,
      }}
    >
      <div className="space-y-2 leading-relaxed">
        <p className="flex items-center space-x-1 opacity-80">
          <i className="i-mingcute-question-line" />
          <span className="font-medium">{t('how_it_works')}</span>
        </p>
        <p>{t('websocket_intro')}</p>
        <p>{t('websocket_realtime')}</p>

        <Divider />

        <p>
          {t('socket_status')}
          <ConnectedIndicator />
        </p>
      </div>
    </FloatPopover>
  )
}

const ConnectedIndicator = () => {
  const connected = useSocketIsConnect()

  return (
    <div className="inline-flex items-center">
      <ImpressionView
        action={TrackerAction.Impression}
        trackerMessage="socket_status"
      />
      <ConnectionStatus isConnected={connected} />
    </div>
  )
}

function ConnectionStatus({ isConnected }: { isConnected: boolean }) {
  const t = useTranslations('gateway')
  const color = isConnected ? '#00FC47' : '#FC0000'
  const secondaryColor = isConnected
    ? 'rgba(174, 244, 194, 0.46)'
    : 'rgba(244, 174, 174, 0.46)'
  const text = isConnected ? t('connected') : t('disconnected')

  const backgroundStyle = {
    background: `radial-gradient(45.91% 45.91% at 49.81% 54.09%, ${color} 7.13%, ${secondaryColor} 65.83%, rgba(252, 252, 252, 0.00) 100%)`,
  }

  return (
    <>
      <span className="absolute size-5" style={backgroundStyle} />
      <span className="ml-6">{text}</span>
    </>
  )
}

export const GatewayInfo = () => {
  const t = useTranslations('gateway')
  const isActive = usePageIsActive()
  const count = useOnlineCount()
  const connected = useSocketIsConnect()

  if (!isActive) return null
  return (
    <div className="inline-flex items-center gap-2">
      <FloatPopover
        asChild
        mobileAsSheet
        offset={10}
        placement="top"
        trigger="both"
        triggerElement={
          <span
            className="inline-flex cursor-pointer items-center gap-1"
            key={count}
          >
            <span
              className="inline-block size-[5px] rounded-full"
              style={{
                backgroundColor: connected ? '#00FC47' : '#FC0000',
              }}
            />
            <span>
              {t('being_viewed')}
              <NumberFlow
                value={count}
                style={{
                  fontVariantNumeric: 'tabular-nums',
                  verticalAlign: 'middle',
                }}
              />
              {t('viewers')}
            </span>
          </span>
        }
      >
        <RoomsInfo />
      </FloatPopover>
      <Help />
    </div>
  )
}

const RoomsInfo = () => {
  const t = useTranslations('gateway')
  const { data } = useQuery({
    queryKey: ['rooms'],
    refetchOnMount: true,
    staleTime: 1000 * 10,
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const res = await apiClient.activity.getRoomsInfo()
      const data = res.$serialized
      const result = [] as {
        path: string
        title: string
        count: number
      }[]
      const morphArticleIdToRoomName = (id: string) => `article_${id}`
      data.objects.notes.forEach((note) => {
        result.push({
          path: routeBuilder(Routes.Note, {
            ...getNoteRouteParams(note),
          }),
          title: note.title,
          count: data.roomCount[morphArticleIdToRoomName(note.id)],
        })
      })
      data.objects.posts.forEach((post) => {
        result.push({
          path: routeBuilder(Routes.Post, {
            category: post.category.slug,
            slug: post.slug,
          }),
          title: post.title,
          count: data.roomCount[morphArticleIdToRoomName(post.id)],
        })
      })
      data.objects.pages.forEach((page) => {
        result.push({
          path: routeBuilder(Routes.Page, {
            slug: page.slug,
          }),
          title: page.title,
          count: data.roomCount[morphArticleIdToRoomName(page.id)],
        })
      })
      return result.sort((a, b) => b.count - a.count)
    },
  })

  if (!data)
    return (
      <div className="center flex size-6">
        <div className="loading loading-spinner" />
      </div>
    )
  if (data.length === 0)
    return <div className="text-neutral-7">{t('no_readers')}</div>
  return (
    <div className="lg:max-w-[400px]">
      <div className="mb-2 text-sm font-medium">{t('popular_content')}</div>
      <ul className="flex flex-col justify-between gap-2">
        {data.map((room) => (
          <li className="flex items-center justify-between" key={room.path}>
            <PeekLink className="hover:underline" href={room.path}>
              {room.title}
            </PeekLink>
            {!!room.count && (
              <span className="ml-5 inline-flex items-center text-sm text-neutral-7">
                <i className="i-mingcute-user-visible-line" /> {room.count}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
