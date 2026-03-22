import type { NoteModel } from '@mx-space/api-client'
import { getFormatter, getTranslations } from 'next-intl/server'

import { Link } from '~/i18n/navigation'
import { topicStringToHue } from '~/lib/color'
import { buildNotePath } from '~/lib/note-route'

import { Markdown } from '../../ui/markdown'
import { NoteLatestLexicalPreview } from './NoteLatestLexicalPreview'

export async function NoteLatestRender({ note }: { note: NoteModel }) {
  const href = buildNotePath(note)
  const coverSrc = note.meta?.cover as string | undefined
  const format = await getFormatter()
  const t = await getTranslations('note')
  const date = new Date(note.created)

  return (
    <div className="relative mt-6">
      {/* Nid watermark */}
      <span className="pointer-events-none absolute -top-1 right-0 select-none font-serif text-5xl font-bold leading-none tracking-tighter text-neutral-9/[.06]">
        #{note.nid}
      </span>

      {(note.weather || note.mood || note.topic) && (
        <div className="mb-2.5 flex items-center gap-2 text-xs">
          {note.topic && <MobileTopicTag name={note.topic.name} />}
          {note.weather && (
            <span className="text-neutral-6">{note.weather}</span>
          )}
          {note.mood && <span className="text-neutral-6">{note.mood}</span>}
        </div>
      )}

      <h1 className="mb-1.5 max-w-[calc(100%-5rem)] text-2xl font-bold tracking-tight text-neutral-9 lg:max-w-[calc(100%-6rem)] lg:text-[28px]">
        <Link className="hover:text-accent transition-colors" href={href}>
          {note.title}
        </Link>
      </h1>

      <div className="mb-6 text-xs text-neutral-6">
        {format.dateTime(date, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'short',
        })}
      </div>

      {coverSrc && (
        <Link className="mb-6 block overflow-hidden rounded-lg" href={href}>
          <img
            alt={note.title}
            className="w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
            src={coverSrc}
            style={{ maxHeight: '280px' }}
          />
        </Link>
      )}

      <div
        className="max-h-[calc(100vh-40rem)] overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, black 60%, transparent 100%)',
        }}
      >
        {note.contentFormat === 'lexical' && note.content ? (
          <article className="relative">
            <NoteLatestLexicalPreview content={note.content} />
          </article>
        ) : note.text ? (
          <article className="prose relative">
            <Markdown removeWrapper={false} value={note.text} variant="note" />
          </article>
        ) : null}
      </div>

      <LetterBottom
        href={href}
        linkText={t('read_full_note')}
        topicName={note.topic?.name}
      />
    </div>
  )
}

function LetterBottom({
  topicName,
  href,
  linkText,
}: {
  topicName?: string
  href: string
  linkText: string
}) {
  const hue = topicName ? topicStringToHue(topicName) : null

  const washiC1 =
    hue !== null ? `hsla(${hue}, 35%, 50%, 0.18)` : 'rgba(170, 160, 140, 0.2)'
  const washiC2 =
    hue !== null ? `hsla(${hue}, 35%, 50%, 0.10)` : 'rgba(170, 160, 140, 0.12)'
  const washiC1Dark =
    hue !== null ? `hsla(${hue}, 35%, 50%, 0.14)` : 'rgba(170, 160, 140, 0.14)'
  const washiC2Dark =
    hue !== null ? `hsla(${hue}, 35%, 50%, 0.07)` : 'rgba(170, 160, 140, 0.08)'

  const washiMask = {
    maskImage:
      'linear-gradient(90deg, transparent 0%, black 5%, black 95%, transparent 100%)',
    WebkitMaskImage:
      'linear-gradient(90deg, transparent 0%, black 5%, black 95%, transparent 100%)',
  }

  return (
    <div className="relative mt-1 pb-4 sm:pb-12">
      {/* Washi tape — light */}
      <div
        className="mx-auto h-5 w-[65%] -rotate-[1.2deg] dark:hidden"
        style={{
          background: `repeating-linear-gradient(45deg, ${washiC1} 0px, ${washiC1} 4px, ${washiC2} 4px, ${washiC2} 8px)`,
          ...washiMask,
        }}
      />
      {/* Washi tape — dark */}
      <div
        className="mx-auto hidden h-5 w-[65%] -rotate-[1.2deg] dark:block"
        style={{
          background: `repeating-linear-gradient(45deg, ${washiC1Dark} 0px, ${washiC1Dark} 4px, ${washiC2Dark} 4px, ${washiC2Dark} 8px)`,
          ...washiMask,
        }}
      />

      {/* Handwritten-style link */}
      <div className="mt-4 text-center">
        <Link
          className="text-sm italic tracking-wide text-[#8c6239] transition-opacity hover:opacity-70 focus-visible:opacity-70 dark:text-[#d4a574]"
          href={href}
          style={{
            fontFamily: "Georgia, 'Noto Serif SC', serif",
            letterSpacing: '0.5px',
          }}
        >
          {linkText} →
        </Link>
      </div>

      {/* Postmark stamp — hidden on mobile */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-2.5 right-5 hidden size-12 -rotate-[18deg] items-center justify-center rounded-full border-[1.5px] border-[rgba(160,80,70,0.22)] dark:border-[rgba(180,110,100,0.25)] sm:flex"
      >
        <span
          className="text-center text-[7.5px] uppercase leading-tight text-[rgba(160,80,70,0.3)] dark:text-[rgba(180,110,100,0.3)]"
          style={{ fontFamily: "'Courier New', monospace" }}
        >
          Letter
          <br />
          Post
        </span>
      </div>

      {/* Tape accent piece — hidden on mobile */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-13 right-3 hidden h-3.5 w-13 rotate-[4deg] rounded-[1px] bg-[rgba(200,185,150,0.25)] dark:bg-[rgba(200,185,150,0.1)] sm:block"
      />
    </div>
  )
}

function MobileTopicTag({ name }: { name: string }) {
  const hue = topicStringToHue(name)
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-[11px] font-medium lg:hidden"
      style={{
        backgroundColor: `hsl(${hue}, 35%, 40%, 0.12)`,
        color: `hsl(${hue}, 35%, 40%)`,
      }}
    >
      {name}
    </span>
  )
}
