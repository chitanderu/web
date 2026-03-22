'use client'

import type { NoteModel } from '@mx-space/api-client'
import { useFormatter } from 'next-intl'
import type { FC } from 'react'

import { BottomToUpSoftScaleTransitionView } from '~/components/ui/transition'

import { NoteListCard } from './NoteListCard'

interface YearGroup {
  notes: NoteModel[]
  year: number
}

function groupNotesByYear(notes: NoteModel[]): YearGroup[] {
  const groups: Map<number, NoteModel[]> = new Map()

  for (const note of notes) {
    const year = new Date(note.created).getFullYear()
    if (!groups.has(year)) {
      groups.set(year, [])
    }
    groups.get(year)!.push(note)
  }

  return Array.from(groups.entries()).map(([year, notes]) => ({ year, notes }))
}

export const NoteListTimeline: FC<{ notes: NoteModel[] }> = ({ notes }) => {
  const format = useFormatter()
  const groups = groupNotesByYear(notes)

  let itemIndex = 0

  return (
    <div className="space-y-12">
      {groups.map((group) => {
        const groupStartIndex = itemIndex

        return (
          <section className="relative" key={group.year}>
            {/* Year indicator — top right with decoration */}
            <BottomToUpSoftScaleTransitionView
              lcpOptimization
              className="pointer-events-none absolute -top-2 right-0 select-none"
              delay={groupStartIndex * 100}
            >
              {/* Stamp / seal style */}
              <div className="-rotate-3 inline-block border-[3px] border-double border-neutral-4 rounded px-4 py-2">
                <div className="font-serif text-5xl font-bold leading-none tracking-tighter text-neutral-6">
                  {group.year}
                </div>
                <div className="mt-1 text-center text-[10px] tracking-[4px] text-neutral-6">
                  DIARY
                </div>
              </div>
            </BottomToUpSoftScaleTransitionView>

            {/* Notes list */}
            <div className="relative space-y-4 pt-28">
              {/* Mobile timeline line */}
              <div className="absolute top-28 bottom-0 left-[11px] w-px bg-neutral-3 lg:hidden" />

              {group.notes.map((note) => {
                const date = new Date(note.created)
                const currentIndex = itemIndex++
                return (
                  <BottomToUpSoftScaleTransitionView
                    lcpOptimization
                    className="relative flex items-start gap-4 lg:gap-5"
                    delay={currentIndex * 100}
                    key={note.id}
                  >
                    {/* Desktop: date column */}
                    <div className="hidden w-14 shrink-0 pt-3 text-center lg:block">
                      <div className="text-3xl font-bold leading-none text-neutral-9">
                        {date.getDate()}
                      </div>
                      <div className="mt-1 text-sm text-neutral-6">
                        {format.dateTime(date, { month: 'long' })}
                      </div>
                      <div className="mt-0.5 text-xs text-neutral-6">
                        {format.dateTime(date, { weekday: 'short' })}
                      </div>
                    </div>

                    {/* Mobile: timeline dot */}
                    <div className="absolute left-[7px] top-1 size-[9px] shrink-0 rounded-full border-2 border-neutral-1 bg-neutral-4 lg:hidden" />

                    <div className="min-w-0 flex-1 pl-8 lg:pl-0">
                      {/* Mobile: inline date */}
                      <div className="mb-1.5 text-xs text-neutral-6 lg:hidden">
                        {format.dateTime(date, {
                          month: 'numeric',
                          day: 'numeric',
                          weekday: 'short',
                        })}
                      </div>
                      <NoteListCard note={note} />
                    </div>
                  </BottomToUpSoftScaleTransitionView>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
