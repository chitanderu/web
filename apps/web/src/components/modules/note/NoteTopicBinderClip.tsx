'use client'

import type { TopicModel } from '@mx-space/api-client'

import { FloatPopover } from '~/components/ui/float-popover'
import { useIsDark } from '~/hooks/common/use-is-dark'
import { Link } from '~/i18n/navigation'
import { topicColors, topicStringToHue } from '~/lib/color'
import { routeBuilder, Routes } from '~/lib/route-builder'
import { useCurrentNoteDataSelector } from '~/providers/note/CurrentNoteDataProvider'

import { NoteTopicDetail } from './NoteTopicDetail'

export const NoteTopicBinderClip = ({
  topic: topicProp,
}: {
  topic?: TopicModel
} = {}) => {
  const contextTopic = useCurrentNoteDataSelector((state) => state?.data.topic)
  const topic = topicProp ?? contextTopic
  const isDark = useIsDark()

  if (!topic) return null

  const c = topicColors(topic.name, isDark)
  const clipWidth = Math.max(72, topic.name.length * 8 + 28)

  return (
    <FloatPopover
      mobileAsSheet
      offset={8}
      placement="bottom-start"
      wrapperClassName="absolute -left-[3px] -top-[3px] z-[2] hidden lg:block"
      triggerElement={
        <Link
          className="group block"
          href={routeBuilder(Routes.NoteTopic, { slug: topic.slug })}
        >
          {/* Clip body — horizontal bar */}
          <div className="flex">
            {/* Left edge — clip thickness/fold wrapping around paper */}
            <div
              className="w-[5px] shrink-0 transition-all duration-200 group-hover:brightness-115"
              style={{
                background: `linear-gradient(90deg, ${c.to} 0%, ${c.mid} 100%)`,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            />
            {/* Main face */}
            <div
              className="relative flex flex-1 items-center justify-center rounded-br-[6px] rounded-tr-[6px] transition-all duration-200 group-hover:brightness-115"
              style={{
                width: `${clipWidth}px`,
                height: 30,
                background: `linear-gradient(135deg, ${c.from} 0%, ${c.mid} 40%, ${c.to} 100%)`,
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.15)',
              }}
            >
              {/* Inner bevel highlight */}
              <span
                className="pointer-events-none absolute inset-x-1.5 top-0.5 h-px"
                style={{
                  background:
                    'linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
                }}
              />
              <span className="text-[11px] font-semibold leading-none tracking-wider text-white/90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]">
                {topic.name}
              </span>
            </div>
          </div>

          {/* Vertical tab — clip side profile wrapping down paper edge */}
          <div
            className="relative h-7 w-[5px] rounded-br-[3px] transition-all duration-200 group-hover:brightness-115"
            style={{
              background: `linear-gradient(180deg, ${c.to} 0%, hsl(${topicStringToHue(topic.name)}, 30%, ${isDark ? 38 : 28}%) 100%)`,
              boxShadow: '1px 1px 3px rgba(0,0,0,0.15)',
            }}
          />
        </Link>
      }
    >
      <NoteTopicDetail topic={topic} />
    </FloatPopover>
  )
}
