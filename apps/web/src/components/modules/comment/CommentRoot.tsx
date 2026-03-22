import { useTranslations } from 'next-intl'
import type { FC } from 'react'

import { LazyLoad } from '~/components/common/Lazyload'
import { useAggregationSelector } from '~/providers/root/aggregation-data-provider'

import { resolveCommentGuard } from './comment-guard'
import { CommentBoxRoot } from './CommentBox/Root'
import { Comments } from './Comments'
import { CommentSkeleton } from './CommentSkeleton'
import type { CommentBaseProps } from './types'

export const CommentAreaRoot: FC<
  CommentBaseProps & {
    allowComment: boolean
  }
> = (props) => {
  const t = useTranslations('comment')
  // const header = headers()
  // const geo = header.get(REQUEST_GEO)

  // const isCN = geo === 'CN'

  // if (isCN) return <NotSupport />

  const { allowComment, refId } = props
  const disableComment = useAggregationSelector(
    (data) => data.commentOptions?.disableComment,
    [],
  ) as boolean | undefined | null
  const { commentsClosed } = resolveCommentGuard({
    allowComment,
    disableComment: disableComment ?? undefined,
    allowGuestComment: true,
    hasSessionReader: false,
  })

  if (commentsClosed) {
    return (
      <p className="mt-[7.1rem] text-center text-xl font-medium">
        {t('comments_closed')}
      </p>
    )
  }

  return (
    <div className="relative mt-12">
      <CommentBoxRoot refId={refId} />

      <div className="h-12" />
      <LazyLoad triggerOnce placeholder={<CommentSkeleton />}>
        <Comments refId={refId} />
      </LazyLoad>
    </div>
  )
}
