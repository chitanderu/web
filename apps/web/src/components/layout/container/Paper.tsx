import type { JSX } from 'react'

import { clsxm } from '~/lib/helper'

export const Paper: Component<{
  as?: keyof JSX.IntrinsicElements | Component
}> = ({ children, className, as: As = 'main' }) => (
  <As
    className={clsxm(
      'relative bg-neutral-1 dark:bg-neutral-2 md:col-start-1 lg:col-auto',
      '-m-4 p-[2rem_1rem] md:m-0 lg:p-[30px_45px]',
      'rounded-[0_6px_6px_0] border-neutral-3/70 lg:border',
      'shadow-perfect perfect-sm',
      'note-layout-main',
      'min-w-0',
      'print:border-none! print:bg-transparent! print:shadow-none!',
      className,
    )}
  >
    {children}
  </As>
)
