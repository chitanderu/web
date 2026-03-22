'use client'

import { useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { Fragment, useMemo } from 'react'

import { Link } from '~/i18n/navigation'
import { getNoteRouteParams } from '~/lib/note-route'
import { apiClient } from '~/lib/request'
import { routeBuilder, Routes } from '~/lib/route-builder'

type SeasonKey = 'spring' | 'summer' | 'autumn' | 'winter'

interface SeasonGroup {
  isCurrent: boolean
  items: Array<{
    id: string
    title: string
    created: string
    month: string
    href: string
  }>
  key: string
  label: string
}

function getSeasonFromMonth(month: number): SeasonKey {
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

function formatMonth(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'long' }).format(date)
}

function buildItemHref(item: any): string {
  if ('nid' in item) {
    return routeBuilder(Routes.Note, {
      ...getNoteRouteParams(item),
    })
  }
  return routeBuilder(Routes.Post, {
    category: item.category.slug,
    slug: item.slug,
  })
}

function organizeBySeasons(
  posts: any[],
  notes: any[],
  locale: string,
  t: (key: string) => string,
): SeasonGroup[] {
  const allItems = [...posts, ...notes]
    .map((item) => ({
      id: item.id,
      title: item.title,
      created: item.created,
      month: formatMonth(new Date(item.created), locale),
      href: buildItemHref(item),
      _date: new Date(item.created),
    }))
    .sort((a, b) => b._date.getTime() - a._date.getTime())

  if (allItems.length === 0) return []

  const now = new Date()
  const currentSeason = getSeasonFromMonth(now.getMonth() + 1)

  const seasonOrder: SeasonKey[] = ['spring', 'summer', 'autumn', 'winter']
  const seasonNameMap: Record<SeasonKey, string> = {
    spring: t('timeline_season_spring'),
    summer: t('timeline_season_summer'),
    autumn: t('timeline_season_autumn'),
    winter: t('timeline_season_winter'),
  }

  const grouped = new Map<string, typeof allItems>()

  for (const item of allItems) {
    const season = getSeasonFromMonth(item._date.getMonth() + 1)
    const year = item._date.getFullYear()
    const adjustedYear = item._date.getMonth() + 1 <= 2 ? year - 1 : year
    const key = `${adjustedYear}-${season}`
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(item)
  }

  const sortedKeys = Array.from(grouped.keys()).sort((a, b) => {
    const [yearA, seasonA] = a.split('-')
    const [yearB, seasonB] = b.split('-')
    if (yearA !== yearB) return Number(yearA) - Number(yearB)
    return (
      seasonOrder.indexOf(seasonA as SeasonKey) -
      seasonOrder.indexOf(seasonB as SeasonKey)
    )
  })

  const currentSeasonKey = `${now.getMonth() + 1 <= 2 ? now.getFullYear() - 1 : now.getFullYear()}-${currentSeason}`

  const result: SeasonGroup[] = []

  // Merge small leading seasons (< 3 items) into adjacent group
  let i = 0
  while (i < sortedKeys.length) {
    const key = sortedKeys[i]
    const items = grouped.get(key)!
    const [, season] = key.split('-') as [string, SeasonKey]
    const isCurrent = key === currentSeasonKey

    // Check if we should merge with next season
    if (!isCurrent && items.length < 3 && i + 1 < sortedKeys.length) {
      const nextKey = sortedKeys[i + 1]
      const nextItems = grouped.get(nextKey)!
      const [, nextSeason] = nextKey.split('-') as [string, SeasonKey]
      const nextIsCurrent = nextKey === currentSeasonKey

      result.push({
        key: `${key}+${nextKey}`,
        label: `${seasonNameMap[season]} · ${seasonNameMap[nextSeason]}`,
        isCurrent: nextIsCurrent,
        items: [...items, ...nextItems].sort(
          (a, b) => b._date.getTime() - a._date.getTime(),
        ),
      })
      i += 2
      continue
    }

    let label = seasonNameMap[season]
    if (isCurrent) {
      label += ` · ${t('timeline_season_current')}`
    }

    result.push({
      key,
      label,
      isCurrent,
      items: items.sort((a, b) => b._date.getTime() - a._date.getTime()),
    })
    i++
  }

  return result
}

// Text color classes by distance from current season (0 = farthest, last = current)
const SEASON_TEXT_CLASSES = [
  'text-neutral-5',
  'text-neutral-6',
  'text-neutral-8',
  'text-neutral-10',
]

export const HomePageTimeLine = () => {
  const t = useTranslations('home')
  const locale = useLocale()

  const { data: yearData } = useQuery({
    queryKey: ['home-timeline', locale],
    queryFn: async () => apiClient.activity.getLastYearPublication(),
  })

  const seasons = useMemo(
    () =>
      organizeBySeasons(
        yearData?.posts || [],
        yearData?.notes || [],
        locale,
        t,
      ),
    [yearData?.posts, yearData?.notes, locale, t],
  )

  const totalCount = useMemo(
    () => seasons.reduce((sum, s) => sum + s.items.length, 0),
    [seasons],
  )

  if (!yearData || seasons.length === 0) return null

  const getTextClass = (index: number) => {
    const offset = Math.max(0, SEASON_TEXT_CLASSES.length - seasons.length)
    return SEASON_TEXT_CLASSES[
      Math.min(index + offset, SEASON_TEXT_CLASSES.length - 1)
    ]
  }

  return (
    <section className="tl-scroll-container mx-auto mt-24 max-w-[1400px] px-6 lg:px-12">
      {/* Title */}
      <div className="tl-scroll-title mb-8 text-center font-serif text-base uppercase tracking-[4px] text-neutral-6">
        {t('timeline_title')}
      </div>

      {/* Desktop: horizontal season columns */}
      <div className="hidden lg:flex lg:gap-0">
        {seasons.map((season, index) => {
          const reverseIndex = seasons.length - 1 - index
          return (
            <Fragment key={season.key}>
              {index > 0 && (
                <div
                  className="tl-scroll-divider w-px shrink-0"
                  style={
                    {
                      '--col-i': reverseIndex,
                      background:
                        'linear-gradient(180deg, transparent, var(--color-accent-a15, rgba(51,166,184,0.15)) 30%, var(--color-accent-a15, rgba(51,166,184,0.15)) 70%, transparent)',
                    } as React.CSSProperties
                  }
                />
              )}
              <div
                className={`tl-scroll-col min-w-0 flex-1 px-4 first:pl-0 last:pr-0 ${getTextClass(index)}`}
                style={{ '--col-i': reverseIndex } as React.CSSProperties}
              >
                <SeasonColumn season={season} />
              </div>
            </Fragment>
          )
        })}
      </div>

      {/* Mobile: vertical stack, newest first */}
      <div className="flex flex-col gap-6 lg:hidden">
        {[...seasons].reverse().map((season, index) => {
          const originalIndex = seasons.length - 1 - index
          return (
            <div
              className={`tl-scroll-col border-l pl-3 ${getTextClass(originalIndex)}`}
              key={season.key}
              style={
                {
                  '--col-i': index,
                  borderColor: `color-mix(in oklch, var(--color-accent, #33a6b8) ${15 + originalIndex * 5}%, transparent)`,
                } as React.CSSProperties
              }
            >
              <SeasonColumn season={season} />
            </div>
          )
        })}
      </div>

      {/* Bottom stat */}
      <div className="tl-scroll-footer mt-4 border-t border-[rgba(0,0,0,0.04)] pt-3 text-right font-serif text-base italic text-neutral-6 dark:border-neutral-2">
        {t('timeline_year_total', { count: totalCount })}
      </div>
    </section>
  )
}

const SeasonColumn = ({ season }: { season: SeasonGroup }) => {
  return (
    <div>
      <div
        className={`mb-2.5 border-b pb-1.5 font-serif text-base tracking-[3px] ${
          season.isCurrent
            ? 'border-accent/15 text-accent'
            : 'border-[rgba(0,0,0,0.04)] text-neutral-6 dark:border-neutral-2'
        }`}
      >
        {season.label}
      </div>
      <div className="flex flex-col gap-1">
        {season.items.map((item) => (
          <Link
            className="group flex items-baseline justify-between gap-2 font-serif text-base leading-[1.7] text-inherit transition-colors duration-300 hover:text-accent"
            href={item.href}
            key={item.id}
          >
            <span className="min-w-0 truncate">{item.title}</span>
            <span className="shrink-0 text-sm italic text-neutral-6">
              {item.month}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
