'use client'

import { useViewport } from '~/atoms/hooks/viewport'
import { springScrollToTop } from '~/lib/scroller'
import { usePageScrollLocationSelector } from '~/providers/root/page-scroll-info-provider'

import { FABPortable } from './FABContainer'

export const BackToTopFAB = () => {
  const windowHeight = useViewport((v) => v.h)
  const shouldShow = usePageScrollLocationSelector(
    (scrollTop) => scrollTop > windowHeight / 5,
    [windowHeight],
  )

  return (
    <FABPortable show={shouldShow} onClick={springScrollToTop}>
      <i className="i-mingcute-arow-to-up-line" />
    </FABPortable>
  )
}
