import type { PropsWithChildren } from 'react'

interface TimelineYearGroupProps {
  count: number
  year: number
}

export const TimelineYearGroup = ({
  year,
  count,
  children,
}: PropsWithChildren<TimelineYearGroupProps>) => (
  <div className="mb-8 animate-[timeline-fade-up_0.4s_ease-out_both]">
    <div className="mb-4 flex items-baseline gap-3 pl-6">
      <span className="text-[2.625rem] leading-none font-extralight tracking-tighter text-neutral-10/40">
        {year}
      </span>
      <span className="text-xs text-neutral-10/50">{count} entries</span>
    </div>
    {children}
  </div>
)
