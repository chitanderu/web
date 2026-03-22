import '../[id]/page.css'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Paper } from '~/components/layout/container/Paper'
import { NotePasswordForm } from '~/components/modules/note'
import { redirect } from '~/i18n/navigation'
import { buildNotePath, buildNoteSeoPath } from '~/lib/note-route'
import { definePrerenderPage } from '~/lib/request.server'

import { getData as getNoteByNidData, type NoteDataResult } from '../[id]/api'
import { buildNotePageMetadata, NoteDetailPageContent } from '../detail-page'
import { getData as getNoteBySlugData } from '../slug-api'

type NoteCatchAllParams = LocaleParams & {
  lang?: string
  password?: string | string[] | null
  path: string[]
}

const resolveNotePath = (path?: string[]) => {
  if (!path?.length) {
    notFound()
  }

  if (path.length === 1) {
    return {
      id: path[0],
      kind: 'nid' as const,
    }
  }

  if (path.length === 4) {
    const [year, month, day, slug] = path
    return {
      day,
      kind: 'slug' as const,
      month,
      slug,
      year,
    }
  }

  notFound()
}

const fetchNoteData = async (
  params: NoteCatchAllParams,
): Promise<NoteDataResult> => {
  const resolved = resolveNotePath(params.path)

  if (resolved.kind === 'nid') {
    return getNoteByNidData({
      ...params,
      id: resolved.id,
    })
  }

  return getNoteBySlugData({
    ...params,
    ...resolved,
  })
}

export const dynamic = 'force-dynamic'

export const generateMetadata = async (props: {
  params: Promise<NoteCatchAllParams>
  searchParams?: Promise<{
    password?: string | string[]
    lang?: string
  }>
}): Promise<Metadata> => {
  const params = await props.params
  const searchParams = (await props.searchParams) ?? {}
  const password = Array.isArray(searchParams.password)
    ? searchParams.password[0]
    : searchParams.password

  try {
    const data = await fetchNoteData({
      ...params,
      password,
      lang: searchParams.lang,
    })

    return buildNotePageMetadata({
      locale: params.locale,
      notePayload: data.note,
    })
  } catch {
    return {}
  }
}

export default definePrerenderPage<NoteCatchAllParams>()<NoteDataResult>({
  fetcher: fetchNoteData,
  requestErrorRenderer(_error, parsed) {
    if (parsed.status === 403) {
      return (
        <Paper>
          <NotePasswordForm />
        </Paper>
      )
    }
  },
  async Component({ data: fetchedData, params, fetchedAt }) {
    const password = Array.isArray(params.password)
      ? params.password[0]
      : params.password
    const canonicalPath = buildNotePath({
      ...fetchedData.note.data,
      password,
    })
    const currentPath = `/notes/${params.path.join('/')}`

    if (params.path.length === 1) {
      if (buildNoteSeoPath(fetchedData.note.data)) {
        redirect({
          href: canonicalPath,
          locale: params.locale,
        })
      }
    } else if (canonicalPath !== currentPath) {
      redirect({
        href: canonicalPath,
        locale: params.locale,
      })
    }

    return (
      <NoteDetailPageContent
        fetchedAt={fetchedAt}
        nid={fetchedData.note.data.nid.toString()}
        notePayload={fetchedData.note}
      />
    )
  },
})
