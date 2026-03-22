'use client'

import type { PostModel } from '@mx-space/api-client'
import { useTranslations } from 'next-intl'
import { Fragment } from 'react'

import { MotionButtonBase } from '~/components/ui/button'
import { FloatPopover } from '~/components/ui/float-popover'
import { useModalStack } from '~/components/ui/modal'
import { NumberSmoothTransition } from '~/components/ui/number-transition/NumberSmoothTransition'
import { RelativeTime } from '~/components/ui/relative-time'
import { useIsClient } from '~/hooks/common/use-is-client'
import { useRouter } from '~/i18n/navigation'
import { clsxm } from '~/lib/helper'
import { routeBuilder, Routes } from '~/lib/route-builder'

import { TagDetailModal } from './fab/PostTagsFAB'

const Dot = () => <span className="text-neutral-5">·</span>

export const PostMetaBar: Component<{
  meta: Partial<
    Pick<PostModel, 'created' | 'modified' | 'category' | 'tags' | 'count'>
  >
}> = ({ className, meta, children }) => {
  const t = useTranslations('common')
  const { present } = useModalStack()
  const router = useRouter()
  const isClient = useIsClient()
  return (
    <div
      className={clsxm(
        'flex min-w-0 shrink grow flex-wrap items-center gap-2 text-xs text-neutral-6',
        className,
      )}
    >
      {!!meta.created && (
        <span>
          <RelativeTime date={meta.created} />
        </span>
      )}

      {meta.modified ? (
        isClient ? (
          <>
            <Dot />
            <FloatPopover
              mobileAsSheet
              as="span"
              triggerElement={t('edited')}
              type="tooltip"
            >
              {t('edited_at')} <RelativeTime date={meta.modified} />
            </FloatPopover>
          </>
        ) : (
          <>
            <Dot />
            <span>{t('edited')}</span>
          </>
        )
      ) : null}

      {!!meta.category && (
        <>
          <Dot />
          <span className="min-w-0 truncate">
            <MotionButtonBase
              className="shiro-link--underline font-normal text-accent"
              onClick={() =>
                !!meta.category &&
                router.push(
                  routeBuilder(Routes.Category, {
                    slug: meta.category.slug,
                  }),
                )
              }
            >
              {meta.category.name}
            </MotionButtonBase>

            {meta.tags?.length ? (
              <>
                {' / '}
                {meta.tags.map((tag, index) => {
                  const isLast = index === meta.tags!.length - 1
                  return (
                    <Fragment key={tag}>
                      <button
                        className="shiro-link--underline"
                        onClick={() =>
                          present({
                            content: () => <TagDetailModal name={tag} />,
                            title: `Tag: ${tag}`,
                          })
                        }
                      >
                        {tag}
                      </button>
                      {!isLast && ', '}
                    </Fragment>
                  )
                })}
              </>
            ) : null}
          </span>
        </>
      )}

      {!!meta.count?.read && (
        <>
          <Dot />
          <span>
            <NumberSmoothTransition>{meta.count.read}</NumberSmoothTransition>{' '}
            {t('meta_reads', { count: '' }).trim()}
          </span>
        </>
      )}

      {!!meta.count?.like && (
        <>
          <Dot />
          <span>
            <NumberSmoothTransition>{meta.count.like}</NumberSmoothTransition>{' '}
            {t('meta_likes', { count: '' }).trim()}
          </span>
        </>
      )}

      {children}
    </div>
  )
}
