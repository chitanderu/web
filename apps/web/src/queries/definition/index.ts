import { activity } from './activity'
import { aggregation } from './aggregation'
import { commentAdmin } from './comment'
import { note, noteAdmin } from './note'
import { page } from './page'
import type { PostWithTranslation } from './post'
import { post, postAdmin } from './post'

export type { PostWithTranslation }

export const queries = {
  aggregation,
  note,
  post,
  page,
  activity,
}

export const adminQueries = {
  post: postAdmin,
  note: noteAdmin,
  comment: commentAdmin,
}
