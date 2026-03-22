'use client'

import type { Pager } from '@mx-space/api-client'
import { useTranslations } from 'next-intl'
import type { FC } from 'react'

import { Link } from '~/i18n/navigation'

export const PostPagination: FC<{
  pagination: Pager
  sortParams?: string
}> = ({ pagination, sortParams }) => {
  const t = useTranslations('common')
  const href = (page: number) => {
    const params = new URLSearchParams(sortParams || '')
    if (page > 1) params.set('page', String(page))
    const qs = params.toString()
    return `/posts${qs ? `?${qs}` : ''}`
  }

  return (
    <nav
      aria-label="Pagination"
      className="mt-24 flex items-center justify-center gap-6"
    >
      {pagination.hasPrevPage ? (
        <Link
          aria-label={t('pagination_prev')}
          className="text-sm text-accent transition-colors hover:text-accent/80"
          href={href(pagination.currentPage - 1)}
        >
          ← {t('pagination_prev')}
        </Link>
      ) : (
        <span aria-disabled="true" className="text-sm text-neutral-3">
          ← {t('pagination_prev')}
        </span>
      )}

      <span className="text-xs text-neutral-4">
        {t('pagination_page_info', {
          current: pagination.currentPage,
          total: pagination.totalPage,
        })}
      </span>

      {pagination.hasNextPage ? (
        <Link
          aria-label={t('pagination_next')}
          className="text-sm text-accent transition-colors hover:text-accent/80"
          href={href(pagination.currentPage + 1)}
        >
          {t('pagination_next')} →
        </Link>
      ) : (
        <span aria-disabled="true" className="text-sm text-neutral-3">
          {t('pagination_next')} →
        </span>
      )}
    </nav>
  )
}
