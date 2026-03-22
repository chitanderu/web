import type { CommentModel } from '@mx-space/api-client'
import { CollectionRefTypes } from '@mx-space/api-client'
import { use, useMemo } from 'react'

import { RelativeTime } from '~/components/ui/relative-time'
import { EllipsisHorizontalTextWithTooltip } from '~/components/ui/typography'
import { clsxm } from '~/lib/helper'
import { apiClient } from '~/lib/request'

import { CommentMarkdown } from '../../comment/CommentMarkdown'
import { CommentAction } from './CommentAction'
import { CommentDataContext } from './CommentContext'
import { CommentUrlRender } from './UrlRender'

export const CommentContentCell: Component<{ comment: CommentModel }> = (
  props,
) => {
  const { comment, className } = props
  const parentComment =
    comment.parentCommentId && typeof comment.parentCommentId !== 'string'
      ? ((comment.parentCommentId as any) ?? null)
      : null
  const { created, refType, text, id, isWhispers } = comment
  const ctx = use(CommentDataContext)
  const ref = ctx.refModelMap.get(id)

  const TitleEl = useMemo(() => {
    if (!ref) return <span className="opacity-60">已删除</span>
    if (refType === CollectionRefTypes.Recently)
      return `${ref.text?.slice(0, 20)}...`
    return (
      <div className="flex w-0 grow items-center">
        <a
          className="inline-flex overflow-hidden"
          rel="noreferrer"
          target="_blank"
          href={`${apiClient.proxy
            .helper('url-builder')(ref.id)
            .toString(true)}?redirect=true`}
        >
          <EllipsisHorizontalTextWithTooltip wrapperClassName="text-left text-accent inline-block shrink">
            {ref.title}
          </EllipsisHorizontalTextWithTooltip>
        </a>
        <div className="ml-2">{isWhispers && '悄悄说'}</div>
        <div className="grow" />
      </div>
    )
  }, [isWhispers, ref, refType])
  return (
    <div className={clsxm('flex flex-col gap-2 py-2 text-sm', className)}>
      <div className="flex gap-2 whitespace-nowrap text-sm">
        <RelativeTime date={created} /> 于 {TitleEl}
      </div>

      <div className="break-words">
        <CommentMarkdown>{text}</CommentMarkdown>
      </div>

      {parentComment && typeof parentComment !== 'string' && (
        <div className="relative mt-2 break-words">
          <blockquote className="ml-3 pl-3 before:absolute before:inset-y-0 before:left-[3px] before:h-full before:w-[3px] before:rounded-lg before:bg-accent before:content-['']">
            <div>
              <CommentUrlRender
                author={parentComment.author}
                url={parentComment.url}
              />{' '}
              在 <RelativeTime date={parentComment.created} /> 说：
            </div>
            <div className="mt-2">
              <CommentMarkdown>{parentComment.text}</CommentMarkdown>
            </div>
          </blockquote>
        </div>
      )}

      <CommentAction comment={props.comment} />
    </div>
  )
}
