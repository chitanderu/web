type NotePathLike = {
  nid: number | string
  slug?: string | null
  created?: string | Date | null
  password?: string | null
}

type NoteLikeWithUnknownSlug = {
  nid: number | string
  created?: string | Date | null
  slug?: unknown
}

const appendPassword = (path: string, password?: string | null) => {
  if (!password) {
    return path
  }

  const query = new URLSearchParams({
    password,
  })

  return `${path}?${query.toString()}`
}

export const buildNoteSeoPath = (
  note: Pick<NotePathLike, 'slug' | 'created'>,
) => {
  if (!note.slug || !note.created) {
    return null
  }

  const date = new Date(note.created)

  return `/notes/${date.getUTCFullYear()}/${date.getUTCMonth() + 1}/${date.getUTCDate()}/${note.slug}`
}

export const buildNotePath = (note: NotePathLike) => {
  return appendPassword(
    buildNoteSeoPath(note) ?? `/notes/${note.nid}`,
    note.password,
  )
}

export const getNoteRouteParams = (note: NoteLikeWithUnknownSlug) => ({
  id: note.nid,
  created: note.created,
  slug: typeof note.slug === 'string' ? note.slug : undefined,
})
