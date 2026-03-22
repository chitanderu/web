'use client'

import { m } from 'motion/react'
import { useTranslations } from 'next-intl'

import { Divider } from '~/components/ui/divider'
import { RelativeTime } from '~/components/ui/relative-time'
import { Spring } from '~/constants/spring'
import { Link } from '~/i18n/navigation'
import { getNoteRouteParams } from '~/lib/note-route'
import { routeBuilder, Routes } from '~/lib/route-builder'

import { useHomeQueryData } from '../useHomeQueryData'

export const ActivityPostList = () => {
  const t = useTranslations('post')
  const { notes, posts } = useHomeQueryData()
  return (
    <m.section
      className="mt-8 flex flex-col gap-4 lg:mt-0"
      initial={{ opacity: 0.0001, y: 50 }}
      transition={Spring.presets.snappy}
      viewport={{ once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-2xl font-medium leading-loose">
        {t('recent_posts')}
      </h2>
      <ul className="shiro-timeline mt-4">
        {posts.map((post) => (
          <li className="flex min-w-0 justify-between" key={post.id}>
            <Link
              prefetch
              className="min-w-0 shrink truncate"
              href={routeBuilder(Routes.Post, {
                category: post.category.slug,
                slug: post.slug,
              })}
            >
              {post.title}
            </Link>

            <span className="ml-2 shrink-0 self-end text-xs opacity-70">
              <RelativeTime
                date={post.created}
                displayAbsoluteTimeAfterDay={180}
              />
            </span>
          </li>
        ))}
      </ul>

      <Link
        className="flex items-center justify-end opacity-70 duration-200 hover:text-accent"
        href={routeBuilder(Routes.Posts, {})}
        onClick={() => (window.__POST_LIST_ANIMATED__ = true)}
      >
        <i className="i-mingcute-arrow-right-circle-line" />
        <span className="ml-2">{t('more')}</span>
      </Link>

      <Divider />
      <h2 className="text-2xl font-medium leading-loose">
        {t('recent_notes')}
      </h2>
      <ul className="shiro-timeline mt-4">
        {notes.map((note) => (
          <li className="flex min-w-0 justify-between" key={note.id}>
            <Link
              className="min-w-0 shrink truncate"
              href={routeBuilder(Routes.Note, {
                ...getNoteRouteParams(note),
              })}
            >
              {note.title}
            </Link>

            <span className="ml-2 shrink-0 self-end text-xs opacity-70">
              <RelativeTime
                date={note.created}
                displayAbsoluteTimeAfterDay={180}
              />
            </span>
          </li>
        ))}
      </ul>
      <Link
        className="flex items-center justify-end opacity-70 duration-200 hover:text-accent"
        href={routeBuilder(Routes.Timelime, { type: 'note' })}
      >
        <i className="i-mingcute-arrow-right-circle-line" />
        <span className="ml-2">{t('more')}</span>
      </Link>
    </m.section>
  )
}
