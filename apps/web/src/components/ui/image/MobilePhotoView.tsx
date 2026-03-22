'use client'

import type { ReactElement } from 'react'
import { PhotoProvider, PhotoView } from 'react-photo-view'

interface MobilePhotoViewProps {
  children: ReactElement
  src: string
}

export const MobilePhotoView = ({ src, children }: MobilePhotoViewProps) => {
  return (
    <PhotoProvider photoClosable>
      <PhotoView src={src}>{children}</PhotoView>
    </PhotoProvider>
  )
}
