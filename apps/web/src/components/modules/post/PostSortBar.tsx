'use client'

import clsx from 'clsx'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { FC } from 'react'

import { useRouter } from '~/i18n/navigation'

type SortOption = {
  label: string
  sortBy?: string
  orderBy?: string
}

export const PostSortBar: FC<{ totalCount: number }> = ({ totalCount }) => {
  const t = useTranslations('common')
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentSortBy = searchParams.get('sortBy') || ''
  const currentOrderBy = searchParams.get('orderBy') || ''

  const sortOptions: SortOption[] = [
    { label: t('sort_latest') },
    { label: t('sort_oldest'), sortBy: 'created', orderBy: 'asc' },
    { label: t('sort_recently_updated'), sortBy: 'modified', orderBy: 'desc' },
  ]

  const isActive = (option: SortOption) => {
    if (!option.sortBy) return !currentSortBy
    return currentSortBy === option.sortBy && currentOrderBy === option.orderBy
  }

  const handleSort = (option: SortOption) => {
    if (isActive(option)) return
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')
    if (option.sortBy) {
      params.set('sortBy', option.sortBy)
      params.set('orderBy', option.orderBy!)
    } else {
      params.delete('sortBy')
      params.delete('orderBy')
    }
    router.push(`/posts${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <div className="mt-5 flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.06]">
      <span className="text-xs text-neutral-4">
        {t('posts_total_count', { count: totalCount })}
      </span>
      <div className="flex gap-4">
        {sortOptions.map((option) => (
          <button
            aria-current={isActive(option) ? 'page' : undefined}
            key={option.label}
            className={clsx(
              'text-xs transition-colors',
              isActive(option)
                ? 'font-medium text-accent underline underline-offset-[3px]'
                : 'text-neutral-4 hover:text-accent',
            )}
            onClick={() => handleSort(option)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
