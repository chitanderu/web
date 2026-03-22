'use client'

import type { TranslationMeta } from '@mx-space/api-client'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Children, type FC, type ReactNode, useCallback } from 'react'

import { useViewingOriginal } from '~/atoms/translation'
import { TranslatedBadge } from '~/components/modules/translation/TranslatedBadge'
import { clsxm } from '~/lib/helper'

interface NoticeCardProps {
  children: ReactNode
  className?: string
}

export const NoticeCard: FC<NoticeCardProps> = ({ children, className }) => {
  const validChildren = Children.toArray(children).filter(Boolean)
  if (validChildren.length === 0) return null

  return (
    <div
      className={clsxm(
        'overflow-hidden rounded bg-white/40 border border-black/[0.03]',
        'dark:bg-white/5 dark:border-white/5',
        className,
      )}
    >
      {validChildren.map((child, index) => (
        <div key={index}>
          {index > 0 && (
            <div className="h-px bg-black/[0.03] dark:bg-white/[0.03]" />
          )}
          {child}
        </div>
      ))}
    </div>
  )
}

interface NoticeCardItemProps {
  children: ReactNode
  variant?: 'default' | 'summary'
}

export const NoticeCardItem: FC<NoticeCardItemProps> = ({
  children,
  variant = 'default',
}) => {
  if (variant === 'summary') {
    return (
      <div className="relative px-[18px] py-3.5 bg-gradient-to-br from-accent/[0.04] via-[rgba(255,228,180,0.06)] to-accent/[0.02] dark:from-accent/[0.06] dark:via-[rgba(255,228,180,0.04)] dark:to-accent/[0.03]">
        <div
          className="pointer-events-none absolute -right-5 -top-5 size-[120px] dark:opacity-50"
          style={{
            background:
              'radial-gradient(circle, rgba(255,228,180,0.12), transparent 70%)',
          }}
        />
        <div className="relative">{children}</div>
      </div>
    )
  }

  return <div className="px-[18px] py-3">{children}</div>
}

export const TranslationNoticeContent: FC<{
  translationMeta: TranslationMeta
}> = ({ translationMeta }) => {
  const t = useTranslations('translation')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isViewingOriginal = useViewingOriginal()

  const handleToggle = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (isViewingOriginal) {
      params.delete('lang')
    } else {
      params.set('lang', 'original')
    }
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }, [router, pathname, searchParams, isViewingOriginal])

  return (
    <div className="flex items-center justify-between text-[11px] text-neutral-6">
      <div className="flex items-center gap-2">
        <span className="opacity-60">
          <i className="i-mingcute-globe-line text-base" />
        </span>
        <span>
          {isViewingOriginal ? t('original_mode') : t('banner_title')}
        </span>
        {!isViewingOriginal && (
          <TranslatedBadge translationMeta={translationMeta} />
        )}
      </div>
      <button
        className="text-accent underline underline-offset-2"
        onClick={handleToggle}
      >
        {isViewingOriginal
          ? tCommon('view_translation')
          : t('banner_viewOriginal')}
      </button>
    </div>
  )
}
