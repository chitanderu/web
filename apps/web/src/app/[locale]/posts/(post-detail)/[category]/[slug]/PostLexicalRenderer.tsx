'use client'

import { LexicalCommentWrapper } from '~/components/modules/comment/LexicalCommentWrapper'
import { MainLexicalContent } from '~/components/ui/rich-content/MainLexicalContent'
import { useCurrentPostDataSelector } from '~/providers/post/CurrentPostDataProvider'

export const PostLexicalRenderer = () => {
  const content = useCurrentPostDataSelector((data) => data?.content)
  const refId = useCurrentPostDataSelector((data) => data?.id)
  const title = useCurrentPostDataSelector((data) => data?.title)
  const translationLang = useCurrentPostDataSelector((data) =>
    data?.isTranslated ? data.translationMeta?.targetLang : null,
  )
  if (!content) return null
  return (
    <LexicalCommentWrapper
      content={content}
      refId={refId!}
      title={title!}
      translationLang={translationLang}
    >
      <MainLexicalContent className="min-w-0 w-full" content={content} />
    </LexicalCommentWrapper>
  )
}
