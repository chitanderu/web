import { Dialog } from '@base-ui/react/dialog'
import { m } from 'motion/react'

export const DialogOverlay = ({
  onClick,
  zIndex,
}: {
  onClick?: () => void
  zIndex?: number
}) => (
  <Dialog.Backdrop
    render={
      <m.div
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[11] bg-neutral-1/80"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        style={{ zIndex }}
        onClick={onClick}
      />
    }
  />
)
