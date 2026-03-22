import type { CommentAnchor } from '../comment/types'

export interface ArticleSelectionSnapshot {
  anchor: CommentAnchor | null
  position: {
    x: number
    y: number
  }
  range: Range | null
  selectedText: string
}
