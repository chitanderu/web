import type { NoteWrappedWithLikedAndTranslationPayload } from '@mx-space/api-client'

import { attachServerFetch } from '~/lib/attach-fetch'
import { getQueryClient } from '~/lib/query-client.server'
import { requestErrorHandler } from '~/lib/request.server'
import { queries } from '~/queries/definition'

export interface NoteSlugParams extends LocaleParams {
  day: string
  lang?: string
  month: string
  password?: string | string[] | null
  slug: string
  year: string
}

export interface NoteDataResult {
  note: NoteWrappedWithLikedAndTranslationPayload
}

const getNoteData = async (params: NoteSlugParams, lang?: string) => {
  await attachServerFetch()

  const password = Array.isArray(params.password)
    ? params.password[0]
    : (params.password ?? undefined)

  const query = queries.note.bySlugDate(
    Number(params.year),
    Number(params.month),
    Number(params.day),
    params.slug,
    password,
    lang,
  )

  const data = await getQueryClient()
    .fetchQuery({
      ...query,
      staleTime: 0,
    })
    .catch(requestErrorHandler)

  return data as NoteWrappedWithLikedAndTranslationPayload
}

export const getData = async (
  params: NoteSlugParams,
): Promise<NoteDataResult> => {
  if (params.lang === 'original') {
    const note = await getNoteData(params, 'original')
    return { note }
  }

  const preferredLang = params.lang || params.locale
  const note = await getNoteData(params, preferredLang || undefined)

  return { note }
}
