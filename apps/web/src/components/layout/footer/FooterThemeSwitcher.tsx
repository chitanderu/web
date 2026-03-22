'use client'

import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { flushSync } from 'react-dom'

import { useIsClient } from '~/hooks/common/use-is-client'
import { transitionViewIfSupported } from '~/lib/dom'

const themes = ['light', 'system', 'dark'] as const

const labels: Record<string, string> = {
  light: 'Light',
  system: 'System',
  dark: 'Dark',
}

export const FooterThemeSwitcher = () => {
  const tc = useTranslations('common')
  const { theme, setTheme } = useTheme()
  const isClient = useIsClient()

  const ariaLabels: Record<string, string> = {
    light: tc('aria_theme_light'),
    system: tc('aria_theme_system'),
    dark: tc('aria_theme_dark'),
  }

  const handleClick = (value: string) => {
    transitionViewIfSupported(() => {
      // eslint-disable-next-line @eslint-react/dom/no-flush-sync
      flushSync(() => setTheme(value))
    })
  }

  return (
    <span className="inline-flex items-center">
      {themes.map((t, i) => (
        <span key={t}>
          <button
            aria-label={ariaLabels[t]}
            type="button"
            className={
              isClient && theme === t
                ? 'text-neutral-8 underline decoration-current/30 underline-offset-2'
                : 'text-neutral-6 transition-colors duration-200 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:text-neutral-8'
            }
            onClick={() => handleClick(t)}
          >
            {labels[t]}
          </button>
          {i < themes.length - 1 && (
            <span className="mx-1 select-none text-neutral-5">·</span>
          )}
        </span>
      ))}
    </span>
  )
}
