'use client'

import type { PostListItem as PostListItemType } from '@mx-space/api-client'
import clsx from 'clsx'
import { useTranslations } from 'next-intl'
import { type FC,Fragment } from 'react'
import RemoveMarkdown from 'remove-markdown'

import { TagDetailModal } from '~/components/modules/post/fab/PostTagsFAB'
import { TranslatedBadge } from '~/components/modules/translation/TranslatedBadge'
import { useModalStack } from '~/components/ui/modal'
import { NumberSmoothTransition } from '~/components/ui/number-transition/NumberSmoothTransition'
import { RelativeTime } from '~/components/ui/relative-time'
import { Link,useRouter  } from '~/i18n/navigation'
import { routeBuilder, Routes } from '~/lib/route-builder'

export const PostListItem: FC<{ data: PostListItemType }> = ({ data }) => {
  const t = useTranslations('common')
  const router = useRouter()
  const { present } = useModalStack()
  const categorySlug = data.category?.slug
  const postLink = `/posts/${categorySlug}/${data.slug}`
  const summary =
    data.summary || (data.text ? RemoveMarkdown(data.text).slice(0, 80) : '')

  return (
    <Link
      href={postLink}
      prefetch={false}
      className={clsx(
        'block rounded-lg px-4 py-3.5 -mx-4 my-1',
        'transition-all duration-250',
        'hover:bg-white/70 hover:shadow-[0_2px_12px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] hover:-translate-y-px',
        'dark:hover:bg-white/5',
      )}
    >
      <div className="flex items-baseline gap-2">
        <h3 className="text-lg font-medium text-neutral-9">{data.title}</h3>
        {data.isTranslated && data.translationMeta && (
          <TranslatedBadge translationMeta={data.translationMeta} />
        )}
      </div>

      {summary && (
        <p className="mt-1 line-clamp-1 text-sm leading-normal text-neutral-5">
          {summary}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between">
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
              <NumberSmoothTransition>{data.count.read}</NumberSmoothTransition>
            </span>
          )}
          {!!data.count?.like && (
            <span className="flex items-center gap-1">
              <i className="i-mingcute-heart-line" />
              <NumberSmoothTransition>{data.count.like}</NumberSmoothTransition>
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
