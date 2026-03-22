'use client'

import type { PropsWithChildren } from 'react'
import { createContext, use, useMemo } from 'react'

export type HeadingQueryStrategy = (
  container: HTMLElement,
) => HTMLHeadingElement[]

export const markdownHeadingStrategy: HeadingQueryStrategy = (container) => {
  return [...container.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(
    ($h) => ($h as HTMLElement).dataset['markdownHeading'] === 'true',
  ) as HTMLHeadingElement[]
}

const lexicalHeadingSelector = [
  'h1.rich-heading-h1',
  'h2.rich-heading-h2',
  'h3.rich-heading-h3',
  'h4.rich-heading-h4',
  'h5.rich-heading-h5',
  'h6.rich-heading-h6',
].join(',')

export const lexicalHeadingStrategy: HeadingQueryStrategy = (container) => {
  return [...container.querySelectorAll(lexicalHeadingSelector)].filter(
    ($h) => !$h.closest('.rich-nested-doc-content'),
  ) as HTMLHeadingElement[]
}

const TocHeadingStrategyContext = createContext<HeadingQueryStrategy>(
  markdownHeadingStrategy,
)

export const useTocHeadingStrategy = () => use(TocHeadingStrategyContext)

export function TocHeadingStrategyProvider({
  contentFormat,
  hasContent,
  children,
}: PropsWithChildren<{ contentFormat?: string; hasContent?: boolean }>) {
  const strategy = useMemo(
    () =>
      contentFormat === 'lexical' && hasContent
        ? lexicalHeadingStrategy
        : markdownHeadingStrategy,
    [contentFormat, hasContent],
  )
  return (
    <TocHeadingStrategyContext value={strategy}>
      {children}
    </TocHeadingStrategyContext>
  )
}
