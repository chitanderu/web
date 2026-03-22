'use client'

import type { TranslationMeta } from '@mx-space/api-client'
import { clsx } from 'clsx'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback } from 'react'

import { useTranslationPending, useViewingOriginal } from '~/atoms/translation'

import { TranslatedBadge } from './TranslatedBadge'

interface TranslationBannerProps {
  translationMeta: TranslationMeta
  variant?: 'default' | 'borderless'
}

export function TranslationBanner({
  translationMeta,
  variant = 'default',
}: TranslationBannerProps) {
  const t = useTranslations('translation')
  const tCommon = useTranslations('common')
  const isPending = useTranslationPending()
  const isViewingOriginal = useViewingOriginal()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleViewOriginal = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('lang', 'original')
    router.replace(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  const handleViewTranslation = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('lang')
    const queryString = params.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname)
  }, [router, pathname, searchParams])

  const isBorderless = variant === 'borderless'

  return (
    <div className="mb-8 overflow-hidden">
      <div
        className={clsx(
          'group relative flex items-center justify-between overflow-hidden transition-colors',
          !isBorderless && [
            'rounded-lg border px-4 py-3 shadow-xs backdrop-blur-md',
            isPending
              ? 'border-amber-200/50 bg-amber-50/50 dark:border-amber-900/30! dark:bg-amber-950/10'
              : 'border-transparent bg-neutral-1/50',
          ],
        )}
      >
        <div className="flex w-full items-center gap-4">
          {/* Icon Wrapper */}
          <div
            className={clsx(
              'flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-inner',
              isPending
                ? 'from-amber-100 to-amber-200/50 text-amber-600 dark:from-amber-900/40 dark:to-amber-800/20 dark:text-amber-400'
                : isViewingOriginal
                  ? 'from-neutral-2 to-neutral-3/50 text-neutral-7'
                  : 'from-sky-100 to-sky-200/50 text-sky-600 dark:from-sky-900/40 dark:to-sky-800/20 dark:text-sky-400',
            )}
          >
            {isPending ? (
              <i className="i-mingcute-loading-line animate-spin text-xl" />
            ) : isViewingOriginal ? (
              <i className="i-mingcute-document-line text-xl" />
            ) : (
              <i className="i-mingcute-translate-2-line text-xl" />
            )}
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-9">
                {isPending
                  ? t('optimizing')
                  : isViewingOriginal
                    ? t('original_mode')
                    : t('banner_title')}
              </span>
              {!isPending && !isViewingOriginal && (
                <TranslatedBadge translationMeta={translationMeta} />
              )}

              <button
                className="ml-auto inline-block text-sm font-medium text-neutral-9 underline decoration-neutral-4 underline-offset-2 transition-colors hover:text-sky-600 hover:decoration-sky-300 dark:hover:text-sky-400 md:hidden"
                type="button"
                onClick={
                  isViewingOriginal ? handleViewTranslation : handleViewOriginal
                }
              >
                {isViewingOriginal
                  ? tCommon('view_translation')
                  : t('banner_viewOriginal')}
              </button>
            </div>

            <div className="mt-0.5 flex w-full flex-1 items-center gap-3 text-xs text-neutral-7">
              {isPending ? (
                <span>{t('content_updated')}</span>
              ) : (
                <>
                  <span>
                    {isViewingOriginal
                      ? t('viewing_original')
                      : t('banner_description')}
                  </span>
                  {!isPending && (
                    <div className="hidden flex-1 items-center justify-end md:flex">
                      <button
                        className="font-medium text-neutral-9 underline decoration-neutral-4 underline-offset-2 transition-colors hover:text-sky-600 hover:decoration-sky-300 dark:hover:text-sky-400"
                        type="button"
                        onClick={
                          isViewingOriginal
                            ? handleViewTranslation
                            : handleViewOriginal
                        }
                      >
                        {isViewingOriginal
                          ? tCommon('view_translation')
                          : t('banner_viewOriginal')}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
