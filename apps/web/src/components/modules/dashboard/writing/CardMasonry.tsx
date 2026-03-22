import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry'

import { useMaskScrollArea } from '~/hooks/shared/use-mask-scrollarea'
import { clsxm } from '~/lib/helper'

const columnsCountBreakPoints = {
  0: 1,
  600: 2,
  1024: 3,
  1280: 3,
}

export interface CardProps<T> {
  className?: string
  data?: T

  description: string
  slots?: Partial<{
    right: (data?: T) => ReactNode
    middle: (data?: T) => ReactNode
    footer: (data?: T) => ReactNode
  }>

  title: ReactNode
}
export interface CardMasonryProps<T> {
  children: (data: T) => ReactNode

  data: T[]
}
export const CardMasonry = <T,>(props: CardMasonryProps<T>) => (
  <div className="m-auto max-w-[1200px]">
    <ResponsiveMasonry columnsCountBreakPoints={columnsCountBreakPoints}>
      <Masonry gutter="24px">
        {props.data.map((data) => props.children(data))}
      </Masonry>
    </ResponsiveMasonry>
  </div>
)

export function Card<T>(props: CardProps<T>) {
  const [scrollContainerRef, scrollClassname] =
    useMaskScrollArea<HTMLDivElement>()

  const { slots, className, title, description, data } = props

  return (
    <div
      className={clsxm(
        'card-shadow relative flex h-[176px] w-full flex-col rounded-md bg-neutral-1 px-4 py-5 duration-200 dark:hover:ring-1 dark:hover:ring-neutral-4',
        className,
      )}
    >
      <div className="flex grow flex-col">
        <div className="line-clamp-2 text-xl font-semibold text-neutral-9">
          {title}
        </div>
        {slots?.middle && (
          <div className="mt-2 text-sm text-neutral-8">
            {slots.middle?.(data)}
          </div>
        )}
        <div
          ref={scrollContainerRef}
          className={clsx(
            'scrollbar-none mt-2 h-0 grow overflow-hidden break-all text-sm text-neutral-7',
            scrollClassname,
          )}
        >
          {description?.slice(0, 300)}
        </div>

        {slots?.footer && (
          <div className="mt-2 text-sm text-neutral-7">
            {slots.footer?.(data)}
          </div>
        )}
      </div>
      {slots?.right?.(data)}
    </div>
  )
}
