'use client'

import type { SayModel } from '@mx-space/api-client'
import type { MarkdownToJSX } from 'markdown-to-jsx'
import Markdown from 'markdown-to-jsx'
import { m } from 'motion/react'
import { useTranslations } from 'next-intl'
import { memo, useMemo } from 'react'
import Masonry from 'react-responsive-masonry'

import { useIsOwnerLogged } from '~/atoms/hooks/owner'
import { useIsMobile } from '~/atoms/hooks/viewport'
import { LoadMoreIndicator } from '~/components/modules/shared/LoadMoreIndicator'
import { RelativeTime } from '~/components/ui/relative-time'
import { BottomToUpSoftScaleTransitionView } from '~/components/ui/transition'
import { useIsDark } from '~/hooks/common/use-is-dark'
import { addAlphaToHSL, getColorScheme, stringToHue } from '~/lib/color'
import { clsxm } from '~/lib/helper'

import { useSayListQuery, useSayModal } from './hooks'

export const SayMasonry = () => {
  const { fetchNextPage, hasNextPage, data } = useSayListQuery()

  const isMobile = useIsMobile()

  if (!data) return null

  const list = data.pages
    .flatMap((page) => page.data)
    .map((say) => ({
      text: say.text,
      item: say,
      id: say.id,
    }))

  return (
    <>
      <Masonry columnsCount={isMobile ? 1 : 2} gutter="1rem">
        {list.map((item, index) => (
          <Item index={index} item={item.item} key={item.id} />
        ))}
      </Masonry>
      {hasNextPage && (
        <LoadMoreIndicator className="mt-12" onLoading={fetchNextPage}>
          <BottomToUpSoftScaleTransitionView>
            <Masonry columnsCount={isMobile ? 1 : 2}>
              {placeholderData.map((item) => (
                <SaySkeleton key={item.id} />
              ))}
            </Masonry>
          </BottomToUpSoftScaleTransitionView>
        </LoadMoreIndicator>
      )}
    </>
  )
}

const placeholderData = Array.from({ length: 10 }).map((_, index) => ({
  index,
  text: '',
  id: index.toFixed(0),
  item: {} as SayModel,
}))
const SaySkeleton = memo(() => (
  <div className="relative overflow-hidden rounded-xl border border-black/5 bg-[#fefefb] px-5 py-[18px] pt-[14px] shadow-[0_1px_4px_rgba(0,0,0,0.05)] ring-[0.5px] ring-black/3 dark:border-white/8 dark:bg-neutral-2 dark:ring-white/5">
    <div className="mb-2 mt-5 h-6 w-full rounded bg-neutral-4/50" />
    <div className="flex text-sm text-neutral-9/60 md:justify-between">
      <div className="mb-2 h-4 w-14 rounded bg-neutral-4/50 md:mb-0" />
      <div className="ml-auto text-right">
        <div className="h-4 w-1/4 rounded bg-neutral-4/50" />
      </div>
    </div>
  </div>
))
SaySkeleton.displayName = 'SaySkeleton'

const options = {
  disableParsingRawHTML: true,
  forceBlock: true,
} satisfies MarkdownToJSX.Options

const Item = memo<{
  item: SayModel
  index: number
}>(({ item: say, index: i }) => {
  const t = useTranslations('says')

  const hasSource = !!say.source
  const hasAuthor = !!say.author
  const { dark: darkColors, light: lightColors } = useMemo(
    () => getColorScheme(stringToHue(say.id)),
    [say.id],
  )
  const isDark = useIsDark()

  const isLogged = useIsOwnerLogged()
  const present = useSayModal()

  const accentColor = isDark ? darkColors.accent : lightColors.accent

  return (
    <m.blockquote
      layout
      animate={{ opacity: 1, y: 0 }}
      className="group relative w-full overflow-hidden rounded-xl border border-black/5 bg-[#fefefb] px-5 py-[18px] pt-[14px] shadow-[0_1px_4px_rgba(0,0,0,0.05)] ring-[0.5px] ring-black/3 dark:border-white/8 dark:bg-neutral-2 dark:ring-white/5"
      initial={{ opacity: 0, y: 20 }}
      key={say.id}
      style={{
        backgroundImage: `linear-gradient(150deg, ${addAlphaToHSL(
          accentColor,
          isDark ? 0.08 : 0.045,
        )} 0%, transparent 55%)`,
      }}
      transition={{
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
        delay: i * 0.05,
      }}
    >
      <span
        className="pointer-events-none absolute left-3 top-1.5 z-0 select-none font-serif text-[48px] leading-none"
        style={{
          color: addAlphaToHSL(accentColor, isDark ? 0.15 : 0.12),
        }}
      >
        {'\u201C'}
      </span>
      <Markdown
        className="relative z-[1] mb-2 pl-1 pt-4"
        options={options}
      >{`${say.text}`}</Markdown>
      <div className="relative z-[1] flex flex-wrap pl-1 text-sm text-neutral-9/60 md:justify-between">
        <div className="mb-2 w-full md:mb-0 md:w-auto">
          <RelativeTime date={say.created} />
        </div>
        <div className="w-full text-right md:ml-auto md:w-auto">
          <div>
            {hasSource && `\u51FA\u81EA\u201C${say.source}\u201D`}
            {hasSource && hasAuthor && ', '}
            {hasAuthor && t('author_label', { author: say.author! })}
            {!hasAuthor && !hasSource && t('owner_says')}
          </div>
        </div>
      </div>
      {isLogged && (
        <button
          className={clsxm(
            'absolute right-2 top-2 bg-[#fefefb] dark:bg-neutral-2',
            'center flex size-6 rounded-full text-accent opacity-0 ring-1 ring-black/5 dark:ring-white/8 duration-200 group-hover:opacity-100',
          )}
          onClick={() => present(say)}
        >
          <i className="i-mingcute-quill-pen-line" />
          <span className="sr-only">edit</span>
        </button>
      )}
    </m.blockquote>
  )
})
Item.displayName = 'Item'
