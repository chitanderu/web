'use client'

import type { Pager } from '@mx-space/api-client'
import { useTranslations } from 'next-intl'
import type { FC } from 'react'

import { MotionButtonBase } from '~/components/ui/button'
import { Link } from '~/i18n/navigation'

const btnClass =
  'rounded-full border-[2px] border-accent/50 px-5 py-2 text-sm text-accent hover:border-accent hover:bg-accent/5 transition-colors'

const disabledClass =
  'rounded-full border border-neutral-3 px-5 py-2 text-sm text-neutral-6 cursor-not-allowed opacity-40'

export const NoteListPagination: FC<{ pagination: Pager }> = ({
  pagination,
}) => {
  const t = useTranslations('note')

  return (
    <section className="mt-10 flex items-center justify-between border-t border-neutral-3 pt-6">
      {pagination.hasPrevPage ? (
        <Link href={`/notes?page=${pagination.currentPage - 1}`}>
          <MotionButtonBase className={btnClass} tabIndex={-1}>
            {`← ${t('newer_notes')}`}
          </MotionButtonBase>
        </Link>
      ) : (
        <span className={disabledClass}>{`← ${t('newer_notes')}`}</span>
      )}

      <span className="text-sm text-neutral-6">
        {t('pagination_page', { page: pagination.currentPage })}
      </span>

      {pagination.hasNextPage ? (
        <Link href={`/notes?page=${pagination.currentPage + 1}`}>
          <MotionButtonBase className={btnClass} tabIndex={-1}>
            {`${t('older_notes')} →`}
          </MotionButtonBase>
        </Link>
      ) : (
        <span className={disabledClass}>{`${t('older_notes')} →`}</span>
      )}
    </section>
  )
}
