'use client'

import { NavigationMenu } from '@base-ui/react/navigation-menu'
import type { AggregateTop } from '@mx-space/api-client'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import type { FC } from 'react'
import { useDeferredValue, useState } from 'react'

import { useActivity } from '~/atoms/hooks/activity'
import { useOwnerStatus } from '~/atoms/hooks/status'
import { RelativeTime } from '~/components/ui/relative-time/RelativeTime'
import { Link } from '~/i18n/navigation'
import { buildNotePath } from '~/lib/note-route'
import { useAggregationSelector } from '~/providers/root/aggregation-data-provider'
import { navigation } from '~/queries/definition/navigation'

import type { IHeaderMenu } from '../config'
import { useHeaderConfigValue } from './HeaderDataConfigureProvider'

interface DropdownProps {
  section: IHeaderMenu
}

// === Home: Owner status + Pages tag pills ===
export const HomeDropdownContent: FC<DropdownProps> = ({ section }) => {
  const t = useTranslations('common')
  const avatar = useAggregationSelector((data) => data.user.avatar)
  const ownerName = useAggregationSelector((data) => data.user.name)
  const ownerStatus = useOwnerStatus()
  const activity = useActivity()
  const deferredProcess = useDeferredValue(activity.process)
  const pages = section.subMenu || []

  return (
    <div className="w-[260px] p-3">
      <NavigationMenu.Link
        closeOnClick
        className="flex items-center gap-3 rounded p-1.5 transition hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
        render={<Link href="/" />}
      >
        {avatar && (
          <Image
            alt={ownerName ?? t('aria_site_owner_avatar')}
            className="shrink-0 rounded-full ring-1 ring-neutral-3"
            height={36}
            src={avatar}
            width={36}
          />
        )}
        <div className="min-w-0">
          <div className="text-sm font-medium">{ownerName}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-7">
            {ownerStatus ? (
              <>
                <span>{ownerStatus.emoji}</span>
                <span className="truncate">{ownerStatus.desc}</span>
              </>
            ) : deferredProcess?.name ? (
              <>
                <span className="inline-block size-1.5 shrink-0 rounded-full bg-green-400" />
                <span className="truncate">
                  {t('nav_dropdown_using', { name: deferredProcess.name })}
                </span>
              </>
            ) : (
              <span className="text-neutral-6">{t('nav_dropdown_online')}</span>
            )}
          </div>
        </div>
      </NavigationMenu.Link>

      {pages.length > 0 && (
        <div className="mt-2.5 border-t border-neutral-4/60 pt-2.5">
          <div className="flex flex-wrap gap-1.5">
            {pages.map((page) => (
              <NavigationMenu.Link
                closeOnClick
                className="rounded-full bg-neutral-2 px-2.5 py-1 text-[11px] text-neutral-7 transition hover:bg-black/[0.03] dark:hover:bg-white/[0.04] hover:text-neutral-9"
                key={page.path}
                render={<Link href={page.path} />}
              >
                {page.title}
              </NavigationMenu.Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// === Post: Categories with counts + hover preview ===
export const PostsDropdownContent: FC<DropdownProps> = ({ section }) => {
  const t = useTranslations('common')
  const locale = useLocale()
  const categories = useHeaderConfigValue('categoriesAtom')
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null)
  const activeSlug = hoveredSlug || categories?.[0]?.slug || null

  const { data: postMenuData } = useQuery({
    ...navigation.posts(locale, activeSlug),
    enabled: !!activeSlug,
  })

  const recentPosts = postMenuData?.recentPosts

  return (
    <div className="w-[380px] p-3">
      <div className="grid grid-cols-[140px_1fr] gap-3">
        {/* Left: Categories */}
        <div>
          <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-neutral-6">
            {t('nav_dropdown_categories')}
          </div>
          <div className="flex flex-col gap-0.5">
            {categories?.map((cat) => (
              <NavigationMenu.Link
                closeOnClick
                className="flex items-center justify-between rounded px-2.5 py-1.5 text-[13px] transition data-[hovered]:bg-black/[0.02] dark:data-[hovered]:bg-white/[0.04] data-[hovered]:text-neutral-9"
                data-hovered={activeSlug === cat.slug ? '' : undefined}
                key={cat.slug}
                render={<Link href={`/categories/${cat.slug}`} />}
                onMouseEnter={() => setHoveredSlug(cat.slug)}
              >
                <span>{cat.name}</span>
                <span className="text-[11px] text-neutral-6">{cat.count}</span>
              </NavigationMenu.Link>
            ))}
          </div>
        </div>

        {/* Right: Recent posts */}
        <div>
          <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-neutral-6">
            {categories?.find((c) => c.slug === activeSlug)?.name}
            {t('nav_dropdown_recent_suffix')}
          </div>
          <div className="flex flex-col gap-1">
            {recentPosts?.map((post) => (
              <NavigationMenu.Link
                closeOnClick
                className="rounded bg-neutral-2/60 px-2.5 py-2 transition hover:bg-black/[0.02] dark:hover:bg-white/[0.04] hover:text-neutral-9"
                key={post.id}
                render={<Link href={`/posts/${activeSlug}/${post.slug}`} />}
              >
                <div className="text-[13px] leading-snug">{post.title}</div>
                <div className="mt-0.5 text-[10px] text-neutral-6">
                  <RelativeTime date={post.created} />
                </div>
              </NavigationMenu.Link>
            ))}
            {!recentPosts?.length && (
              <div className="py-4 text-center text-[12px] text-neutral-6">
                ...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2 border-t border-neutral-4/60 pt-2">
        <NavigationMenu.Link
          closeOnClick
          className="flex items-center justify-between text-[11px] text-neutral-7 transition hover:text-neutral-9"
          render={<Link href={section.path} onClick={section.do} />}
        >
          <span>{t('nav_dropdown_view_all_posts')}</span>
          <span>
            {t('nav_dropdown_posts_count', {
              count: categories?.reduce((sum, c) => sum + c.count, 0) ?? 0,
            })}
          </span>
        </NavigationMenu.Link>
      </div>
    </div>
  )
}

// === Notes: Topics + recent notes (two columns) ===
export const NotesDropdownContent: FC<DropdownProps> = ({ section }) => {
  const t = useTranslations('common')
  const topics = useHeaderConfigValue('topicsAtom')
  const recentNotes = useHeaderConfigValue('recentNotesAtom')

  return (
    <div className="w-[380px] p-3">
      <div className="grid grid-cols-[140px_1fr] gap-3">
        {/* Left: Topics */}
        <div>
          <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-neutral-6">
            {t('nav_topics')}
          </div>
          {topics && topics.length > 0 ? (
            <div className="flex flex-col gap-0.5">
              {topics.map((topic) => (
                <NavigationMenu.Link
                  closeOnClick
                  className="flex items-center gap-2 rounded px-2.5 py-1.5 text-[13px] transition hover:bg-black/[0.02] dark:hover:bg-white/[0.04] hover:text-neutral-9"
                  key={topic.slug}
                  render={<Link href={`/notes/series/${topic.slug}`} />}
                >
                  {topic.icon && (
                    <img
                      alt=""
                      className="size-4 shrink-0 rounded object-cover"
                      src={topic.icon}
                    />
                  )}
                  <span className="truncate">{topic.name}</span>
                </NavigationMenu.Link>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-[12px] text-neutral-6">
              ...
            </div>
          )}
        </div>

        {/* Right: Recent notes */}
        <div className="min-w-0">
          <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-neutral-6">
            {t('nav_dropdown_recent_notes')}
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            {recentNotes?.map((note) => (
              <NavigationMenu.Link
                closeOnClick
                className="block min-w-0 flex flex-col rounded bg-neutral-2/60 px-2.5 py-2 transition hover:bg-black/[0.02] dark:hover:bg-white/[0.04] hover:text-neutral-9"
                key={note.nid}
                render={<Link href={buildNotePath(note)} />}
              >
                <div className="min-w-0 truncate text-[13px] leading-snug">
                  {note.title}
                </div>
                <div className="mt-0.5 text-[10px] text-neutral-6">
                  <RelativeTime date={note.created} />
                </div>
              </NavigationMenu.Link>
            ))}
            {!recentNotes?.length && (
              <div className="py-4 text-center text-[12px] text-neutral-6">
                ...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-neutral-4/60 pt-2">
        <NavigationMenu.Link
          closeOnClick
          className="text-[11px] text-neutral-7 transition hover:text-neutral-9"
          render={<Link href={section.path} />}
        >
          {t('nav_dropdown_view_all_notes')}
        </NavigationMenu.Link>
        <NavigationMenu.Link
          closeOnClick
          className="text-[11px] text-neutral-7 transition hover:text-neutral-9"
          render={<Link href="/notes/series" />}
        >
          {t('nav_dropdown_view_all_topics')}
        </NavigationMenu.Link>
      </div>
    </div>
  )
}

// === Timeline: Category list + recent entries ===
export const TimelineDropdownContent: FC<DropdownProps> = ({ section }) => {
  const t = useTranslations('common')
  const items = section.subMenu || []
  const topData = useHeaderConfigValue('topDataAtom')

  const recentEntries = mergeAndSortTopEntries(topData)

  return (
    <div className="w-[320px] p-2.5">
      {/* Top: subMenu items horizontal */}
      <div className="flex gap-1">
        {items.map((item) => {
          const isExternal = item.path.startsWith('http')
          return (
            <NavigationMenu.Link
              closeOnClick
              className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded px-3 py-2 text-[13px] transition hover:bg-black/[0.02] dark:hover:bg-white/[0.04] hover:text-neutral-9"
              key={item.path}
              render={
                isExternal ? (
                  <a
                    href={item.path}
                    rel="noopener noreferrer"
                    target="_blank"
                  />
                ) : (
                  <Link href={item.path} />
                )
              }
            >
              {!!item.icon && (
                <span className="flex shrink-0 items-center justify-center text-sm opacity-70">
                  {item.icon}
                </span>
              )}
              <span>
                {item.titleKey ? t(item.titleKey as any) : item.title}
              </span>
            </NavigationMenu.Link>
          )
        })}
      </div>

      {/* Bottom: recent entries */}
      <div className="mt-2 border-t border-neutral-4/60 pt-2">
        <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-neutral-6">
          {t('nav_dropdown_recent_activity')}
        </div>
        <div className="flex flex-col gap-1">
          {recentEntries.map((entry) => (
            <NavigationMenu.Link
              closeOnClick
              className="rounded bg-neutral-2/60 px-2.5 py-2 transition hover:bg-black/[0.02] dark:hover:bg-white/[0.04] hover:text-neutral-9"
              key={entry.id}
              render={<Link href={entry.href} />}
            >
              <div className="flex items-center justify-between">
                <div className="truncate text-[13px] leading-snug">
                  {entry.title}
                </div>
                <span className="ml-2 shrink-0 text-[10px] text-neutral-6">
                  {entry.type === 'post' ? t('nav_posts') : t('nav_notes')}
                </span>
              </div>
              <div className="mt-0.5 text-[10px] text-neutral-6">
                <RelativeTime date={entry.created} />
              </div>
            </NavigationMenu.Link>
          ))}
          {recentEntries.length === 0 && (
            <div className="py-4 text-center text-[12px] text-neutral-6">
              ...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface TimelineEntry {
  created: string
  href: string
  id: string
  title: string
  type: 'post' | 'note'
}

function mergeAndSortTopEntries(
  topData: AggregateTop | null | undefined,
): TimelineEntry[] {
  if (!topData) return []
  const entries: TimelineEntry[] = []

  for (const post of topData.posts ?? []) {
    entries.push({
      id: post.id,
      title: post.title,
      created: post.created,
      href: `/posts/${post.category.slug}/${post.slug}`,
      type: 'post',
    })
  }
  for (const note of topData.notes ?? []) {
    entries.push({
      id: note.id,
      title: note.title,
      created: note.created,
      href: buildNotePath(note),
      type: 'note',
    })
  }

  entries.sort(
    (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime(),
  )
  return entries.slice(0, 4)
}

// === More: Single column with descriptions ===
export const MoreDropdownContent: FC<DropdownProps> = ({ section }) => {
  const t = useTranslations('common')
  const items = section.subMenu || []

  return (
    <div className="p-2">
      <div className="flex flex-col gap-0.5">
        {items.map((item) => {
          const isExternal = item.path.startsWith('http')
          return (
            <NavigationMenu.Link
              closeOnClick
              className="flex items-center gap-3 rounded px-3 py-2.5 text-left transition hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
              key={item.path}
              render={
                isExternal ? (
                  <a
                    href={item.path}
                    rel="noopener noreferrer"
                    target="_blank"
                  />
                ) : (
                  <Link href={item.path} />
                )
              }
            >
              {!!item.icon && (
                <span className="flex w-5 shrink-0 items-center justify-center text-base opacity-70">
                  {item.icon}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[13px]">
                  {item.titleKey ? t(item.titleKey as any) : item.title}
                </div>
                {(item.descriptionKey || item.description) && (
                  <div className="text-[11px] text-neutral-7">
                    {item.descriptionKey
                      ? t(item.descriptionKey as any)
                      : item.description}
                  </div>
                )}
              </div>
            </NavigationMenu.Link>
          )
        })}
      </div>
    </div>
  )
}

export const dropdownTypeMap: Record<string, FC<DropdownProps>> = {
  Home: HomeDropdownContent,
  Post: PostsDropdownContent,
  Note: NotesDropdownContent,
  Timeline: TimelineDropdownContent,
  More: MoreDropdownContent,
}
