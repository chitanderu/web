import { atom } from 'jotai'

import type { CommentAnchor } from '~/components/modules/comment/types'

export const pendingCommentAnchorAtom = atom<CommentAnchor | null>(null)
