'use client'

import { m } from 'motion/react'
import { useLocale, useTranslations } from 'next-intl'
import { useId } from 'react'

import { clsxm } from '~/lib/helper'

export type LoadingProps = {
  loadingText?: string
  useDefaultLoadingText?: boolean
}

function pickLoadingText(options: string[] | string, seed: string): string {
  const arr = Array.isArray(options) ? options : [options]
  if (arr.length === 0) return ''
  const index =
    Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    arr.length
  return arr[index] ?? arr[0]
}

type AnimatedLoadingTextProps = {
  locale: string
  text: string
}

const inkFilterId = 'ink-loading-filter'

const InkDropLoadingMark = () => {
  return (
    <m.span
      aria-hidden
      animate={{ opacity: 1 }}
      className="relative block size-10"
      initial={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <svg className="absolute" height="0" width="0">
        <defs>
          <filter height="200%" id={inkFilterId} width="200%" x="-50%" y="-50%">
            <feTurbulence
              baseFrequency="0.045"
              numOctaves="4"
              result="noise"
              seed="3"
              type="fractalNoise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="14"
              xChannelSelector="R"
              yChannelSelector="G"
            />
            <feGaussianBlur stdDeviation="0.5" />
          </filter>
        </defs>
      </svg>

      {/* Main ink blot */}
      <m.span
        animate={{ scale: 1, opacity: 0.88 }}
        className="absolute left-1/2 top-1/2 block rounded-full bg-neutral-9"
        initial={{ scale: 0, opacity: 0 }}
        style={{
          filter: `url(#${inkFilterId})`,
          width: 22,
          height: 22,
          marginLeft: -11,
          marginTop: -11,
        }}
        transition={{
          duration: 1.2,
          ease: [0.22, 1, 0.36, 1],
        }}
      />

      {/* Satellite drops */}
      {[
        { x: 15, y: -11, size: 5, delay: 0.5 },
        { x: -13, y: 10, size: 4, delay: 0.7 },
        { x: 11, y: 13, size: 3.5, delay: 0.9 },
      ].map((dot, i) => (
        <m.span
          animate={{ scale: 1, opacity: 0.6 }}
          className="absolute left-1/2 top-1/2 block rounded-full bg-neutral-9/60"
          initial={{ scale: 0, opacity: 0 }}
          key={i}
          style={{
            width: dot.size,
            height: dot.size,
            marginLeft: dot.x - dot.size / 2,
            marginTop: dot.y - dot.size / 2,
            filter: `url(#${inkFilterId})`,
          }}
          transition={{
            duration: 0.8,
            delay: dot.delay,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      ))}
    </m.span>
  )
}

const tokenizeLoadingText = (text: string, locale: string) => {
  if (locale === 'zh') {
    return Array.from(text).map((value, index) => ({
      key: `${index}-${value}`,
      value,
      delay: index * 0.03,
      initial: { opacity: 0, y: 4, filter: 'blur(2px)' },
      animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    }))
  }

  if (locale === 'ja') {
    return text.split(/\u3000+/).map((value, index, arr) => ({
      key: `${index}-${value}`,
      value: index === arr.length - 1 ? value : `${value}\u3000`,
      delay: index * 0.11,
      initial: { opacity: 0, y: 3, filter: 'blur(2px)' },
      animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    }))
  }

  return (text.match(/\S+\s*/g) ?? [text]).map((value, index) => ({
    key: `${index}-${value}`,
    value,
    delay: index * 0.06,
    initial: { opacity: 0.15, x: 3, filter: 'blur(2px)' },
    animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
  }))
}

const AnimatedLoadingText = ({ locale, text }: AnimatedLoadingTextProps) => {
  const tokens = tokenizeLoadingText(text, locale)

  return (
    <m.span
      animate={{ opacity: [0.9, 1, 0.94] }}
      className="mt-6 block max-w-[32rem] text-center text-sm leading-7 text-neutral-10/80"
      transition={{
        delay: 0.6,
        duration: 2.4,
        ease: 'easeInOut',
        repeat: Infinity,
        repeatType: 'mirror',
      }}
    >
      {tokens.map((token) => (
        <m.span
          animate={token.animate}
          className="inline-block whitespace-pre"
          initial={token.initial}
          key={token.key}
          transition={{
            duration: 0.36,
            ease: [0.22, 1, 0.36, 1],
            delay: token.delay,
          }}
        >
          {token.value}
        </m.span>
      ))}
    </m.span>
  )
}

export const Loading: Component<LoadingProps> = ({
  loadingText,
  className,
  useDefaultLoadingText = false,
}) => {
  const locale = useLocale()
  const t = useTranslations('common')
  const id = useId()
  const defaultLoadingText = pickLoadingText(t.raw('loading_default'), id)
  const nextLoadingText = useDefaultLoadingText
    ? defaultLoadingText
    : loadingText
  return (
    <div
      data-hide-print
      className={clsxm('my-20 flex flex-col center', className)}
    >
      <InkDropLoadingMark />
      {!!nextLoadingText && (
        <AnimatedLoadingText locale={locale} text={nextLoadingText} />
      )}
    </div>
  )
}

export const FullPageLoading = () => (
  <Loading useDefaultLoadingText className="h-[calc(100vh-6.5rem-10rem)]" />
)
