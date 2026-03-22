'use client'

import type { RecentlyModel } from '@mx-space/api-client'
import {
  RecentlyAttitudeEnum,
  RecentlyAttitudeResultEnum,
  RecentlyTypeEnum,
} from '@mx-space/api-client'
import type { InfiniteData } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { produce } from 'immer'
import { useTranslations } from 'next-intl'
import type { FC } from 'react'
import { memo, useMemo, useState } from 'react'

import { useIsOwnerLogged } from '~/atoms/hooks/owner'
import { CommentBoxRootLazy, CommentsLazy } from '~/components/modules/comment'
import { PeekLink } from '~/components/modules/peek/PeekLink'
import { StyledButton } from '~/components/ui/button'
import { Divider } from '~/components/ui/divider'
import { FloatPopover } from '~/components/ui/float-popover'
import { Markdown } from '~/components/ui/markdown'
import { BlockLinkRenderer } from '~/components/ui/markdown/renderers/LinkRenderer'
import { useModalStack } from '~/components/ui/modal'
import { NumberSmoothTransition } from '~/components/ui/number-transition/NumberSmoothTransition'
import { RelativeTime } from '~/components/ui/relative-time'
import { Link, usePathname } from '~/i18n/navigation'
import { clsxm } from '~/lib/helper'
import { sample } from '~/lib/lodash'
import { apiClient } from '~/lib/request'
import { routeBuilder, Routes } from '~/lib/route-builder'
import { toast } from '~/lib/toast'
import { urlBuilder } from '~/lib/url-builder'
import { useAggregationSelector } from '~/providers/root/aggregation-data-provider'

import { QUERY_KEY } from './constants'
import { MetadataCard } from './metadata-card'

export const ThinkingItem: FC<{
  item: RecentlyModel
}> = memo(({ item }) => {
  const t = useTranslations('common')
  const owner = useAggregationSelector((a) => a.user)!

  const handleUp = (id: string) => {
    apiClient.recently
      .attitude(id, RecentlyAttitudeEnum.Up)
      .then(({ code }) => {
        if (code === RecentlyAttitudeResultEnum.Inc) {
          toast.success(sample(['(￣▽￣*) ゞ', '(＾▽＾)']))
        } else {
          toast.success('[○･｀Д´･○]')
        }
      })
  }

  const handleDown = (id: string) => {
    apiClient.recently
      .attitude(id, RecentlyAttitudeEnum.Down)
      .then(({ code }) => {
        if (code === RecentlyAttitudeResultEnum.Inc) {
          toast.success('(╥_╥)')
        } else {
          toast.success('ヽ (・∀・) ﾉ')
        }
      })
  }

  const { present } = useModalStack()

  const isSingleLinkContent = useMemo(() => {
    const trimmedContent = item.content.trim()
    return (
      trimmedContent.startsWith('http') &&
      trimmedContent.split('\n').length === 1
    )
  }, [item.content])

  const MarkdownContent = (
    <div
      className={clsx(
        'relative inline-block rounded-xl p-3 text-neutral-9',
        'rounded-tl-sm bg-neutral-7/5 dark:bg-neutral-6/20',
        'max-w-full overflow-auto',
      )}
    >
      <Markdown forceBlock variant="comment">
        {item.content}
      </Markdown>

      {!!item.ref && (
        <div>
          <RefPreview refModel={item.ref} />
        </div>
      )}
    </div>
  )
  const pathname = usePathname()
  const isInThinkingDetailRoute = pathname.includes(Routes.ThinkingItem)
  return (
    <li className="group mb-8 mt-[50px] flex flex-col gap-2" key={item.id}>
      <div className="flex gap-4">
        <img
          className="size-[40px] rounded-full ring-2 ring-neutral-4"
          src={owner.avatar}
        />

        <div className="flex flex-col items-center self-start md:flex-row md:gap-2">
          <span className="self-start text-lg font-medium md:self-auto">
            {owner.name}
          </span>

          <span className="text-xs opacity-80 md:-translate-y-1 md:self-end">
            <RelativeTime date={item.created} />
            {item.modified && (
              <FloatPopover
                mobileAsSheet
                as="span"
                triggerElement={t('edited')}
                type="tooltip"
                wrapperClassName="text-xs ml-1"
              >
                {t('edited_at')} <RelativeTime date={item.modified} />
              </FloatPopover>
            )}
            {item.type && item.type !== RecentlyTypeEnum.Text && (
              <TypeBadge type={item.type} />
            )}
          </span>
        </div>
      </div>
      <div
        className={clsxm(
          'min-w-0 max-w-full',
          'mt-2 pl-4 md:mt-0 md:-translate-y-4 md:pl-14',
        )}
      >
        <div className="relative w-full min-w-0">
          {item.content ? (
            isSingleLinkContent ? (
              <BlockLinkRenderer
                fallback={MarkdownContent}
                href={item.content}
              />
            ) : (
              MarkdownContent
            )
          ) : null}

          {item.type && item.type !== RecentlyTypeEnum.Text && (
            <MetadataCard metadata={item.metadata} type={item.type} />
          )}
        </div>

        <div
          className={clsx(
            'mt-4 space-x-8 opacity-50 duration-200 hover:opacity-100',
            '[&_button]:center [&_button:hover]:text-accent [&_button]:inline-flex [&_button]:space-x-1 [&_button]:text-sm',
            '[&_button]:-my-5 [&_button]:-ml-5 [&_button]:p-5',
          )}
        >
          {item.allowComment && !isInThinkingDetailRoute && (
            <button
              className="flex items-center gap-1"
              onClick={() => {
                present({
                  title: t('comment'),
                  content: () => <CommentModal {...item} />,
                })
              }}
            >
              <i className="i-mingcute-comment-line" />

              <span className="sr-only">{t('comment')}</span>
              <span>
                <NumberSmoothTransition>
                  {/* @ts-expect-error */}
                  {item.comments}
                </NumberSmoothTransition>
              </span>
            </button>
          )}
          <button
            className="flex items-center gap-1"
            onClick={() => {
              handleUp(item.id)
            }}
          >
            <i className="i-mingcute-heart-line" />
            <span className="sr-only">{t('like')}</span>
            <span>
              <NumberSmoothTransition>{item.up}</NumberSmoothTransition>
            </span>
          </button>

          <button
            className="flex items-center gap-1"
            onClick={() => {
              handleDown(item.id)
            }}
          >
            <i className="i-mingcute-heart-crack-line" />
            <span className="sr-only">{t('dislike')}</span>
            <span>
              <NumberSmoothTransition>{item.down}</NumberSmoothTransition>
            </span>
          </button>

          <DeleteButton id={item.id} />
          <EditButton item={item} />

          {!isInThinkingDetailRoute && (
            <Link
              className="center absolute bottom-0 right-0 flex gap-1 text-sm opacity-0 duration-200 group-hover:opacity-100"
              href={routeBuilder(Routes.ThinkingItem, { id: item.id })}
            >
              <i className="i-mingcute-arrow-right-circle-line" />
              <span>{t('actions_view')}</span>
            </Link>
          )}
        </div>
      </div>
    </li>
  )
})

ThinkingItem.displayName = 'ThinkingItem'

const RefPreview: FC<{ refModel: any }> = (props) => {
  const t = useTranslations('common')
  const title = props.refModel?.title

  const url = useMemo(() => urlBuilder.build(props.refModel), [props.refModel])

  if (!title) {
    return null
  }

  return (
    <>
      <Divider className="my-4 w-12 bg-current opacity-50" />
      <p className="flex items-center space-x-2 opacity-80">
        {t('published_at')} <i className="i-mingcute-link-3-line" />
        <PeekLink className="shiro-link--underline" href={url}>
          {title}
        </PeekLink>
      </p>
    </>
  )
}

const DeleteButton = (props: { id: string }) => {
  const t = useTranslations('common')
  const isLogin = useIsOwnerLogged()
  const queryClient = useQueryClient()

  const handleDelete = () => {
    apiClient.shorthand
      .proxy(props.id)
      .delete()
      .then(() => {
        toast.success(t('delete_success'))

        queryClient.setQueryData<InfiniteData<RecentlyModel[]>>(
          QUERY_KEY,
          (old) =>
            produce(old, (draft) => {
              draft?.pages.forEach((page) => {
                page.forEach((item, index) => {
                  if (item.id === props.id) {
                    page.splice(index, 1)
                  }
                })
              })
            }),
        )
      })
  }
  const { present } = useModalStack()
  if (!isLogin) return null

  return (
    <button
      className="text-red-500 hover:text-red-600 dark:hover:text-red-300"
      onClick={() => {
        present({
          title: t('delete_confirm_default'),
          content: ({ dismiss }) => (
            <div className="w-[300px] space-y-4">
              <div className="mt-4 flex justify-end space-x-4">
                <StyledButton
                  className="bg-neutral-2/80 text-red-500!"
                  variant="primary"
                  onClick={() => {
                    handleDelete()
                    dismiss()
                  }}
                >
                  {t('actions_confirm')}
                </StyledButton>
                <StyledButton variant="primary" onClick={dismiss}>
                  {t('actions_cancel')}
                </StyledButton>
              </div>
            </div>
          ),
        })
      }}
    >
      <i className="i-mingcute-delete-line" />
      <span className="sr-only">{t('actions_delete')}</span>
    </button>
  )
}

const CommentModal = (props: RecentlyModel) => {
  const t = useTranslations('common')
  const { id, allowComment, content } = props

  return (
    <div className="max-w-[95vw] overflow-y-auto overflow-x-hidden md:w-[500px] lg:w-[600px] xl:w-[700px]">
      <span>{allowComment && t('reply_to')}</span>

      <Markdown allowsScript className="mt-4" variant="comment">
        {content}
      </Markdown>

      {allowComment && <CommentBoxRootLazy className="my-12" refId={id} />}

      <CommentsLazy refId={id} />
    </div>
  )
}

const EditButton = (props: { item: RecentlyModel }) => {
  const t = useTranslations('common')
  const isLogin = useIsOwnerLogged()
  const queryClient = useQueryClient()
  const { present } = useModalStack()

  if (!isLogin) return null

  return (
    <button
      onClick={() => {
        present({
          title: t('actions_edit'),
          content: ({ dismiss }) => (
            <EditModal
              dismiss={dismiss}
              item={props.item}
              queryClient={queryClient}
            />
          ),
        })
      }}
    >
      <i className="i-mingcute-quill-pen-line" />
      <span className="sr-only">{t('actions_edit')}</span>
    </button>
  )
}

const EditModal = ({
  item,
  dismiss,
  queryClient,
}: {
  item: RecentlyModel
  dismiss: () => void
  queryClient: ReturnType<typeof useQueryClient>
}) => {
  const t = useTranslations('common')
  const [content, setContent] = useState(item.content)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error(t('content_empty'))
      return
    }
    setLoading(true)
    try {
      await apiClient.shorthand.proxy(item.id).put({ data: { content } })
      toast.success(t('edit_success'))
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      dismiss()
    } catch {
      toast.error(t('edit_failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-[400px] max-w-[90vw] space-y-4">
      <textarea
        autoFocus
        className="h-[200px] w-full resize-none rounded-lg border border-neutral-4 bg-transparent p-3"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="flex justify-end space-x-4">
        <StyledButton disabled={loading} variant="primary" onClick={handleSave}>
          {loading ? t('actions_saving') : t('actions_save')}
        </StyledButton>
        <StyledButton variant="primary" onClick={dismiss}>
          {t('actions_cancel')}
        </StyledButton>
      </div>
    </div>
  )
}

const typeBadgeStyles: Record<string, string> = {
  [RecentlyTypeEnum.Book]: 'bg-amber-900/20 text-amber-400',
  [RecentlyTypeEnum.Media]: 'bg-indigo-900/20 text-indigo-400',
  [RecentlyTypeEnum.Music]: 'bg-emerald-900/20 text-emerald-400',
  [RecentlyTypeEnum.Github]: 'bg-neutral-8/30 text-neutral-6',
  [RecentlyTypeEnum.Link]: 'bg-blue-900/20 text-blue-400',
  [RecentlyTypeEnum.Academic]: 'bg-amber-900/20 text-amber-500',
  [RecentlyTypeEnum.Code]: 'bg-teal-900/20 text-teal-400',
}

const TypeBadge: FC<{ type: RecentlyTypeEnum }> = ({ type }) => (
  <span
    className={clsx(
      'ml-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider',
      typeBadgeStyles[type] || 'bg-neutral-8/30 text-neutral-6',
    )}
  >
    {type}
  </span>
)
