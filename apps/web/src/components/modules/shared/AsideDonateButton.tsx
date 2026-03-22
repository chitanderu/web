'use client'

import { Dialog } from '@base-ui/react/dialog'
import { atom, useAtomValue, useSetAtom } from 'jotai'
import type { HTMLMotionProps } from 'motion/react'
import { AnimatePresence, m } from 'motion/react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { useIsMobile } from '~/atoms/hooks/viewport'
import { ImpressionView } from '~/components/common/ImpressionTracker'
import { RiUserHeartLine } from '~/components/icons/user-heart'
import { MotionButtonBase } from '~/components/ui/button'
import { ModalOverlay } from '~/components/ui/modal/stacked/overlay'
import { PresentSheet } from '~/components/ui/sheet'
import { TrackerAction } from '~/constants/tracker'
import { useIsClient } from '~/hooks/common/use-is-client'
import { clsxm } from '~/lib/helper'
import { useAppConfigSelector } from '~/providers/root/aggregation-data-provider'

import { ActionAsideIcon } from './ActionAsideContainer'

const positionAtom = atom({
  x: 0,
  y: 0,
})
const overlayShowAtom = atom(false)

export const AsideDonateButton = () => {
  const isClient = useIsClient()
  const donate = useAppConfigSelector((config) => config.module?.donate)

  const overlayOpen = useAtomValue(overlayShowAtom)

  if (!isClient) return null
  if (!donate || !donate.enable) return null

  return (
    <>
      <DonateButtonBelow />
      <Dialog.Root open={overlayOpen}>
        <Dialog.Portal keepMounted>
          <div>
            <AnimatePresence>
              {overlayOpen && (
                <>
                  <ModalOverlay />
                  <Dialog.Popup className="center fixed inset-0 z-[999] flex flex-col">
                    <DonateContent />

                    <DonateButtonTop />
                  </Dialog.Popup>
                </>
              )}
            </AnimatePresence>
          </div>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}

const DonateButtonBelow = () => {
  const setPosition = useSetAtom(positionAtom)
  const setOverlayShow = useSetAtom(overlayShowAtom)

  const [sheetOpen, setSheetOpen] = useState(false)
  const isMobile = useIsMobile()

  return (
    <>
      <DonateButtonInternal
        onClick={() => {
          setSheetOpen(true)
        }}
        onMouseEnter={(e) => {
          if (isMobile) return
          const $el = e.target as HTMLButtonElement
          const rect = $el.getBoundingClientRect()
          setPosition({
            x: rect.left,
            y: rect.top,
          })

          setOverlayShow(true)
        }}
      />
      {isMobile && (
        <PresentSheet
          dismissible
          content={DonateContent}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      )}
    </>
  )
}

const DonateButtonTop = () => {
  const setOverlayShow = useSetAtom(overlayShowAtom)
  const buttonPos = useAtomValue(positionAtom)
  return (
    <ImpressionView
      action={TrackerAction.Impression}
      trackerMessage="Donate Show"
    >
      <DonateButtonInternal
        className="text-red-400 focus-visible:shadow-none!"
        exit={{
          opacity: 0,
        }}
        style={{
          position: 'fixed',
          left: buttonPos.x,
          top: buttonPos.y,
          zIndex: 999,
          margin: 0,
        }}
        onMouseLeave={() => {
          setOverlayShow(false)
        }}
      />
    </ImpressionView>
  )
}

const DonateButtonInternal: Component<HTMLMotionProps<'button'>> = ({
  className,

  ...props
}) => {
  const t = useTranslations('common')
  const donate = useAppConfigSelector((config) => config.module.donate)
  if (!donate) return null
  return (
    <MotionButtonBase
      aria-label={t('aria_donate')}
      className={clsxm('flex flex-col space-y-2', className)}
      onClick={() => {
        window.open(donate.link, '_blank')
      }}
      {...props}
    >
      <ActionAsideIcon className="hover:text-red-400">
        <RiUserHeartLine />
      </ActionAsideIcon>
    </MotionButtonBase>
  )
}

const DonateContent = () => {
  const t = useTranslations('donate')
  const donate = useAppConfigSelector((config) => config.module?.donate)

  return (
    <>
      <m.h2 className="mb-6 text-lg font-medium" exit={{ opacity: 0 }}>
        {t('thanks')}
      </m.h2>
      <div className="center flex flex-wrap gap-4 overflow-auto">
        {donate?.qrcode?.map((src) => (
          <m.img
            alt="donate"
            className="h-[300px] max-h-[70vh]"
            exit={{ opacity: 0 }}
            key={src}
            src={src}
          />
        ))}
      </div>
    </>
  )
}
