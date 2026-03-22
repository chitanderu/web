'use client'

import { useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import type { FC } from 'react'
import { memo } from 'react'

import { AutoResizeHeight } from '~/components/modules/shared/AutoResizeHeight'
import { Markdown } from '~/components/ui/markdown'
import { clsxm } from '~/lib/helper'
import { apiClient } from '~/lib/request'

export interface AiSummaryProps {
  articleId: string
  className?: string
  hydrateText?: string
  lang?: string
  variant?: 'standalone' | 'inline'
}

export const AISummary: FC<AiSummaryProps> = memo((props) => {
  const { articleId, hydrateText, lang, variant = 'standalone' } = props
  const locale = useLocale()
  const effectiveLang = lang || locale

  const { data: response, isLoading } = useQuery({
    queryKey: ['ai-summary', articleId, effectiveLang],
    queryFn: async () =>
      apiClient.ai.getSummary({
        articleId,
        lang: effectiveLang,
      }),
    retryDelay: 5000,
    enabled: !hydrateText,
  })

  const Container =
    variant === 'inline' ? InlineSummaryContainer : SummaryContainer

  if (hydrateText) {
    return <Container isLoading={false} summary={hydrateText} />
  }
  return <Container isLoading={isLoading} summary={response?.summary} />
})

// --- Inline variant (for NoticeCard) ---

const InlineSummaryLoadingSkeleton = (
  <div className="space-y-2">
    <span className="block h-3.5 w-full animate-pulse rounded bg-neutral-9/5" />
    <span className="block h-3.5 w-11/12 animate-pulse rounded bg-neutral-9/5" />
    <span className="block h-3.5 w-9/12 animate-pulse rounded bg-neutral-9/5" />
  </div>
)

const InlineSummaryContainer: Component<{
  isLoading: boolean
  summary?: string
}> = (props) => {
  const { className, isLoading, summary } = props
  const t = useTranslations('common')

  return (
    <div data-hide-print className={clsxm(className)}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-5">
          <span className="text-accent/70">
            <i className="i-mingcute-sparkles-line text-lg" />
          </span>
          <span>{t('ai_key_insights')}</span>
        </div>
        {!isLoading && (
          <span className="text-[8px] font-mono tracking-[2px] text-neutral-5">
            AI · GEN
          </span>
        )}
      </div>
      <AutoResizeHeight spring>
        <div
          className="text-sm leading-[1.9] text-neutral-6"
          style={{ textAutospace: 'normal' }}
        >
          {isLoading ? (
            InlineSummaryLoadingSkeleton
          ) : (
            <Markdown disableParsingRawHTML removeWrapper>
              {summary || ''}
            </Markdown>
          )}
        </div>
      </AutoResizeHeight>
    </div>
  )
}

// --- Standalone variant (existing ribbon style) ---

const SummaryLoadingSkeleton = (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <div className="h-px w-8 bg-gradient-to-r from-accent/30 to-transparent" />
      <div className="flex items-center space-x-1">
        <span className="inline-block size-2 animate-pulse rounded-full bg-accent/70 dark:bg-accent/80" />
        <span className="inline-block size-2 animate-pulse rounded-full bg-accent/40 delay-150 dark:bg-accent/50" />
        <span className="inline-block size-2 animate-pulse rounded-full bg-accent/20 delay-300 dark:bg-accent/30" />
      </div>
    </div>
    <div className="space-y-3">
      <span className="block h-4 w-full animate-pulse rounded-md bg-gradient-to-r from-neutral-9/10 via-accent/10 to-neutral-9/5" />
      <span className="block h-4 w-11/12 animate-pulse rounded-md bg-gradient-to-r from-neutral-9/10 via-accent/10 to-neutral-9/5" />
      <span className="block h-4 w-10/12 animate-pulse rounded-md bg-gradient-to-r from-neutral-9/10 via-accent/10 to-neutral-9/5" />
    </div>
    <div className="flex justify-start pt-2">
      <div className="h-px w-6 animate-pulse bg-gradient-to-r from-accent/30 to-transparent" />
    </div>
  </div>
)

const SummaryContainer: Component<{
  isLoading: boolean
  summary?: string
}> = (props) => {
  const { className, isLoading, summary } = props
  const t = useTranslations('common')

  return (
    <div
      data-hide-print
      className={clsxm(
        'relative my-8 -mx-4 lg:-mx-8 overflow-hidden -mb-36',
        '[mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)]',
        className,
      )}
    >
      <div className="relative -skew-x-2 transform bg-gradient-to-b from-accent/10 via-accent/5 to-transparent px-8 py-6 pb-32 transition-all duration-300">
        <div className="skew-x-2 transform">
          {!isLoading && (
            <div className="absolute right-8 top-3 flex items-center gap-2 text-xs text-neutral-9/40">
              <span className="size-2 animate-pulse rounded-full bg-accent/60" />
              <span className="font-mono">AI·GEN</span>
            </div>
          )}
          <div className="max-w-4xl pt-3">
            <h3 className="mb-3 flex items-center gap-2 text-base font-medium leading-tight text-accent">
              <i className="i-mingcute-ai-fill text-lg" />
              {t('ai_key_insights')}
            </h3>
            <AutoResizeHeight spring>
              <div
                className="space-y-2 text-sm leading-relaxed text-neutral-9/80"
                style={{ textAutospace: 'normal' }}
              >
                {isLoading ? (
                  SummaryLoadingSkeleton
                ) : (
                  <Markdown disableParsingRawHTML removeWrapper>
                    {summary || ''}
                  </Markdown>
                )}
              </div>
            </AutoResizeHeight>
          </div>
        </div>
      </div>
    </div>
  )
}
