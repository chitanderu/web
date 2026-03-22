import { clsxm } from '~/lib/helper'

export const Skeleton: Component = ({ className }) => (
  <div className={clsxm('flex animate-pulse flex-col gap-3', className)}>
    <div className="h-6 w-full rounded-lg bg-neutral-3" />
    <div className="h-6 w-full rounded-lg bg-neutral-3" />
    <div className="h-6 w-full rounded-lg bg-neutral-3" />
    <div className="h-6 w-full rounded-lg bg-neutral-3" />
    <span className="sr-only">Loading...</span>
  </div>
)
