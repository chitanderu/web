import type { NoteModel } from '@mx-space/api-client'
import { getTranslations } from 'next-intl/server'

import { Paper } from '~/components/layout/container/Paper'
import { NoteLatestRender } from '~/components/modules/note/NoteLatestRender'
import { NoteListPagination } from '~/components/modules/note/NoteListPagination'
import { NoteListTimeline } from '~/components/modules/note/NoteListTimeline'
import { NoteTopicBinderClip } from '~/components/modules/note/NoteTopicBinderClip'
import { NothingFound } from '~/components/modules/shared/NothingFound'
import { apiClient } from '~/lib/request'
import { definePrerenderPage } from '~/lib/request.server'

interface Props extends LocaleParams {
  page?: string
}

const noteListSelect: (keyof NoteModel)[] = [
  'title',
  'nid',
  'meta',
  'topic',
  'topicId' as keyof NoteModel,
  'mood',
  'weather',
  'bookmark',
  'created',
  'slug',
  'id',
]

export default definePrerenderPage<Props>()({
  fetcher: async (params) => {
    const currentPage = params?.page ? Number.parseInt(params.page) : 1
    const isFirstPage = currentPage === 1

    const [latestNote, listResult] = await Promise.all([
      isFirstPage
        ? apiClient.note.getLatest().then((res) => res.data as NoteModel)
        : null,
      apiClient.note.getList(currentPage, 10, {
        select: noteListSelect,
        withSummary: true,
      }),
    ])

    return { latestNote, listResult, isFirstPage }
  },
  Component: async ({ data: { latestNote, listResult, isFirstPage } }) => {
    const t = await getTranslations('note')
    const { data, pagination } = listResult

    if (!data?.length) {
      return <NothingFound />
    }

    const timelineNotes =
      isFirstPage && latestNote
        ? data.filter((n: NoteModel) => n.id !== latestNote.id)
        : data

    return (
      <div className="mx-auto mt-24 min-w-0 max-w-5xl px-4">
        {isFirstPage && latestNote && (
          <>
            <Paper as="section" className="mb-0!">
              <div className="hidden lg:block">
                {latestNote.topic && (
                  <NoteTopicBinderClip topic={latestNote.topic} />
                )}
              </div>
              <NoteLatestRender note={latestNote} />
            </Paper>
            {timelineNotes.length > 0 && (
              <div className="my-10 flex items-center gap-3">
                <div className="h-px flex-1 bg-neutral-3/60" />
                <span className="text-xs tracking-widest text-neutral-6">
                  {t('older_notes')}
                </span>
                <div className="h-px flex-1 bg-neutral-3/60" />
              </div>
            )}
          </>
        )}
        {timelineNotes.length > 0 && <NoteListTimeline notes={timelineNotes} />}
        <NoteListPagination pagination={pagination} />
      </div>
    )
  },
})
