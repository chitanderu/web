'use client'

import clsx from 'clsx'
import { typescriptHappyForwardRef } from 'foxact/typescript-happy-forward-ref'
import { atom, useAtomValue } from 'jotai'
import type { HTMLMotionProps } from 'motion/react'
import { AnimatePresence, m } from 'motion/react'
import { useTranslations } from 'next-intl'
import type * as React from 'react'
import type { JSX, PropsWithChildren, ReactNode } from 'react'
import { useId } from 'react'

import { useIsMobile } from '~/atoms/hooks/viewport'
import { useTypeScriptHappyCallback } from '~/hooks/common/use-callback'
import { clsxm } from '~/lib/helper'
import { jotaiStore } from '~/lib/store'
import { usePageScrollDirectionSelector } from '~/providers/root/page-scroll-info-provider'

import { RootPortal } from '../portal'

const fabContainerElementAtom = atom(null as HTMLDivElement | null)

export interface FABConfig {
  icon: JSX.Element
  id: string
  onClick: () => void
}

export const FABBase = typescriptHappyForwardRef(
  (
    props: PropsWithChildren<
      {
        id: string
        show?: boolean
        children: JSX.Element
      } & HTMLMotionProps<'button'>
    >,
    ref: React.ForwardedRef<HTMLButtonElement>,
  ) => {
    const t = useTranslations('common')
    const { children, show = true, ...extra } = props
    const { className, ...rest } = extra

    return (
      <AnimatePresence>
        {show && (
          <m.button
            animate={{ scale: 1, opacity: 1 }}
            aria-label={t('aria_fab')}
            exit={{ scale: 0, opacity: 0 }}
            initial={{ scale: 0, opacity: 0 }}
            ref={ref}
            className={clsxm(
              'mt-2 flex items-center justify-center',
              'size-12 text-lg md:size-10 md:text-base',
              'outline-accent hover:opacity-100 focus:opacity-100 focus:outline-hidden',
              'rounded-xl border border-neutral-5/20 backdrop-blur-lg',
              'bg-neutral-1/80 shadow-lg',

              className,
            )}
            transition={{
              duration: 0.2,
              ease: 'easeInOut',
            }}
            {...rest}
          >
            {children}
          </m.button>
        )}
      </AnimatePresence>
    )
  },
)

export const FABPortable = typescriptHappyForwardRef(
  (
    props: {
      children: React.JSX.Element

      onClick: () => void
      onlyShowInMobile?: boolean
      show?: boolean
    },
    ref: React.ForwardedRef<HTMLButtonElement>,
  ) => {
    const { onClick, children, show = true } = props
    const id = useId()
    const portalElement = useAtomValue(fabContainerElementAtom)
    const isMobile = useIsMobile()
    if (props.onlyShowInMobile && !isMobile) return null
    if (!portalElement) return null

    return (
      <RootPortal to={portalElement}>
        <FABBase id={id} ref={ref} show={show} onClick={onClick}>
          {children}
        </FABBase>
      </RootPortal>
    )
  },
)

export const FABContainer = (props: { children?: ReactNode }) => {
  const isMobile = useIsMobile()

  const shouldHide = usePageScrollDirectionSelector(
    (direction) => isMobile && direction === 'down',
    [isMobile],
  )

  return (
    <div
      data-hide-print
      data-testid="fab-container"
      className={clsx(
        'fixed bottom-[calc(2rem+env(safe-area-inset-bottom))] left-[calc(100vw-3rem-1rem)] z-[9] flex flex-col',
        shouldHide ? 'translate-x-[calc(100%+2rem)]' : '',
        'transition-transform duration-300 ease-in-out',
      )}
      ref={useTypeScriptHappyCallback(
        (el) => jotaiStore.set(fabContainerElementAtom, el),
        [],
      )}
    >
      {props.children}
    </div>
  )
}
