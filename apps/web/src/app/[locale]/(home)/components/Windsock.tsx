'use client'

import NumberFlow from '@number-flow/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { usePresentSubscribeModal } from '~/components/modules/subscribe'
import { Link } from '~/i18n/navigation'
import { apiClient } from '~/lib/request'
import { toast } from '~/lib/toast'

const SEASON_GREETING_KEYS = {
  spring: 'ending_greeting_spring',
  summer: 'ending_greeting_summer',
  autumn: 'ending_greeting_autumn',
  winter: 'ending_greeting_winter',
} as const

function getSeasonFromMonth(month: number) {
  if (month >= 3 && month <= 5) return 'spring' as const
  if (month >= 6 && month <= 8) return 'summer' as const
  if (month >= 9 && month <= 11) return 'autumn' as const
  return 'winter' as const
}

function getHolidayKey(month: number, day: number): string | null {
  if (month === 1 && day <= 3) return 'windsock_newYear'
  if (month === 2 && day === 14) return 'windsock_valentine'
  if (month === 10 && day === 31) return 'windsock_halloween'
  if (month === 12 && day >= 24 && day <= 25) return 'windsock_christmas'
  return null
}

const SUBTLE_NAV = [
  { key: 'ending_nav_friends', path: '/friends' },
  { key: 'ending_nav_projects', path: '/projects' },
  { key: 'ending_nav_says', path: '/says' },
  { key: 'ending_nav_travel', path: 'https://travel.moe/go.html' },
] as const

export const Windsock = () => {
  const t = useTranslations('home')
  const tCommon = useTranslations('common')

  const greetingKey = useMemo(() => {
    const now = new Date()
    const holiday = getHolidayKey(now.getMonth() + 1, now.getDate())
    if (holiday) return holiday
    return SEASON_GREETING_KEYS[getSeasonFromMonth(now.getMonth() + 1)]
  }, [])

  const likeQueryKey = ['site-like']
  const { data: count } = useQuery({
    queryKey: likeQueryKey,
    queryFn: () => apiClient.proxy('like_this').get(),
    refetchInterval: 1000 * 60 * 5,
  })
  const queryClient = useQueryClient()

  const { present: presentSubscribe } = usePresentSubscribeModal()

  return (
    <section className="ws-scroll-container mx-auto mt-24 max-w-[1400px] px-6 pb-16 lg:px-12">
      {/* Greeting */}
      <div
        className="ws-scroll-enter text-center font-serif text-lg tracking-[2px] text-neutral-7 lg:text-xl"
        style={{ '--ws-i': 0 } as React.CSSProperties}
      >
        {t(greetingKey)}
      </div>
      <div
        className="ws-scroll-enter mb-10 text-center font-serif text-lg tracking-[2px] text-neutral-7 lg:mb-12 lg:text-xl"
        style={{ '--ws-i': 1 } as React.CSSProperties}
      >
        {t('ending_invitation')}
      </div>

      {/* Interaction */}
      <div
        className="ws-scroll-enter mb-12 flex items-center justify-center gap-8 lg:mb-14"
        style={{ '--ws-i': 2 } as React.CSSProperties}
      >
        <button
          className="group text-center"
          onClick={() => {
            apiClient
              .proxy('like_this')
              .post()
              .then(() => {
                queryClient.setQueryData(likeQueryKey, (prev: any) => prev + 1)
              })

            toast.success(tCommon('thanks'), {
              iconElement: <i className="i-mingcute-heart-fill text-error" />,
            })
          }}
        >
          <div className="font-serif text-sm text-neutral-6 transition-colors duration-300 group-hover:text-accent">
            {t('ending_like_label')}
          </div>
          <div className="font-serif text-xs italic text-neutral-6">
            <span className="text-red-400">♥</span>{' '}
            <NumberFlow value={count as any as number} />
          </div>
        </button>

        <div className="h-6 w-px bg-neutral-4" />

        <button className="group text-center" onClick={presentSubscribe}>
          <div className="font-serif text-sm text-neutral-6 transition-colors duration-300 group-hover:text-accent">
            {t('ending_subscribe_label')}
          </div>
          <div className="font-serif text-xs italic text-neutral-6">
            {t('ending_subscribe_sub')}
          </div>
        </button>
      </div>

      {/* Subtle nav */}
      <div
        className="ws-scroll-enter flex items-center justify-center gap-0 font-serif text-[11px] text-neutral-7/80 hover:text-neutral-7"
        style={{ '--ws-i': 3 } as React.CSSProperties}
      >
        {SUBTLE_NAV.map((item, index) => (
          <span className="inline-flex items-center" key={item.key}>
            {index > 0 && <span className="mx-2.5">·</span>}
            <Link
              className="transition-colors duration-300 hover:text-accent"
              href={item.path}
            >
              {t(item.key)}
            </Link>
          </span>
        ))}
      </div>
    </section>
  )
}
