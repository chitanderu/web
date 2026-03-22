import clsx from 'clsx'

export const toastStyles = {
  toast: clsx(
    'group relative flex w-full items-center gap-4 rounded-xl p-4',
    'border-[0.5px] border-neutral-9/40 bg-neutral-1',
    'shadow-[0_8px_16px_-4px_rgba(0,0,0,0.08)]', // Lighter shadow for light mode
    'dark:border-neutral-3/60 dark:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.4)]',
    'min-w-[320px] max-w-md',
  ),
  title: 'text-base font-medium text-neutral-9',
  description: 'text-sm text-neutral-9/60 mt-1',
  content: 'flex min-w-0 flex-1 flex-col justify-center',
  icon: clsx(
    'relative flex size-10 shrink-0 items-center justify-center rounded-full',
    // Success - Green
    '[li[data-type="success"]_&]:bg-green-100 [li[data-type="success"]_&]:text-green-600',
    '[li[data-type="success"]_&]:dark:bg-green-500/15 [li[data-type="success"]_&]:dark:text-green-400',

    // Error - Red
    '[li[data-type="error"]_&]:bg-red-100 [li[data-type="error"]_&]:text-red-600',
    '[li[data-type="error"]_&]:dark:bg-red-500/15 [li[data-type="error"]_&]:dark:text-red-400',

    // Warning - Orange
    '[li[data-type="warning"]_&]:bg-orange-100 [li[data-type="warning"]_&]:text-orange-600',
    '[li[data-type="warning"]_&]:dark:bg-orange-500/15 [li[data-type="warning"]_&]:dark:text-orange-400',

    // Info - Blue
    '[li[data-type="info"]_&]:bg-blue-100 [li[data-type="info"]_&]:text-blue-600',
    '[li[data-type="info"]_&]:dark:bg-blue-500/15 [li[data-type="info"]_&]:dark:text-blue-400',

    // Icon Size wrapper for the inner icon
    '[&>i]:text-xl',
  ),
  actionButton: clsx(
    'h-8 shrink-0 rounded-lg px-3 text-xs font-semibold',
    'transition-all duration-200',
    'bg-neutral-9 text-white hover:bg-neutral-9/90',
    'dark:bg-white dark:text-neutral-9 dark:hover:bg-neutral-3',
  ),
  cancelButton: clsx(
    'h-8 rounded-lg px-3 text-xs font-medium',
    'border-border border bg-neutral-1 text-neutral-9/80',
    'hover:bg-neutral-2 hover:text-neutral-9',
    'transition-colors duration-200',
  ),
  closeButton: clsx(
    'absolute right-4 top-4 rounded-md p-1',
    'text-neutral-9/40 hover:bg-neutral-2 hover:text-neutral-9',
    'transition-all duration-200',
    'opacity-0 group-hover:opacity-100',
  ),
}
