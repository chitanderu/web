'use client'

import { Avatar } from '@base-ui/react/avatar'
import { useQuery } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { AnimatePresence, m } from 'motion/react'
import { useTranslations } from 'next-intl'
import type { FC } from 'react'
import {
  Fragment,
  memo,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useDebouncedCallback } from 'use-debounce'

import {
  useActivityPresence,
  useActivityPresenceByRoomName,
  useActivityPresenceBySessionId,
} from '~/atoms/hooks/activity'
import { useIsOwnerLogged, useOwner } from '~/atoms/hooks/owner'
import { useAuthReader, useSessionReader } from '~/atoms/hooks/reader'
import { useIsImmersiveReadingEnabled } from '~/atoms/hooks/reading'
import { useSocketSessionId } from '~/atoms/hooks/socket'
import { useIsMobile } from '~/atoms/hooks/viewport'
import { getServerTime } from '~/components/common/SyncServerTime'
import { RootPortal } from '~/components/ui/portal'
import { EmitKeyMap } from '~/constants/keys'
import { Spring } from '~/constants/spring'
import { useEventCallback } from '~/hooks/common/use-event-callback'
import { useIsClient } from '~/hooks/common/use-is-client'
import { useIsDark } from '~/hooks/common/use-is-dark'
import { useReadPercent } from '~/hooks/shared/use-read-percent'
import { getColorScheme, stringToHue } from '~/lib/color'
import { safeJsonParse } from '~/lib/helper'
import { uniq } from '~/lib/lodash'
import { buildNSKey } from '~/lib/ns'
import { apiClient } from '~/lib/request'
import { queries } from '~/queries/definition'
import { socketWorker } from '~/socket/worker-client'

import { commentStoragePrefix } from '../comment/CommentBox/providers'
import { useRoomContext } from './Room'

export const Presence = () => {
  const isClient = useIsClient()

  return isClient ? <PresenceImpl /> : null
}

const presenceStoredNameAtom = atomWithStorage(buildNSKey('presence-name'), '')

const PresenceImpl = () => {
  const { roomName } = useRoomContext()
  const isMobile = useIsMobile()
  const { refetch } = useQuery({
    ...queries.activity.presence(roomName),

    refetchOnMount: true,
    refetchInterval: 30_000,
  })

  const identity = useSocketSessionId()

  const reader = useSessionReader()
  const owner = useOwner()

  const isOwnerLogged = useIsOwnerLogged()
  const commentStoredName = (() => {
    const value = globalThis?.localStorage.getItem(
      `${commentStoragePrefix}author`,
    )
    if (value) {
      return safeJsonParse(value) || value
    }
    return ''
  })()

  const presenceStoredName = useAtomValue(presenceStoredNameAtom)
  const displayName = useMemo(
    () =>
      isOwnerLogged
        ? owner?.name
        : reader?.name || presenceStoredName || commentStoredName || '',
    [
      commentStoredName,
      isOwnerLogged,
      owner?.name,
      presenceStoredName,
      reader?.name,
    ],
  )

  const update = useDebouncedCallback(async (position: number) => {
    const sid = await socketWorker.getSid()
    if (!sid) return
    return apiClient.activity.updatePresence({
      identity,
      position,
      sid,
      roomName,
      displayName: displayName || void 0,
      readerId: reader?.id,
      ts: getServerTime().getTime() || Date.now(),
    })
  }, 1000)

  const percent = useReadPercent()

  const updateWithPercent = useEventCallback(() => update(percent))

  useEffect(() => {
    const handler = () => {
      refetch()
      updateWithPercent()
    }
    globalThis.addEventListener(EmitKeyMap.SocketConnected, handler)

    return () => {
      globalThis.removeEventListener(EmitKeyMap.SocketConnected, handler)
    }
  }, [refetch, updateWithPercent])

  useEffect(() => {
    update(percent)
  }, [percent, update])

  if (isMobile) return null

  return <ReadPresenceTimeline />
}

const TRACK_TOP = 64
const TRACK_BOTTOM = 64
const CLUSTER_GAP_PX = 18

interface PresenceCluster {
  hasCurrent: boolean
  identities: string[]
  position: number
  stableKey: string
}

function clusterPresences(
  items: Array<{ identity: string; pct: number; isCurrent: boolean }>,
  trackHeightPx: number,
): PresenceCluster[] {
  if (items.length === 0) return []
  const thresholdPct = (CLUSTER_GAP_PX / trackHeightPx) * 100
  const sorted = [...items].sort((a, b) => a.pct - b.pct)
  const clusters: PresenceCluster[] = []
  let group = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].pct - group[0].pct <= thresholdPct) {
      group.push(sorted[i])
    } else {
      clusters.push(buildCluster(group))
      group = [sorted[i]]
    }
  }
  clusters.push(buildCluster(group))
  return clusters
}

function buildCluster(
  group: Array<{ identity: string; pct: number; isCurrent: boolean }>,
): PresenceCluster {
  const hasCurrent = group.some((x) => x.isCurrent)
  const avg = group.reduce((s, x) => s + x.pct, 0) / group.length
  const identities = hasCurrent
    ? [
        group.find((x) => x.isCurrent)!.identity,
        ...group.filter((x) => !x.isCurrent).map((x) => x.identity),
      ]
    : group.map((x) => x.identity)
  const stableKey = group.map((x) => x.identity).sort()[0]
  return { identities, position: avg, hasCurrent, stableKey }
}

const ReadPresenceTimeline = () => {
  const sessionId = useSocketSessionId()
  const isImmersive = useIsImmersiveReadingEnabled()
  const [isHovered, setIsHovered] = useState(false)

  const { roomName } = useRoomContext()
  const activityPresenceIdsCurrentRoom = useActivityPresenceByRoomName(roomName)
  const allPresence = useActivityPresence()
  const currentPercent = useReadPercent()

  const uniqueIds = uniq(activityPresenceIdsCurrentRoom)

  const clusters = useMemo(() => {
    const trackHeightPx = window.innerHeight - TRACK_TOP - TRACK_BOTTOM
    const items = uniqueIds.map((id) => ({
      identity: id,
      pct: id === sessionId ? currentPercent : (allPresence[id]?.position ?? 0),
      isCurrent: id === sessionId,
    }))
    return clusterPresences(items, trackHeightPx)
  }, [uniqueIds, allPresence, currentPercent, sessionId])

  return (
    <RootPortal>
      <m.div
        data-hide-print
        animate={{ opacity: isImmersive ? 0 : 1 }}
        className="fixed left-0 top-0 z-[3] h-screen w-8"
        style={{ pointerEvents: isImmersive ? 'none' : 'auto' }}
        transition={Spring.presets.smooth}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <m.div
          animate={{ width: isHovered ? 200 : 24 }}
          className="relative h-full"
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        >
          <AnimatePresence>
            {isHovered && (
              <m.div
                animate={{ opacity: 1 }}
                className="absolute inset-0 border-r border-border bg-neutral-1/95 backdrop-blur-sm"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              />
            )}
          </AnimatePresence>

          <div
            className="absolute left-0 right-0"
            style={{ top: TRACK_TOP, bottom: TRACK_BOTTOM }}
          >
            <AnimatePresence initial={false}>
              {clusters.map((cluster) => (
                <ClusterTimelineItem
                  cluster={cluster}
                  isExpanded={isHovered}
                  key={cluster.stableKey}
                  sessionId={sessionId}
                />
              ))}
            </AnimatePresence>
          </div>

          <div
            className="absolute bottom-0 left-0 right-0 flex items-start"
            style={{ height: TRACK_BOTTOM }}
          >
            {isHovered && sessionId && (
              <m.span
                animate={{ opacity: 1 }}
                className="ml-3 mt-2 text-[10px] text-neutral-9/25"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                <CurrentUserProgress sessionId={sessionId} />
              </m.span>
            )}
          </div>
        </m.div>
      </m.div>
    </RootPortal>
  )
}

interface ClusterTimelineItemProps {
  cluster: PresenceCluster
  isExpanded: boolean
  sessionId: string | null
}
const ClusterTimelineItem: FC<ClusterTimelineItemProps> = memo(
  ({ cluster, isExpanded, sessionId }) => {
    const { identities, position: clusterPosition, hasCurrent } = cluster
    const count = identities.length
    const primaryIdentity = identities[0]

    const primaryPresence = useActivityPresenceBySessionId(primaryIdentity)
    const isDark = useIsDark()
    const position = useDeferredValue(clusterPosition)

    const bgColor = useMemo(() => {
      if (!primaryPresence) return ''
      return getColorScheme(stringToHue(primaryPresence.identity))[
        isDark ? 'dark' : 'light'
      ].accent
    }, [isDark, primaryPresence])

    if (!primaryPresence) return null

    return (
      <m.div
        animate={{ top: `${position}%`, opacity: 1 }}
        className="absolute left-0 right-0"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        style={{ marginTop: -10 }}
        transition={{
          top: { type: 'spring', stiffness: 120, damping: 20, mass: 0.8 },
          opacity: { duration: 0.15 },
        }}
      >
        <div className="flex items-center">
          <m.div
            style={{ backgroundColor: bgColor }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            animate={{
              width: isExpanded ? 4 : 3,
              height: isExpanded ? 20 : count > 1 ? 14 : 10,
              borderRadius: isExpanded ? 4 : 0,
              marginLeft: isExpanded ? 6 : 0,
              opacity: hasCurrent ? 1 : isExpanded ? 0.85 : 0.6,
            }}
          />

          {isExpanded && (
            <m.div
              animate={{ opacity: 1, x: 0 }}
              className="ml-2.5 flex items-center gap-2 overflow-hidden"
              exit={{ opacity: 0, x: -8 }}
              initial={{ opacity: 0, x: -8 }}
              transition={{
                type: 'spring',
                stiffness: 350,
                damping: 28,
                delay: 0.04,
              }}
            >
              {/* Stacked avatars */}
              <div className="flex items-center">
                {identities.slice(0, 3).map((id, i) => (
                  <ClusterAvatar
                    identity={id}
                    isCurrent={id === sessionId}
                    isDark={isDark}
                    key={id}
                    overlap={i > 0}
                    zIndex={count - i}
                  />
                ))}
                {count > 3 && (
                  <div
                    className="-ml-1.5 flex size-[18px] shrink-0 items-center justify-center rounded-full text-[7px] font-bold"
                    style={{
                      backgroundColor: bgColor,
                      color: 'var(--fallback-b1)',
                      zIndex: 0,
                    }}
                  >
                    +{count - 3}
                  </div>
                )}
              </div>

              {/* Names */}
              <ClusterNames
                hasCurrent={hasCurrent}
                identities={identities}
                sessionId={sessionId}
              />

              {/* Position */}
              <span className="text-[10px] tabular-nums text-neutral-9/40">
                {Math.round(position)}%
              </span>
            </m.div>
          )}
        </div>
      </m.div>
    )
  },
)
ClusterTimelineItem.displayName = 'ClusterTimelineItem'

const ClusterAvatar: FC<{
  identity: string
  isCurrent: boolean
  isDark: boolean
  zIndex: number
  overlap: boolean
}> = memo(({ identity, isCurrent, isDark, zIndex, overlap }) => {
  const t = useTranslations('activity')
  const presence = useActivityPresenceBySessionId(identity)
  const reader = useAuthReader(presence?.readerId || '')

  const bgColor = useMemo(() => {
    if (!presence) return '#888'
    return getColorScheme(stringToHue(presence.identity))[
      isDark ? 'dark' : 'light'
    ].accent
  }, [isDark, presence])

  if (!presence) return null

  const displayName =
    reader?.name ||
    presence.displayName ||
    (isCurrent ? t('presence_you') : t('presence_reader'))
  const style = { zIndex, ...(overlap ? { marginLeft: '-6px' } : {}) }

  if (reader?.image) {
    return (
      <Avatar.Root
        className="size-[18px] shrink-0 overflow-hidden rounded-full ring-1 ring-border/30"
        style={style}
      >
        <Avatar.Image alt={displayName} src={reader.image} />
        <Avatar.Fallback
          className="text-[7px] font-semibold"
          style={{ backgroundColor: bgColor, color: 'var(--fallback-b1)' }}
        >
          {displayName[0]}
        </Avatar.Fallback>
      </Avatar.Root>
    )
  }

  return (
    <div
      className="flex size-[18px] shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: bgColor, ...style }}
    >
      {isCurrent && (
        <span
          className="text-[7px] font-bold"
          style={{ color: 'var(--fallback-b1)' }}
        >
          {t('presence_me')}
        </span>
      )}
    </div>
  )
})
ClusterAvatar.displayName = 'ClusterAvatar'

const ClusterNames: FC<{
  identities: string[]
  sessionId: string | null
  hasCurrent: boolean
}> = memo(({ identities, sessionId, hasCurrent }) => {
  const t = useTranslations('activity')
  const MAX_SHOWN = 2
  const shown = identities.slice(0, MAX_SHOWN)
  const extra = identities.length - MAX_SHOWN

  return (
    <span
      className={`whitespace-nowrap text-[11px] font-semibold leading-none ${
        hasCurrent ? 'text-neutral-9' : 'text-neutral-9/80'
      }`}
    >
      {shown.map((id, i) => (
        <Fragment key={id}>
          {i > 0 && <span>{t('presence_list_sep')}</span>}
          <PersonName identity={id} isCurrent={id === sessionId} />
        </Fragment>
      ))}
      {extra > 0 && (
        <span>{t('presence_and_more', { count: identities.length })}</span>
      )}
    </span>
  )
})
ClusterNames.displayName = 'ClusterNames'

const PersonName: FC<{ identity: string; isCurrent: boolean }> = ({
  identity,
  isCurrent,
}) => {
  const t = useTranslations('activity')
  const presence = useActivityPresenceBySessionId(identity)
  const reader = useAuthReader(presence?.readerId || '')
  return (
    <>
      {reader?.name ||
        presence?.displayName ||
        (isCurrent ? t('presence_you') : t('presence_reader'))}
    </>
  )
}

const CurrentUserProgress: FC<{ sessionId: string }> = ({ sessionId }) => {
  const t = useTranslations('activity')
  const presence = useActivityPresenceBySessionId(sessionId)
  const readPercent = useReadPercent()
  const position = presence ? readPercent : 0

  return <>{t('presence_read_progress', { percent: Math.round(position) })}</>
}
