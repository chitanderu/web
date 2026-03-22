import type { PropsWithChildren, ReactNode } from 'react'

interface TimelineSpineLayoutProps {
  description?: ReactNode
  title: ReactNode
}

export const TimelineSpineLayout = ({
  title,
  description,
  children,
}: PropsWithChildren<TimelineSpineLayoutProps>) => (
  <div className="shiro-timeline-spine mt-10 text-neutral-10/80">
    <div className="mb-8 animate-[timeline-fade-up_0.4s_ease-out_both] pl-6">
      <h1 className="text-4xl font-bold">{title}</h1>
      {description && (
        <p className="mt-2 text-base text-neutral-10/40">{description}</p>
      )}
    </div>
    {children}
  </div>
)
