import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { AI_GEN_PRESET_OPTIONS } from '~/components/modules/ai/ai-gen'

const srcRoot = join(process.cwd(), 'src')
const messagesRoot = join(srcRoot, 'messages')

const aiPresetKeys = AI_GEN_PRESET_OPTIONS.flatMap((option) => [
  `preset_${option.i18nKey}_label`,
  `preset_${option.i18nKey}_option_label`,
  `preset_${option.i18nKey}_description`,
])

const dynamicKeyAllowlist = {
  ai: aiPresetKeys,
  comment: [
    'deleted_placeholder',
    'owner_badge',
    'commented_on_block',
    'avatar_alt',
    'from_location',
    'loading_more_replies',
    'load_more_replies',
  ],
  common: [
    'nav_home',
    'nav_timeline',
    'nav_thinking',
    'nav_more',
    'nav_friends',
    'nav_projects',
    'nav_says',
    'nav_memories',
    'nav_travel',
    'nav_friends_desc',
    'nav_projects_desc',
    'nav_says_desc',
    'nav_travel_desc',
    'actions_back',
    'aria_donate',
    'page_title_posts',
    'page_title_projects',
    'page_title_friends',
    'page_title_thinking',
    'page_title_says',
    'redirecting_to',
    'comment_placeholders',
    'footer_section_about',
    'footer_about_site',
    'footer_about_me',
    'footer_about_project',
    'footer_section_more',
    'footer_monitor',
    'footer_section_contact',
    'footer_write_message',
    'footer_send_email',
    'weather_sunny',
    'weather_cloudy',
    'weather_overcast',
    'weather_snow',
    'weather_rain',
    'weather_thunderstorm',
    'mood_happy',
    'mood_sad',
    'mood_crying',
    'mood_angry',
    'mood_pain',
    'mood_sorrow',
    'mood_unhappy',
    'mood_excited',
    'mood_worried',
    'mood_scary',
    'mood_hateful',
    'mood_despair',
    'mood_anxious',
  ],
  error: ['500_title'],
  home: [
    'windsock_newYear',
    'windsock_valentine',
    'windsock_halloween',
    'windsock_christmas',
    'ending_greeting_spring',
    'ending_greeting_summer',
    'ending_greeting_autumn',
    'ending_greeting_winter',
    'ending_nav_friends',
    'ending_nav_projects',
    'ending_nav_says',
    'ending_nav_travel',
  ],
  post: [
    'category_prefix',
    'category_count_prefix',
    'category_count_suffix',
    'category_empty',
    'tag_title',
  ],
  subscribe: ['type_post', 'type_note', 'type_say', 'type_recently'],
  thinking: ['feed_reference', 'feed_comment_cta'],
} as const satisfies Record<string, readonly string[]>

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name)

    return entry.isDirectory() ? walk(fullPath) : [fullPath]
  })
}

function flattenMessages(
  input: Record<string, unknown>,
  prefix = '',
): string[] {
  return Object.entries(input).flatMap(([key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return flattenMessages(value as Record<string, unknown>, nextKey)
    }

    return [nextKey]
  })
}

function collectMessageKeys(locale: string) {
  const localeRoot = join(messagesRoot, locale)

  return Object.fromEntries(
    walk(localeRoot)
      .filter((file) => file.endsWith('.json'))
      .map((file) => {
        const namespace = file.slice(localeRoot.length + 1, -'.json'.length)
        const json = JSON.parse(readFileSync(file, 'utf8')) as Record<
          string,
          unknown
        >

        return [namespace, flattenMessages(json)]
      }),
  ) as Record<string, string[]>
}

function collectSourceFiles() {
  return walk(srcRoot).filter(
    (file) =>
      /\.(ts|tsx)$/.test(file) &&
      !file.includes('/messages/') &&
      !file.endsWith('message-usage.test.ts'),
  )
}

function collectUsedKeys() {
  const usage = new Map<string, Set<string>>()
  const sourceFiles = collectSourceFiles()

  for (const file of sourceFiles) {
    const source = readFileSync(file, 'utf8')
    const translationVars = new Map<string, string>()
    const jsonVars = new Map<string, string>()

    for (const match of source.matchAll(
      // eslint-disable-next-line unicorn/better-regex
      /const\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*(?:'([^']+)'|"([^"]+)"|\{\s*namespace:\s*(?:'([^']+)'|"([^"]+)")\s*\})/g,
    )) {
      const variableName = match[1]
      const namespace =
        match[2] || match[3] || match[5]?.slice(1, -1) || match[6]?.slice(1, -1)

      if (variableName && namespace) {
        translationVars.set(variableName, namespace)
      }
    }

    for (const match of source.matchAll(
      /import\s+(\w+)\s+from\s+["'][.~]?\/?messages\/(?:en|ja|zh)\/([^"']+)\.json["']/g,
    )) {
      jsonVars.set(match[1], match[2])
    }

    for (const [variableName, namespace] of translationVars) {
      const translationPattern = new RegExp(
        String.raw`${variableName}(?:\.(?:rich|raw|markup))?\(\s*['"]([^'"]+)['"]`,
        'g',
      )

      for (const match of source.matchAll(translationPattern)) {
        if (!usage.has(namespace)) {
          usage.set(namespace, new Set())
        }
        usage.get(namespace)!.add(match[1])
      }
    }

    for (const [variableName, namespace] of jsonVars) {
      const dotPropertyPattern = new RegExp(
        String.raw`${variableName}\.([A-Za-z0-9_]+)`,
        'g',
      )
      const bracketPropertyPattern = new RegExp(
        String.raw`${variableName}\[['"]([A-Za-z0-9_]+)['"]\]`,
        'g',
      )

      for (const match of source.matchAll(dotPropertyPattern)) {
        if (!usage.has(namespace)) {
          usage.set(namespace, new Set())
        }
        usage.get(namespace)!.add(match[1])
      }

      for (const match of source.matchAll(bracketPropertyPattern)) {
        if (!usage.has(namespace)) {
          usage.set(namespace, new Set())
        }
        usage.get(namespace)!.add(match[1])
      }
    }
  }

  for (const [namespace, keys] of Object.entries(dynamicKeyAllowlist)) {
    if (!usage.has(namespace)) {
      usage.set(namespace, new Set())
    }

    for (const key of keys) {
      usage.get(namespace)!.add(key)
    }
  }

  return usage
}

describe('next-intl message usage', () => {
  it('keeps only referenced keys in locale files', () => {
    const usage = collectUsedKeys()
    const localeKeys = collectMessageKeys('zh')

    const unusedByNamespace = Object.entries(localeKeys)
      .map(([namespace, keys]) => {
        const usedKeys = usage.get(namespace) ?? new Set<string>()
        const unusedKeys = keys.filter((key) => !usedKeys.has(key))

        return [namespace, unusedKeys] as const
      })
      .filter(([, unusedKeys]) => unusedKeys.length > 0)

    expect(unusedByNamespace).toEqual([])
  })
})
