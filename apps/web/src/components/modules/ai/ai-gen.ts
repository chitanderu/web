// AI 参与声明类型
// -1: 无 AI (手作)
// 0: 辅助写作, 1: 润色, 2: 完全
// 3: 故事整理, 4: 标题生成, 5: 校对, 6: 灵感提供, 7: 改写, 8: AI 作图, 9: AI 口述
export type AiGenPresetValue = -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type AiGenValue = AiGenPresetValue | (string & {})
export type AiGenValueOrArray = AiGenValue | AiGenValue[]

export const AI_GEN_PRESET_OPTIONS: {
  value: AiGenPresetValue
  singleSelect: boolean
  i18nKey:
    | 'handmade'
    | 'assist_writing'
    | 'polish'
    | 'fully'
    | 'story_organize'
    | 'title_generate'
    | 'proofread'
    | 'inspiration'
    | 'rewrite'
    | 'ai_illustration'
    | 'dictation'
}[] = [
  { value: -1, i18nKey: 'handmade', singleSelect: true },
  { value: 0, i18nKey: 'assist_writing', singleSelect: false },
  { value: 1, i18nKey: 'polish', singleSelect: false },
  { value: 2, i18nKey: 'fully', singleSelect: true },
  { value: 3, i18nKey: 'story_organize', singleSelect: false },
  { value: 4, i18nKey: 'title_generate', singleSelect: false },
  { value: 5, i18nKey: 'proofread', singleSelect: false },
  { value: 6, i18nKey: 'inspiration', singleSelect: false },
  { value: 7, i18nKey: 'rewrite', singleSelect: false },
  { value: 8, i18nKey: 'ai_illustration', singleSelect: false },
  { value: 9, i18nKey: 'dictation', singleSelect: false },
]

const AI_GEN_I18N_KEY_BY_VALUE = Object.fromEntries(
  AI_GEN_PRESET_OPTIONS.map((opt) => [opt.value, opt.i18nKey]),
) as Record<AiGenPresetValue, (typeof AI_GEN_PRESET_OPTIONS)[number]['i18nKey']>

type TranslatorLike = (key: string, values?: Record<string, any>) => string
export const getAiGenLabel = (t: TranslatorLike, value: AiGenPresetValue) =>
  t(`preset_${AI_GEN_I18N_KEY_BY_VALUE[value]}_label`)
export const getAiGenOptionLabel = (
  t: TranslatorLike,
  value: AiGenPresetValue,
) => t(`preset_${AI_GEN_I18N_KEY_BY_VALUE[value]}_option_label`)
export const getAiGenDescription = (
  t: TranslatorLike,
  value: AiGenPresetValue,
) => t(`preset_${AI_GEN_I18N_KEY_BY_VALUE[value]}_description`)

const AI_VALID_VALUES = new Set(AI_GEN_PRESET_OPTIONS.map((opt) => opt.value))
export const isAiGenPreset = (value: unknown): value is AiGenPresetValue =>
  AI_VALID_VALUES.has(value as AiGenPresetValue)
