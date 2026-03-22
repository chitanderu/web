'use client'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useIsMobile } from '~/atoms/hooks/viewport'
import { DOMCustomEvents } from '~/constants/event'
import { useIsClient } from '~/hooks/common/use-is-client'

import {
  buildRangeAnchorFromSelection,
  extractBlockInfos,
} from '../comment/anchor-utils'
import type { CommentAnchor } from '../comment/types'
import type { ArticleSelectionSnapshot } from './WithArticleSelectionAction.types'
import { WithArticleSelectionCommand } from './WithArticleSelectionCommand'

export const WithArticleSelectionAction: Component<{
  refId: string
  title: string
  canComment: boolean
  contentFormat?: string
  content?: string
  translationLang?: string | null
}> = ({
  refId,
  title,
  children,
  canComment,
  contentFormat,
  content,
  translationLang,
}) => {
  const isMobile = useIsMobile()
  const currentLang = translationLang ?? null
  const ref = useRef<HTMLDivElement>(null)
  const [selection, setSelection] = useState<ArticleSelectionSnapshot | null>(
    null,
  )

  const isLexical = contentFormat === 'lexical'
  const blockInfos = useMemo(
    () => (isLexical && content ? extractBlockInfos(content) : []),
    [isLexical, content],
  )

  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (window.getSelection()?.toString().length === 0) {
        setSelection(null)
        return
      }
      if (ref.current?.contains(e.target as Node)) return
      setSelection(null)
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('mouseup', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('mouseup', handler)
    }
  }, [])

  const isClient = useIsClient()
  useEffect(() => {
    const timer = setTimeout(() => {
      document.dispatchEvent(new CustomEvent(DOMCustomEvents.RefreshToc))
    }, 1000)
    return () => {
      clearTimeout(timer)
    }
  }, [])

  if (isMobile || !isClient) return children

  const buildAnchorFromSelection = (sel: Selection): CommentAnchor | null => {
    if (!isLexical || blockInfos.length === 0) return null
    if (sel.isCollapsed) return null
    const contentEl =
      ref.current?.querySelector('[data-lexical-content]') ??
      ref.current?.querySelector('.rich-content')
    if (!contentEl) return null
    return buildRangeAnchorFromSelection(
      sel,
      contentEl,
      blockInfos,
      currentLang,
    )
  }

  return (
    <div
      className="relative"
      ref={ref}
      onMouseUp={(e) => {
        const $ = ref.current
        if (!$) return

        const selection = window.getSelection()
        if (!selection) return
        const selectedText = selection.toString()
        if (selectedText.length === 0) return
        const { top, left } = $.getBoundingClientRect()

        const range =
          selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null
        setSelection({
          selectedText,
          position: {
            x: e.clientX - left + 10,
            y: e.clientY - top + 10,
          },
          anchor: buildAnchorFromSelection(selection),
          range,
        })
      }}
    >
      {children}

      <WithArticleSelectionCommand
        canComment={canComment}
        contextElement={ref.current}
        refId={refId}
        selection={selection}
        title={title}
        onDismiss={() => setSelection(null)}
      />
    </div>
  )
}
