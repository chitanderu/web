'use client'

import { useTranslations } from 'next-intl'

import { CreativeCommonsIcon } from '~/components/icons/cc'
import { AIGenBadge } from '~/components/modules/ai/AIGenBadge'
import { TranslationLanguageSwitcher } from '~/components/modules/translation/TranslationLanguageSwitcher'
import { DividerVertical } from '~/components/ui/divider'
import { FloatPopover } from '~/components/ui/float-popover'
import { NumberSmoothTransition } from '~/components/ui/number-transition/NumberSmoothTransition'
import {
  getMoodLabel,
  getWeatherLabel,
  mood2icon,
  weather2icon,
} from '~/lib/meta-icon'
import { useCurrentNoteDataSelector } from '~/providers/note/CurrentNoteDataProvider'

import { CurrentReadingCountingMetaBarItem } from '../shared/MetaBar'

const dividerVertical = <DividerVertical className="mx-2! scale-y-50" />

const sectionBlockClassName = 'flex items-center space-x-1 shrink-0'
export const NoteMetaBar = () => (
  <>
    <NoteMetaWeather />
    <NoteMetaMood />
    <NoteMetaReadCount />
    <NoteMetaLikeCount />
    <NoteMetaCC />
    <NoteMetaAIGen />
    <NoteMetaTranslation />
  </>
)

export const NoteMetaAIGen = () => {
  const aiGen = useCurrentNoteDataSelector((data) => data?.data.meta?.aiGen)
  if (aiGen === undefined || aiGen === null || aiGen === '') return null

  return (
    <>
      {dividerVertical}
      <span className={sectionBlockClassName}>
        <AIGenBadge
          className="border-transparent! bg-transparent px-1.5! py-0!"
          value={aiGen}
        />
      </span>
    </>
  )
}

export const NoteMetaWeather = () => {
  const weather = useCurrentNoteDataSelector((data) => data?.data.weather)
  const t = useTranslations('common')
  if (!weather) return null
  return (
    <>
      {dividerVertical}
      <span className={sectionBlockClassName} key="weather">
        {weather2icon(weather)}
        <span className="font-medium">{getWeatherLabel(weather, t)}</span>
      </span>
    </>
  )
}

export const NoteMetaMood = () => {
  const mood = useCurrentNoteDataSelector((data) => data?.data.mood)
  const t = useTranslations('common')

  if (!mood) return null
  return (
    <>
      {dividerVertical}
      <span className={sectionBlockClassName} key="mood">
        {mood2icon(mood)}
        <span className="font-medium">{getMoodLabel(mood, t)}</span>
      </span>
    </>
  )
}

export const NoteMetaReadCount = () => {
  const read = useCurrentNoteDataSelector((data) => data?.data.count.read)
  if (!read) return null
  return (
    <>
      {dividerVertical}
      <span className={sectionBlockClassName} key="readcount">
        <i className="i-mingcute-book-6-line" />

        <span className="font-medium">
          <NumberSmoothTransition>{read}</NumberSmoothTransition>
        </span>
      </span>
    </>
  )
}

export const NoteMetaLikeCount = () => {
  const like = useCurrentNoteDataSelector((data) => data?.data.count.like)
  if (!like) return null
  return (
    <>
      {dividerVertical}
      <span className={sectionBlockClassName} key="linkcount">
        <i className="i-mingcute-heart-line" />
        <span className="font-medium">
          <NumberSmoothTransition>{like}</NumberSmoothTransition>
        </span>
      </span>
    </>
  )
}

export const NoteMetaCC = () => (
  <NoteMetaCCInner />
)

const NoteMetaCCInner = () => {
  const t = useTranslations('post')

  return (
    <>
      {dividerVertical}
      <span className="inline-flex items-center" key="cc">
        <FloatPopover
          asChild
          mobileAsSheet
          type="tooltip"
          triggerElement={
            <a
              className="inline-flex cursor-pointer items-center text-current"
              href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh"
              rel="noreferrer"
              target="_blank"
            >
              <CreativeCommonsIcon />
            </a>
          }
        >
          {t('copyright_license_tooltip')}
        </FloatPopover>
      </span>
    </>
  )
}

export const NoteMetaReadingCount = () => (
  <CurrentReadingCountingMetaBarItem leftElement={dividerVertical} />
)

export const NoteMetaTranslation = () => {
  const translationData = useCurrentNoteDataSelector((data) => ({
    availableTranslations: (data?.data as any)?.availableTranslations as
      | string[]
      | undefined,
    sourceLang: data?.data.translationMeta?.sourceLang,
  }))

  if (
    !translationData.availableTranslations ||
    translationData.availableTranslations.length === 0
  ) {
    return null
  }

  return (
    <>
      {dividerVertical}
      <span className={sectionBlockClassName}>
        <TranslationLanguageSwitcher
          availableTranslations={translationData.availableTranslations}
          sourceLang={translationData.sourceLang}
        />
      </span>
    </>
  )
}
