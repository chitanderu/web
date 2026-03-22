'use client'

import { useTranslations } from 'next-intl'
import type { FC } from 'react'

import { FloatPopover } from '~/components/ui/float-popover'
import { clsxm } from '~/lib/helper'

import type { AiGenValue, AiGenValueOrArray } from './ai-gen'
import { getAiGenDescription, getAiGenLabel, isAiGenPreset } from './ai-gen'

const SingleBadge: FC<{
  value: AiGenValueOrArray
  className?: string
}> = (props) => {
  const { value, className } = props
  const t = useTranslations('ai')

  const label = isAiGenPreset(value) ? getAiGenLabel(t, value) : String(value)

  const desc = isAiGenPreset(value)
    ? getAiGenDescription(t, value)
    : t('disclosure_fallback', { label })

  return (
    <FloatPopover
      asChild
      mobileAsSheet
      type="tooltip"
      triggerElement={
        <span
          data-hide-print
          className={clsxm(
            'inline-flex items-center gap-1 text-xs font-medium',
            className,
          )}
        >
          <i className="i-mingcute-ai-fill text-sm" />
          <span className="max-w-64 truncate">{label}</span>
        </span>
      }
    >
      {desc}
    </FloatPopover>
  )
}

const MultiBadge: FC<{
  values: AiGenValue[]
  className?: string
}> = ({ values, className }) => {
  const t = useTranslations('ai')
  const items = values.map((v) => ({
    value: v,
    label: isAiGenPreset(v) ? getAiGenLabel(t, v) : String(v),
    description: isAiGenPreset(v)
      ? getAiGenDescription(t, v)
      : t('disclosure_fallback', { label: String(v) }),
  }))

  if (items.length === 0) return null

  return (
    <FloatPopover
      asChild
      mobileAsSheet
      type="tooltip"
      triggerElement={
        <span
          data-hide-print
          className={clsxm(
            'inline-flex items-center gap-1 text-xs font-medium',
            className,
          )}
        >
          <i className="i-mingcute-ai-fill text-sm" />
          <span className="max-w-64 truncate">
            {items.map((item) => item.label).join(' · ')}
          </span>
        </span>
      }
    >
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div className="flex flex-col gap-1" key={item.value}>
            <span className="font-medium">{item.label}</span>
            <span className="text-sm opacity-80">{item.description}</span>
          </div>
        ))}
      </div>
    </FloatPopover>
  )
}

export const AIGenBadge: FC<{
  value?: AiGenValueOrArray | AiGenValueOrArray[]
  className?: string
}> = ({ value, className }) => {
  if (value === undefined || value === null) return null

  // Flatten and normalize the value to an array of AiGenValue
  const normalizeToArray = (
    val: AiGenValueOrArray | AiGenValueOrArray[],
  ): AiGenValue[] => {
    if (Array.isArray(val)) {
      return val.flatMap((v) => (Array.isArray(v) ? v : [v]))
    }
    return [val]
  }

  const normalized = normalizeToArray(value)

  if (normalized.length === 0) return null

  // Merge into single badge when 2+ items
  if (normalized.length >= 2) {
    return <MultiBadge className={className} values={normalized} />
  }

  return (
    <span className={clsxm('inline-flex gap-1', className)}>
      {normalized.map((v) => (
        <SingleBadge key={v} value={v} />
      ))}
    </span>
  )
}
