'use client'

import clsx from 'clsx'

export const CommentBoxAuthedInputSkeleton = () => {
  const color = 'bg-neutral-3/50'
  return (
    <div className="flex animate-pulse gap-4">
      <div
        className={clsx('size-12 self-end overflow-hidden rounded-full', color)}
      />
      <div className={clsx('h-[150px] w-full rounded-lg', color)} />
    </div>
  )
}
