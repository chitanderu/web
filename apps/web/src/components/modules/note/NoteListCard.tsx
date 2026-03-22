import type { NoteModel } from '@mx-space/api-client'
import type { FC } from 'react'

import { SolidBookmark } from '~/components/icons/bookmark'
import { Link } from '~/i18n/navigation'
import { topicStringToHue } from '~/lib/color'
import { buildNotePath } from '~/lib/note-route'

export const NoteListCard: FC<{ note: NoteModel }> = ({ note }) => {
  const coverSrc = note.meta?.cover as string | undefined
  const href = buildNotePath(note)

  return (
    <Link className="block" href={href}>
      <article className="relative overflow-hidden rounded-md bg-neutral-1 shadow-perfect perfect-sm border border-neutral-3/70 transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-lg">
        {note.bookmark && (
          <SolidBookmark className="absolute right-2.5 -top-3 z-[1] text-5xl text-red-500 drop-shadow-sm" />
        )}
        {coverSrc && (
          <img
            alt={note.title}
            className="h-[140px] w-full object-cover"
            src={coverSrc}
          />
        )}
        <div className="p-4 lg:px-5">
          <div className="mb-1.5 flex items-center justify-between">
            <h3 className="truncate text-base font-semibold text-neutral-9">
              {note.title}
            </h3>
            <span className="ml-2 shrink-0 text-xs text-neutral-6">
              #{note.nid}
            </span>
          </div>

          <NoteListCardMeta note={note} />

          {(note as any).summary && (
            <p className="mt-2 truncate text-sm leading-relaxed text-neutral-6">
              {(note as any).summary}
            </p>
          )}
        </div>
      </article>
    </Link>
  )
}

const NoteListCardMeta: FC<{ note: NoteModel }> = ({ note }) => {
  const parts: string[] = []
  if (note.weather) parts.push(note.weather)
  if (note.mood) parts.push(note.mood)

  if (!parts.length && !note.topic) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-6">
      {note.topic && <TopicTag name={note.topic.name} />}
      {parts.map((part) => (
        <span key={part}>
          {part}
          {part !== parts.at(-1) && <span className="mx-0.5">·</span>}
        </span>
      ))}
    </div>
  )
}

const TopicTag: FC<{ name: string }> = ({ name }) => {
  const hue = topicStringToHue(name)
  return (
    <span
      className="rounded-full px-2 py-px text-[11px] font-medium"
      style={{
        backgroundColor: `hsl(${hue}, 35%, 40%, 0.12)`,
        color: `hsl(${hue}, 35%, 40%)`,
      }}
    >
      {name}
    </span>
  )
}
