'use client'

import clsx from 'clsx'
import { AnimatePresence, m } from 'motion/react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { MotionButtonBase } from '~/components/ui/button'
import { DividerVertical } from '~/components/ui/divider'
import { useModalStack } from '~/components/ui/modal'
import { stopPropagation } from '~/lib/dom'
import { toast } from '~/lib/toast'

import type { CommentAnchor } from '../comment/types'
import { CommentModal } from './CommentModal'
import type { ArticleSelectionSnapshot } from './WithArticleSelectionAction.types'
import type { ArticleSelectionCommentPopoverState } from './WithArticleSelectionCommentPopover'
import { WithArticleSelectionCommentPopover } from './WithArticleSelectionCommentPopover'

export const WithArticleSelectionCommand: Component<{
  refId: string
  title: string
  canComment: boolean
  selection: ArticleSelectionSnapshot | null
  contextElement: HTMLElement | null
  onDismiss: () => void
}> = ({ refId, title, canComment, selection, contextElement, onDismiss }) => {
  const t = useTranslations('common')
  const { present } = useModalStack()
  const [commentPopover, setCommentPopover] =
    useState<ArticleSelectionCommentPopoverState | null>(null)

  const openCommentPopover = (anchor: CommentAnchor, range: Range) => {
    setCommentPopover({ anchor, range })
    onDismiss()
  }

  return (
    <>
      <AnimatePresence>
        {selection && (
          <m.div
            animate={{ y: 0, opacity: 1, scale: 1 }}
            initial={{ y: 10, opacity: 0.8, scale: 0.1 }}
            className={clsx(
              'absolute z-10 rounded-lg bg-gradient-to-b from-neutral-1/50 to-neutral-1/90 p-1 text-sm shadow-lg shadow-neutral-9/5 ring-1 ring-neutral-9/5',
              'backdrop-blur-xs',
              'whitespace-nowrap [&_button]:whitespace-nowrap',
            )}
            exit={{
              scale: 0,
              opacity: 0,
            }}
            style={{
              left: selection.position.x,
              top: selection.position.y - 40,
            }}
          >
            <MotionButtonBase
              className="rounded-md px-2 py-1 hover:bg-neutral-2/80"
              data-event="selection-comment"
              onMouseUp={stopPropagation}
              onClick={() => {
                navigator.clipboard.writeText(selection.selectedText)
                onDismiss()
                toast.success(t('selection_copy_success'))
              }}
            >
              {t('selection_copy')}
            </MotionButtonBase>
            {canComment && <DividerVertical className="mx-1" />}

            {canComment && (
              <MotionButtonBase
                className="rounded-md px-2 py-1 hover:bg-neutral-2/80"
                data-event="selection-comment"
                onClick={() => {
                  if (selection.anchor && selection.range) {
                    openCommentPopover(selection.anchor, selection.range)
                    return
                  }

                  present({
                    title: t('selection_comment'),
                    content: (rest) => (
                      <CommentModal
                        initialValue={`> ${selection.selectedText?.split('\n').join('')}\n\n`}
                        refId={refId}
                        title={title}
                        {...rest}
                      />
                    ),
                  })
                }}
              >
                {t('selection_quote_comment')}
              </MotionButtonBase>
            )}
          </m.div>
        )}
      </AnimatePresence>

      <WithArticleSelectionCommentPopover
        contextElement={contextElement}
        refId={refId}
        state={commentPopover}
        onClose={() => setCommentPopover(null)}
      />
    </>
  )
}
