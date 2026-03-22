import { atom, useStore } from 'jotai'
import type { FC, PropsWithChildren, ReactNode } from 'react'
import * as React from 'react'
import { useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { Drawer } from 'vaul'

import { CloseIcon } from '~/components/icons/close'

import { SheetContext } from './context'

export interface PresentSheetProps {
  content: ReactNode | FC
  defaultOpen?: boolean
  dismissible?: boolean
  onOpenChange?: (value: boolean) => void
  open?: boolean
  title?: ReactNode
  triggerAsChild?: boolean

  zIndex?: number
}

export const sheetStackAtom = atom([] as HTMLDivElement[])

export type SheetRef = {
  dismiss: () => void
}

export const PresentSheet = ({
  ref,
  ...props
}: PropsWithChildren<PresentSheetProps> & {
  ref?: React.RefObject<SheetRef | null>
}) => {
  const {
    content,
    children,
    zIndex = 1000,
    title,
    dismissible = true,
    defaultOpen,
    triggerAsChild,
  } = props

  const [isOpen, setIsOpen] = useState(props.open ?? defaultOpen)

  useImperativeHandle(ref, () => ({
    dismiss: () => {
      setIsOpen(false)
    },
  }))

  const nextRootProps = useMemo(() => {
    const nextProps = {
      onOpenChange: setIsOpen,
    } as any
    if (isOpen !== undefined) {
      nextProps.open = isOpen
    }

    if (props.onOpenChange !== undefined) {
      nextProps.onOpenChange = (v: boolean) => {
        setIsOpen(v)
        props.onOpenChange?.(v)
      }
    }

    return nextProps
  }, [props, isOpen, setIsOpen])

  useEffect(() => {
    if (props.open !== undefined) {
      setIsOpen(props.open)
    }
  }, [props.open])
  const [holderRef, setHolderRef] = useState<HTMLDivElement | null>()
  const store = useStore()

  useEffect(() => {
    const holder = holderRef
    if (!holder) return
    store.set(sheetStackAtom, (p) => p.concat(holder))

    return () => {
      store.set(sheetStackAtom, (p) => p.filter((item) => item !== holder))
    }
  }, [holderRef, store])

  const { Root } = Drawer

  const overlayZIndex = zIndex - 1
  const contentZIndex = zIndex

  return (
    <Root dismissible={dismissible} {...nextRootProps}>
      {!!children && (
        <Drawer.Trigger asChild={triggerAsChild}>{children}</Drawer.Trigger>
      )}
      <Drawer.Portal>
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 flex max-h-[calc(100svh-5rem)] flex-col bg-[#fefefb] dark:bg-neutral-2"
          style={{
            zIndex: contentZIndex,
          }}
        >
          {/* Gradient top edge */}
          <div
            aria-hidden
            className="h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent 10%, rgba(0,0,0,0.06) 30%, rgba(0,0,0,0.06) 70%, transparent 90%)',
            }}
          />

          {/* Header: title + close */}
          {(title || dismissible) && (
            <div className="flex items-center justify-between px-5 pt-4">
              {title ? (
                <Drawer.Title className="min-w-0 truncate pr-8 text-[15px] font-medium leading-normal">
                  {title}
                </Drawer.Title>
              ) : (
                <span />
              )}
              {dismissible && (
                <button
                  className="flex size-6 shrink-0 items-center justify-center text-neutral-5 transition-colors duration-200 hover:text-neutral-8"
                  type="button"
                  onClick={() => setIsOpen(false)}
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          )}

          <div className="min-h-0 shrink grow overflow-auto px-5 pb-5 pt-4">
            <SheetContext
              value={useMemo(
                () => ({
                  dismiss() {
                    setIsOpen(false)
                  },
                }),
                [setIsOpen],
              )}
            >
              {typeof content === 'function'
                ? React.createElement(content)
                : content}
            </SheetContext>
            <div ref={setHolderRef} />
          </div>
        </Drawer.Content>
        <Drawer.Overlay
          className="fixed inset-0 bg-neutral-9/25"
          style={{
            zIndex: overlayZIndex,
          }}
        />
      </Drawer.Portal>
    </Root>
  )
}
