'use client'

import { useTranslations } from 'next-intl'
import type { FC } from 'react'

import { useIsMobile } from '~/atoms/hooks/viewport'
import { Avatar } from '~/components/ui/avatar'
import { Divider } from '~/components/ui/divider'
import { FloatPopover } from '~/components/ui/float-popover'
import { Link } from '~/i18n/navigation'
import { routeBuilder, Routes } from '~/lib/route-builder'
import { useCurrentNoteDataSelector } from '~/providers/note/CurrentNoteDataProvider'

import { NoteTopicDetail } from './NoteTopicDetail'
import { NoteTopicMarkdownRender } from './NoteTopicMarkdownRender'

const textToBigCharOrWord = (name: string | undefined) => {
  if (!name) {
    return ''
  }
  const splitOnce = name.split(' ')[0]
  const bigChar = splitOnce.length > 4 ? name[0] : splitOnce
  return bigChar
}

export const NoteBottomTopic: FC = () => {
  const t = useTranslations('note')
  const topic = useCurrentNoteDataSelector((state) => state?.data.topic)
  const isMobile = useIsMobile()
  if (!topic) return null
  const { icon, name, introduce } = topic

  return (
    <div data-hide-print>
      <div className="font-medium">
        <strong>{t('note_in_topic')}</strong>
      </div>
      <Divider />
      <div className="flex items-center gap-4">
        <Avatar
          alt={t('topic_avatar_alt', { name })}
          className="shrink-0"
          imageUrl={icon}
          radius="full"
          shadow={false}
          size={60}
          text={textToBigCharOrWord(name)}
        />
        <div className="flex grow flex-col self-start">
          <span className="mb-2 font-medium">
            <FloatPopover
              mobileAsSheet
              strategy="absolute"
              triggerElement={
                isMobile ? (
                  <span>{name}</span>
                ) : (
                  <Link
                    href={routeBuilder(Routes.NoteTopic, {
                      slug: topic.slug,
                    })}
                  >
                    <span>{name}</span>
                  </Link>
                )
              }
            >
              <NoteTopicDetail topic={topic} />
            </FloatPopover>
          </span>

          <div className="line-clamp-2 text-sm opacity-80">
            <NoteTopicMarkdownRender>{introduce}</NoteTopicMarkdownRender>
          </div>
        </div>
      </div>
    </div>
  )
}
