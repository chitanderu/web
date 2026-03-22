import clsx from 'clsx'
import type { FC, PropsWithChildren } from 'react'
import { tv } from 'tailwind-variants'

import { MotionButtonBase } from './MotionButton'

const variantStyles = tv({
  base: clsx(
    'inline-flex select-none cursor-default items-center gap-2 justify-center rounded-xl py-2 px-3 text-sm outline-offset-2',
    'transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
    'active:translate-y-px',
  ),
  variants: {
    variant: {
      primary: clsx(
        'bg-accent/8 border border-accent/30 text-accent font-medium',
        'hover:bg-accent/12 hover:border-accent/45',
        'active:bg-accent/16 active:border-accent/50',
        'disabled:bg-accent/4 disabled:border-accent/15 disabled:text-accent/40 disabled:cursor-not-allowed disabled:translate-y-0',
      ),
      secondary: clsx(
        'bg-transparent border border-black/10 text-neutral-9 dark:border-white/10',
        'hover:bg-black/[0.02] hover:border-black/15 dark:hover:bg-white/4 dark:hover:border-white/15',
        'active:bg-black/[0.04] active:border-black/[0.18] dark:active:bg-white/6 dark:active:border-white/[0.18]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0',
      ),
      ghost: clsx(
        'bg-transparent border border-transparent text-neutral-7',
        'hover:bg-black/[0.03] hover:text-neutral-9 dark:hover:bg-white/4',
        'active:bg-black/[0.06] dark:active:bg-white/6',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0',
      ),
    },
  },
})
type NativeButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string
}

type SharedProps = {
  variant?: 'primary' | 'secondary' | 'ghost'
  className?: string
  isLoading?: boolean
}
type ButtonProps = SharedProps & NativeButtonProps

export const StyledButton: FC<ButtonProps> = ({
  variant = 'primary',
  className,
  isLoading,
  href,

  ...props
}) => {
  const Wrapper = isLoading ? LoadingButtonWrapper : 'div'
  return (
    <Wrapper>
      <MotionButtonBase
        className={variantStyles({
          variant,
          className,
        })}
        {...(props as any)}
      />
    </Wrapper>
  )
}

const LoadingButtonWrapper: FC<PropsWithChildren> = ({ children }) => (
  <div className="relative">
    {children}

    <div className="absolute inset-0 z-[1] flex items-center justify-center">
      <div className="loading loading-spinner size-5" />
    </div>
  </div>
)
