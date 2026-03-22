'use client'

import { LexicalCommentWrapper } from '~/components/modules/comment/LexicalCommentWrapper'
import { MainLexicalContent } from '~/components/ui/rich-content/MainLexicalContent'
import { useCurrentNoteDataSelector } from '~/providers/note/CurrentNoteDataProvider'

export const NoteLexicalRenderer = () => {
  const content = useCurrentNoteDataSelector((data) => data?.data.content)
  const refId = useCurrentNoteDataSelector((data) => data?.data.id)
  const title = useCurrentNoteDataSelector((data) => data?.data.title)
  const translationLang = useCurrentNoteDataSelector((data) =>
    data?.data.isTranslated ? data.data.translationMeta?.targetLang : null,
  )
  if (!content) return null
  return (
    <LexicalCommentWrapper
      content={content}
      refId={refId!}
      title={title!}
      translationLang={translationLang}
    >
      <MainLexicalContent className="mt-10" content={content} variant="note" />
    </LexicalCommentWrapper>
  )
}
