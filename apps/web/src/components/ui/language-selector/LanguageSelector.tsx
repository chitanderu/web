'use client'

import type { FC } from 'react'
import { useTransition } from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { clsxm } from '~/lib/helper'

export interface LanguageOption {
  code: string
  isOriginal?: boolean
  label: string
}

interface LanguageSelectorProps {
  currentLanguage: string
  languages: LanguageOption[]
  onLanguageChange: (lang: string) => void
  originalLabel?: string
  showIcon?: boolean
  triggerClassName?: string
}

export const LanguageSelector: FC<LanguageSelectorProps> = ({
  languages,
  currentLanguage,
  onLanguageChange,
  originalLabel,
  triggerClassName,
  showIcon = true,
}) => {
  const [isPending, startTransition] = useTransition()

  const currentLabel =
    languages.find((l) => l.code === currentLanguage)?.label || currentLanguage

  const handleSelect = (lang: string) => {
    if (lang === currentLanguage) return
    startTransition(() => {
      onLanguageChange(lang)
    })
  }

  if (languages.length <= 1) {
    return null
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          disabled={isPending}
          type="button"
          className={clsxm(
            'flex items-center gap-1 rounded-md px-1.5 py-0.5 text-sm transition-colors',
            'hover:bg-neutral-2 data-[open]:bg-neutral-2',
            isPending && 'opacity-50',
            triggerClassName,
          )}
        >
          {showIcon && <i className="i-mingcute-translate-2-line" />}
          <span>{currentLabel}</span>
          <i className="i-mingcute-down-line text-xs opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {languages.map((lang) => {
          const isCurrent = lang.code === currentLanguage

          return (
            <DropdownMenuItem
              key={lang.code}
              className={
                isCurrent ? 'bg-neutral-2/80' : ''
              }
              onClick={() => handleSelect(lang.code)}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  {lang.label}
                  {lang.isOriginal && originalLabel && (
                    <span className="rounded bg-neutral-3 px-1 py-0.5 text-[10px]">
                      {originalLabel}
                    </span>
                  )}
                </span>
                {isCurrent && (
                  <i className="i-mingcute-check-line text-accent" />
                )}
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
