'use client'

import { useRef } from 'react'

import { ErrorBoundary } from '~/components/common/ErrorBoundary'

import { BottomSection } from './BottomSection'
import { RecentWriting } from './RecentWriting'

const isFirstVisit = () => {
  if (typeof window === 'undefined') return true
  return !sessionStorage.getItem('hero-entered')
}

const FoldCrease = ({ shouldAnimate }: { shouldAnimate: boolean }) => (
  <div
    className={`relative mx-[3%] my-7 hidden h-2 lg:block ${shouldAnimate ? 'ss-enter-crease' : ''}`}
  >
    <div className="absolute inset-x-0 top-0.5 h-px bg-gradient-to-r from-transparent via-black/[0.06] to-transparent dark:via-white/[0.06]" />
    <div className="absolute inset-x-0 top-1 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-white/[0.03]" />
  </div>
)

export const SecondScreen = () => {
  const firstVisitRef = useRef(isFirstVisit())
  const shouldAnimate = firstVisitRef.current

  return (
    <section className="mx-auto mt-24 max-w-[1400px] px-4 lg:px-12">
      <div className={shouldAnimate ? 'ss-enter-upper' : ''}>
        <RecentWriting />
      </div>

      <FoldCrease shouldAnimate={shouldAnimate} />

      <div className="lg:[perspective:800px]">
        <div className={shouldAnimate ? 'ss-enter-lower' : ''}>
          <ErrorBoundary variant="inline">
            <BottomSection />
          </ErrorBoundary>
        </div>
      </div>
    </section>
  )
}
