import type { DetailedHTMLProps, InputHTMLAttributes } from 'react'

import { useInputComposition } from '~/hooks/common/use-input-composition'
import { clsxm } from '~/lib/helper'

// This composition handler is not perfect
// @see https://foxact.skk.moe/use-composition-input
export const Input = ({
  ref,
  className,
  ...props
}: DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>) => {
  const inputProps = useInputComposition(props)
  return (
    <input
      ref={ref as any}
      className={clsxm(
        'min-w-0 flex-auto appearance-none rounded-lg border ring-accent/20 duration-200 sm:text-sm lg:text-base',
        'bg-neutral-1 px-3 py-[calc(.5rem-1px)] placeholder:text-neutral-6 focus:outline-hidden focus:ring-2',
        'border-border',
        'focus:border-accent/80! focus:bg-accent/5!',
        props.type === 'password'
          ? 'font-mono placeholder:font-sans'
          : 'font-sans',
        className,
      )}
      {...props}
      {...inputProps}
    />
  )
}
Input.displayName = 'Input'
