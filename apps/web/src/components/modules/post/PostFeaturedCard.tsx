'use client'

import type { PostListItem } from '@mx-space/api-client'
import clsx from 'clsx'
import { useTranslations } from 'next-intl'
import { type FC, Fragment } from 'react'
import RemoveMarkdown from 'remove-markdown'

import { TagDetailModal } from '~/components/modules/post/fab/PostTagsFAB'
import { TranslatedBadge } from '~/components/modules/translation/TranslatedBadge'
import { useModalStack } from '~/components/ui/modal'
import { NumberSmoothTransition } from '~/components/ui/number-transition/NumberSmoothTransition'
import { RelativeTime } from '~/components/ui/relative-time'
import { Link, useRouter } from '~/i18n/navigation'
import { routeBuilder, Routes } from '~/lib/route-builder'

export const PostFeaturedCard: FC<{ data: PostListItem }> = ({ data }) => {
  const t = useTranslations('common')
  const router = useRouter()
  const { present } = useModalStack()
  const categorySlug = data.category?.slug
  const postLink = `/posts/${categorySlug}/${data.slug}`
  const hasImage = data.images?.length > 0 && data.images[0].src
  const summary =
    data.summary || (data.text ? RemoveMarkdown(data.text).slice(0, 150) : '')

  return (
    <Link
      href={postLink}
      prefetch={false}
      className={clsx(
        'mt-5 block rounded-md p-5 lg:-mx-4',
        'bg-white/50 border border-black/5',
        'dark:bg-white/5 dark:border-white/5',
        'transition-all duration-250',
        'hover:shadow-[0_2px_16px_rgba(0,0,0,0.05)] hover:-translate-y-px',
      )}
    >
      <div className={clsx('flex gap-4', hasImage && 'lg:flex-row')}>
        <div className="min-w-0 flex-1">
          {!!data.pin && (
            <div className="mb-2 text-[11px] tracking-[1px] text-accent">
              {t('pinned_label')}
            </div>
          )}
          <h2 className="flex items-baseline gap-2 text-lg font-medium text-neutral-9">
            <span>{data.title}</span>
            {data.isTranslated && data.translationMeta && (
              <TranslatedBadge translationMeta={data.translationMeta} />
            )}
          </h2>
          {summary && (
            <p className="mt-2 line-clamp-2 text-sm leading-[1.7] text-neutral-5">
              {summary}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-neutral-4">
                <RelativeTime date={data.created} />
              </span>
              {data.modified && (
                <span className="text-neutral-3">{t('edited')}</span>
              )}
              {data.category && (
                <>
                  <span className="text-neutral-3">·</span>
                  <button
                    className="shiro-link--underline text-accent"
                    onClick={(e) => {
                      e.preventDefault()
                      router.push(
                        routeBuilder(Routes.Category, {
                          slug: data.category!.slug,
                        }),
                      )
                    }}
                  >
                    {data.category.name}
                  </button>
                  {data.tags?.length ? (
                    <>
                      {' / '}
                      {data.tags.map((tag, index) => (
                        <Fragment key={tag}>
                          <button
                            className="shiro-link--underline text-accent"
                            onClick={(e) => {
                              e.preventDefault()
                              present({
                                content: () => <TagDetailModal name={tag} />,
                                title: `Tag: ${tag}`,
                              })
                            }}
                          >
                            {tag}
                          </button>
                          {index < data.tags!.length - 1 && ', '}
                        </Fragment>
                      ))}
                    </>
                  ) : null}
                </>
              )}
            </div>
            <div className="flex items-center gap-2.5 text-[11px] text-neutral-3">
              {!!data.count?.read && (
                <span className="flex items-center gap-1">
                  <i className="i-mingcute-eye-2-line" />
                  <NumberSmoothTransition>
                    {data.count.read}
                  </NumberSmoothTransition>
                </span>
              )}
              {!!data.count?.like && (
                <span className="flex items-center gap-1">
                  <i className="i-mingcute-heart-line" />
                  <NumberSmoothTransition>
                    {data.count.like}
                  </NumberSmoothTransition>
                </span>
              )}
            </div>
          </div>
        </div>
        {hasImage && (
          <div
            className="hidden size-[100px] shrink-0 rounded bg-cover bg-center bg-no-repeat lg:block"
            style={{ backgroundImage: `url(${data.images[0].src})` }}
          />
        )}
      </div>
    </Link>
  )
}
