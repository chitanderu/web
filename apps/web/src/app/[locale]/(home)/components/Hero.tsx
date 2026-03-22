'use client'

import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { Fragment, useEffect, useMemo, useRef } from 'react'

import { isSupportIcon, SocialIcon } from '~/components/modules/home/SocialIcon'
import { fetchQuoteByLocale } from '~/components/modules/shared/Hitokoto'
import { MotionButtonBase } from '~/components/ui/button'
import { NumberSmoothTransition } from '~/components/ui/number-transition/NumberSmoothTransition'
import { Link } from '~/i18n/navigation'
import { clsxm } from '~/lib/helper'
import { noopObj } from '~/lib/noop'
import { buildNotePath } from '~/lib/note-route'
import { apiClient } from '~/lib/request'
import { routeBuilder, Routes } from '~/lib/route-builder'
import {
  useAggregationSelector,
  useAppConfigSelector,
} from '~/providers/root/aggregation-data-provider'

import { useHomeQueryData } from '../useHomeQueryData'

// --- Helpers ---

const isFirstVisit = () => {
  if (typeof window === 'undefined') return true
  return !sessionStorage.getItem('hero-entered')
}

const markVisited = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('hero-entered', '1')
  }
}

const cn = (shouldAnimate: boolean, cls: string) => (shouldAnimate ? cls : '')

// --- Main Component ---

export const Hero = () => {
  const tCommon = useTranslations('common')

  const { title, description } = useAppConfigSelector((config) => ({
    ...config.hero,
  }))!
  const siteOwner = useAggregationSelector((agg) => agg.user)
  const { avatar, socialIds } = siteOwner || {}

  const firstVisitRef = useRef(isFirstVisit())
  const shouldAnimate = firstVisitRef.current

  useEffect(() => {
    if (!shouldAnimate) {
      markVisited()
      return
    }
    const timer = setTimeout(() => markVisited(), 1500)
    return () => clearTimeout(timer)
  }, [shouldAnimate])

  const titleElements = useMemo(
    () =>
      title.template.map((t, i) =>
        t.class ? (
          <span className={t.class} key={i}>
            {t.text}
          </span>
        ) : (
          <Fragment key={i}>{t.text}</Fragment>
        ),
      ),
    [title.template],
  )

  return (
    <div className="hero-scroll-container relative mx-auto min-w-0 max-w-[1400px] px-6 lg:px-12 xl:px-16 2xl:px-24">
      {/* Background lights */}
      <div className="hero-exit-bg">
        <div
          className={clsxm(
            'hero-light-drift-slow pointer-events-none absolute -z-10 rounded-full bg-[radial-gradient(ellipse,rgba(255,228,180,0.35)_0%,transparent_65%)] dark:bg-[radial-gradient(ellipse,rgba(180,200,255,0.15)_0%,transparent_65%)] -top-16 right-0 size-[250px] lg:-right-20 lg:-top-32 lg:size-[500px]',
            cn(shouldAnimate, 'hero-enter-bg-1'),
          )}
        />
        <div
          className={clsxm(
            'hero-light-drift-fast pointer-events-none absolute -z-10 rounded-full bg-accent/[0.06] blur-3xl bottom-10 left-0 size-[150px] lg:left-5 lg:size-[300px]',
            cn(shouldAnimate, 'hero-enter-bg-2'),
          )}
        />
      </div>

      {/* Mobile: flex-col layout */}
      <div className="flex flex-col pb-8 pt-20 lg:hidden">
        <div
          className={clsxm(
            'hero-exit-text mb-4 flex items-center gap-4',
            cn(shouldAnimate, 'hero-enter-title'),
          )}
        >
          {avatar && (
            <Image
              alt={tCommon('aria_site_owner_avatar')}
              className="shrink-0 rounded-full border border-neutral-4"
              height={48}
              src={avatar}
              width={48}
            />
          )}
          <h1 className="text-2xl font-medium leading-snug text-neutral-9">
            {titleElements}
          </h1>
        </div>

        <div
          className={clsxm(
            'hero-exit-text mb-4 text-sm leading-relaxed text-neutral-7',
            cn(shouldAnimate, 'hero-enter-desc'),
          )}
        >
          {description}
        </div>

        <div className="hero-exit-meta">
          <HeroWritingStats layout="horizontal" shouldAnimate={shouldAnimate} />
        </div>

        <div className="hero-exit-meta mt-4">
          <HeroSocialIcons
            shouldAnimate={shouldAnimate}
            socialIds={socialIds}
          />
        </div>

        <div className="hero-exit-meta mt-6 border-t border-neutral-4/50 pt-5">
          <HeroRecentWriting shouldAnimate={shouldAnimate} />
        </div>

        <div className="hero-exit-meta mt-4">
          <HeroHitokoto shouldAnimate={shouldAnimate} />
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden flex-col py-16 lg:flex lg:min-h-[560px]">
        <div className="flex flex-1 items-center justify-between">
          <div className="hero-exit-text flex-1">
            <h1
              className={clsxm(
                'text-2xl font-medium leading-snug text-neutral-9 lg:text-[2.5rem] lg:leading-tight',
                cn(shouldAnimate, 'hero-enter-title'),
              )}
            >
              {titleElements}
            </h1>
            <div
              className={clsxm(
                'mt-3 text-lg text-neutral-6',
                cn(shouldAnimate, 'hero-enter-desc'),
              )}
            >
              {description}
            </div>

            <div className="mt-6 flex items-center gap-6">
              <HeroWritingStats
                layout="horizontal"
                shouldAnimate={shouldAnimate}
              />
              <div className="h-5 w-px bg-neutral-4" />
              <HeroSocialIcons
                shouldAnimate={shouldAnimate}
                socialIds={socialIds}
              />
            </div>
          </div>

          {avatar && (
            <div
              className={clsxm(
                'hero-exit-avatar ml-12 shrink-0',
                cn(shouldAnimate, 'hero-enter-avatar'),
              )}
            >
              <Image
                alt={tCommon('aria_site_owner_avatar')}
                className="rounded-full border border-neutral-4 shadow-sm"
                height={80}
                src={avatar}
                width={80}
              />
            </div>
          )}
        </div>

        <div className="hero-exit-meta flex items-start justify-between gap-12 border-t border-neutral-4/50 pt-6">
          <HeroRecentWriting shouldAnimate={shouldAnimate} />
          <HeroHitokoto shouldAnimate={shouldAnimate} />
        </div>
      </div>
    </div>
  )
}

// --- Sub-components ---

const HeroWritingStats = ({
  layout,
  shouldAnimate,
}: {
  layout: 'horizontal' | 'vertical'
  shouldAnimate: boolean
}) => {
  const t = useTranslations('home')
  const locale = useLocale()
  const { data } = useQuery({
    queryKey: ['site-info', locale],
    queryFn: () =>
      apiClient.aggregate.proxy.site_info.get<{
        postCount: number
        noteCount: number
        totalWordCount: number
        firstPublishDate: string | null
      }>(),
    staleTime: 5 * 60 * 1000,
  })

  const articleCount = (data?.postCount ?? 0) + (data?.noteCount ?? 0)
  const wordCountWan = data?.totalWordCount
    ? Math.round(data.totalWordCount / 10000)
    : 0
  const days = data?.firstPublishDate
    ? Math.floor(
        (Date.now() - new Date(data.firstPublishDate).getTime()) / 86400000,
      )
    : 0

  const items = [
    { value: articleCount, label: t('hero_stat_posts') },
    { value: wordCountWan, label: t('hero_stat_words_unit') },
    { value: days, label: t('hero_stat_days') },
  ]

  return (
    <div
      className={clsx(
        layout === 'vertical'
          ? 'flex flex-col gap-1 text-right font-serif italic'
          : 'flex gap-5 font-serif italic',
        'text-xs text-neutral-6',
        cn(shouldAnimate, 'hero-enter-stats'),
      )}
    >
      {items.map((item, index) => (
        <Fragment key={item.label}>
          {layout === 'horizontal' && index > 0 && (
            <span className="text-neutral-6">·</span>
          )}
          <div>
            <span className="not-italic text-2xl font-medium text-neutral-7">
              <NumberSmoothTransition>{item.value}</NumberSmoothTransition>
            </span>{' '}
            {item.label}
          </div>
        </Fragment>
      ))}
    </div>
  )
}

const HeroRecentWriting = ({ shouldAnimate }: { shouldAnimate: boolean }) => {
  const t = useTranslations('home')
  const homeData = useHomeQueryData()
  const { posts = [], notes = [] } = homeData || {}

  const recentItems = useMemo(() => {
    const all = [
      ...posts.map((p: any) => ({
        title: p.title,
        href: routeBuilder(Routes.Post, {
          category: p.category.slug,
          slug: p.slug,
        }),
        created: p.created,
      })),
      ...notes.map((n: any) => ({
        title: n.title,
        href: buildNotePath(n),
        created: n.created,
      })),
    ]
    return all
      .sort(
        (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime(),
      )
      .slice(0, 3)
  }, [posts, notes])

  if (!homeData) {
    return (
      <div className={cn(shouldAnimate, 'hero-enter-writing')}>
        <div className="mb-3 text-xs uppercase tracking-widest text-neutral-6">
          {t('hero_recently_writing')}
        </div>
        <div className="flex flex-col gap-1.5">
          {[65, 80, 55].map((w) => (
            <div
              className="h-4 animate-pulse rounded bg-neutral-3/50"
              key={w}
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (recentItems.length === 0) return null

  return (
    <div className={cn(shouldAnimate, 'hero-enter-writing')}>
      <div className="mb-3 text-xs uppercase tracking-widest text-neutral-6">
        {t('hero_recently_writing')}
      </div>
      <div className="flex flex-col gap-1.5">
        {recentItems.map((item) => (
          <Link
            className="block border-b border-neutral-4/40 pb-1.5 text-base text-neutral-7 transition-colors duration-300 hover:text-accent"
            href={item.href}
            key={item.href}
          >
            {item.title}
          </Link>
        ))}
      </div>
    </div>
  )
}

const HeroSocialIcons = ({
  socialIds,
  shouldAnimate,
}: {
  socialIds: Record<string, string> | undefined
  shouldAnimate: boolean
}) => (
  <div className={clsxm('flex gap-4', cn(shouldAnimate, 'hero-enter-social'))}>
    {Object.entries(socialIds || noopObj).map(([type, id]: any) => {
      if (!isSupportIcon(type)) return null
      return <SocialIcon id={id} key={type} type={type} variant="mono" />
    })}
  </div>
)

const HeroHitokoto = ({ shouldAnimate }: { shouldAnimate: boolean }) => {
  const t = useTranslations('home')
  const { custom, random } = useAppConfigSelector(
    (config) => config.hero.hitokoto || {},
  )!

  return (
    <div
      className={clsxm(
        'max-w-[45ch] font-serif text-sm italic text-neutral-6 lg:text-right',
        cn(shouldAnimate, 'hero-enter-hitokoto'),
      )}
    >
      {random ? (
        <RemoteHitokotoQuote />
      ) : (
        <>「{custom ?? t('hero_default_hitokoto')}」</>
      )}
    </div>
  )
}

const RemoteHitokotoQuote = () => {
  const locale = useLocale()
  const {
    data: hitokoto,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['hitokoto', locale],
    queryFn: () => fetchQuoteByLocale(locale),
    refetchInterval: 300000,
    staleTime: Infinity,
    refetchOnMount: 'always',
    meta: { persist: true },
  })

  if (isLoading || !hitokoto) return null

  return (
    <span className="group inline-flex items-center gap-1.5">
      「{hitokoto}」
      <MotionButtonBase
        disabled={isRefetching}
        className={clsxm(
          'opacity-0 transition-opacity duration-200 group-hover:opacity-100',
          isRefetching && 'animate-spin opacity-100',
        )}
        onClick={() => refetch()}
      >
        <i className="i-mingcute-refresh-2-line text-[10px]" />
      </MotionButtonBase>
    </span>
  )
}
