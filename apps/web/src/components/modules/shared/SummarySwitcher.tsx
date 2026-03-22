'use client'

import { useTranslations } from 'next-intl'
import type { FC } from 'react'
import { memo } from 'react'

import { ErrorBoundary } from '~/components/common/ErrorBoundary'
import { clsxm } from '~/lib/helper'
import { useAggregationSelector } from '~/providers/root/aggregation-data-provider'

import type { AiSummaryProps } from '../ai/Summary'
import { AISummary } from '../ai/Summary'

export const SummarySwitcher: FC<
  AiSummaryProps & {
    summary?: string
  }
> = memo((props) => {
  const enableSummary = useAggregationSelector((data) => data.ai?.enableSummary)
  const { summary, articleId, lang, variant = 'standalone' } = props

  if (summary && summary.trim().length > 0)
    return (
      <ManualSummary className="my-4" summary={summary} variant={variant} />
    )

  if (!enableSummary) return null

  return (
    <ErrorBoundary variant="inline">
      <div className={variant === 'standalone' ? 'my-4' : ''}>
        <AISummary articleId={articleId} lang={lang} variant={variant} />
      </div>
    </ErrorBoundary>
  )
})

SummarySwitcher.displayName = 'SummarySwitcher'

const ManualSummary: Component<{
  summary: string
  variant?: 'standalone' | 'inline'
}> = ({ className, summary, variant = 'standalone' }) => {
  const t = useTranslations('common')

  if (variant === 'inline') {
    return (
      <div className={clsxm(className)}>
        <div className="mb-2 flex items-center gap-1.5 text-[11px] text-neutral-5">
          <span className="text-accent/70">
            <i className="i-mingcute-sparkles-line text-lg" />
          </span>
          <span>{t('summary_label')}</span>
        </div>
        <div className="text-sm leading-[1.9] text-neutral-6">{summary}</div>
      </div>
    )
  }

  return (
    <div
      className={clsxm(
        'space-y-2 rounded-xl border border-neutral-3 p-4',
        className,
      )}
    >
      <div className="flex items-center">
        <i className="i-mingcute-sparkles-line mr-2 text-lg" />
        {t('summary_label')}
      </div>
      <div className="m-0! text-sm leading-loose text-neutral-9/85">
        {summary}
      </div>
    </div>
  )
}
