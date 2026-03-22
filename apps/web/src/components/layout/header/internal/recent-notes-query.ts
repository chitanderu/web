import type { NoteModel, PaginateResult } from '@mx-space/api-client'

type RecentNoteFields = Pick<NoteModel, 'nid' | 'title' | 'created' | 'slug'>
const recentNoteSelect: (keyof NoteModel)[] = [
  'nid',
  'title',
  'created',
  'slug',
]

type NoteClient = {
  note: {
    getList: (
      page?: number,
      perPage?: number,
      options?: { select?: (keyof NoteModel)[] },
    ) => Promise<{
      $serialized: PaginateResult<RecentNoteFields>
    }>
  }
}

export const getRecentNotesQueryOptions = (
  locale: string,
  client: NoteClient,
) => ({
  queryKey: ['nav-recent-notes', locale],
  queryFn: async () => {
    const data = await client.note.getList(1, 4, { select: recentNoteSelect })
    return data.$serialized
  },
  staleTime: 1000 * 60 * 5,
})
