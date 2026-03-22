'use client'

import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import type { FC } from 'react'
import { useCallback, useMemo } from 'react'

import { LanguageSelector } from '~/components/ui/language-selector'
import { defaultLocale } from '~/i18n/config'
import { usePathname, useRouter } from '~/i18n/navigation'

function getLanguageLabel(
  code: string,
  tCommon: (key: 'language_zh' | 'language_en' | 'language_ja') => string,
): string {
  if (code === 'zh') return tCommon('language_zh')
  if (code === 'en') return tCommon('language_en')
  if (code === 'ja') return tCommon('language_ja')

  return code.toUpperCase()
}

interface TranslationLanguageSwitcherProps {
  availableTranslations?: string[]
  sourceLang?: string
}

export const TranslationLanguageSwitcher: FC<
  TranslationLanguageSwitcherProps
> = ({ availableTranslations, sourceLang }) => {
  const t = useTranslations('translation')
  const tCommon = useTranslations('common')
  const appLocale = useLocale()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const originalLang = sourceLang || defaultLocale

  const langParam = searchParams.get('lang')
  const currentLanguage =
    langParam === 'original' ? originalLang : langParam || appLocale

  const languages = useMemo(() => {
    const langSet = new Set<string>([originalLang])

    availableTranslations?.forEach((lang) => langSet.add(lang))

    return Array.from(langSet).map((code) => ({
      code,
      label: getLanguageLabel(code, tCommon),
      isOriginal: code === originalLang,
    }))
  }, [availableTranslations, originalLang, tCommon])

  const handleLanguageChange = useCallback(
    (lang: string) => {
      router.push(pathname, { locale: lang })
    },
    [pathname, router],
  )

  if (languages.length <= 1) {
    return null
  }

  return (
    <LanguageSelector
      currentLanguage={currentLanguage}
      languages={languages}
      originalLabel={t('original')}
      onLanguageChange={handleLanguageChange}
    />
  )
}
