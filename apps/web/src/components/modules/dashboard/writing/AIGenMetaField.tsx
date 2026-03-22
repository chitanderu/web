import { useTranslations } from 'next-intl'

import { SidebarSection } from '~/components/modules/dashboard/writing/SidebarBase'
import { CheckBoxLabel } from '~/components/ui/checkbox/CheckBox'
import { FloatPopover } from '~/components/ui/float-popover'

import type { AiGenValue } from '../../ai/ai-gen'
import {
  AI_GEN_PRESET_OPTIONS,
  getAiGenDescription,
  getAiGenOptionLabel,
} from '../../ai/ai-gen'

const SINGLE_SELECT_VALUES = new Set(
  AI_GEN_PRESET_OPTIONS.filter((opt) => opt.singleSelect).map(
    (opt) => opt.value,
  ),
)

export const AIGenMetaField = (props: {
  meta: Record<string, any>
  onChangeMeta: (next: Record<string, any>) => void
}) => {
  const { meta, onChangeMeta } = props
  const t = useTranslations('ai')

  const current = meta?.aiGen as AiGenValue | AiGenValue[] | undefined

  // Normalize current value to array for easier handling
  const currentArray = Array.isArray(current)
    ? current
    : current === undefined
      ? []
      : [current]

  const handleToggle = (value: AiGenValue) => {
    let nextArray: AiGenValue[]

    if (SINGLE_SELECT_VALUES.has(value as any)) {
      // Single-select values (2: 完全, -1: 手作) clear all other values
      nextArray = currentArray.includes(value) ? [] : [value]
    } else {
      // For other values, remove single-select values if present
      const withoutSingleSelect = currentArray.filter(
        (v) => !SINGLE_SELECT_VALUES.has(v as any),
      )
      const isSelected = withoutSingleSelect.includes(value)

      if (isSelected) {
        nextArray = withoutSingleSelect.filter((v) => v !== value)
      } else {
        nextArray = [...withoutSingleSelect, value]
      }
    }

    const nextMeta = { ...meta }

    if (nextArray.length === 0) {
      Reflect.deleteProperty(nextMeta, 'aiGen')
    } else if (nextArray.length === 1) {
      nextMeta.aiGen = nextArray[0]
    } else {
      nextMeta.aiGen = nextArray
    }

    onChangeMeta(nextMeta)
  }

  return (
    <SidebarSection label={t('disclosure_section_label')}>
      <div className="flex flex-col gap-3">
        {AI_GEN_PRESET_OPTIONS.map((option) => {
          const isChecked = currentArray.includes(option.value)
          const hasSingleSelectSelected = currentArray.some((v) =>
            SINGLE_SELECT_VALUES.has(v as any),
          )
          const isDisabled =
            !SINGLE_SELECT_VALUES.has(option.value as any) &&
            hasSingleSelectSelected

          return (
            <FloatPopover
              key={option.value}
              placement="right"
              type="tooltip"
              triggerElement={
                <div className="flex items-center justify-between">
                  <CheckBoxLabel
                    checked={isChecked}
                    disabled={isDisabled}
                    label={getAiGenOptionLabel(t, option.value)}
                    onCheckChange={() => handleToggle(option.value)}
                  />
                </div>
              }
            >
              {getAiGenDescription(t, option.value)}
            </FloatPopover>
          )
        })}
      </div>
    </SidebarSection>
  )
}
