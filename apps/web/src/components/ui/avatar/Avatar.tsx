'use client'

import { Avatar as BaseAvatar } from '@base-ui/react/avatar'
import type { DetailedHTMLProps, FC, ImgHTMLAttributes, JSX } from 'react'
import * as React from 'react'
import { createElement, useMemo, useRef, useState } from 'react'

import { useIsDark } from '~/hooks/common/use-is-dark'
import { getColorScheme, stringToHue } from '~/lib/color'
import { clsxm } from '~/lib/helper'

import { FlexText } from '../text'

interface AvatarProps {
  imageUrl?: string
  lazy?: boolean
  radius?: number | 'full'

  randomColor?: boolean

  shadow?: boolean
  size?: number
  text?: string
  url?: string

  wrapperProps?: JSX.IntrinsicElements['div']
}

const noop = {} as any

export const Avatar: FC<
  AvatarProps &
    DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>
> = (props) => {
  const {
    shadow = true,
    lazy = true,
    wrapperProps = noop,
    size,
    imageUrl,
    text,
    url,
    randomColor,
    radius,
    ...imageProps
  } = props
  const avatarRef = useRef<HTMLDivElement>(null)

  const [loaded, setLoaded] = useState(!lazy)
  const [loadError, setLoadError] = useState(false)

  const { className, ...restProps } = wrapperProps
  const colors = useMemo(
    () =>
      (text || imageUrl) &&
      randomColor &&
      (getColorScheme(stringToHue(text || imageUrl!)) as any),
    [text, imageUrl, randomColor],
  )
  const isDark = useIsDark()
  const bgColor = isDark ? colors?.dark.background : colors?.light.background

  return (
    <div
      ref={avatarRef}
      className={clsxm(
        'backface-hidden box-border',
        shadow && 'shadow-xs',
        className,
      )}
      style={{
        ...(size
          ? { height: `${size || 80}px`, width: `${size || 80}px` }
          : undefined),
        ...(bgColor ? { backgroundColor: bgColor } : undefined),
        ...(radius
          ? { borderRadius: radius === 'full' ? '100%' : `${radius}px` }
          : undefined),
      }}
      {...restProps}
    >
      {createElement(
        url ? 'a' : 'div',
        {
          className: 'relative inline-block h-full w-full',

          ...(url
            ? {
                href: url,
                target: '_blank',
                rel: 'noreferrer',
              }
            : {}),
        },
        imageUrl && !loadError ? (
          <div
            className={clsxm(
              'bg-cover bg-center bg-no-repeat transition-opacity duration-300',
              className,
            )}
            style={{
              borderRadius: radius === 'full' ? '100%' : `${radius}px`,
            }}
          >
            <BaseAvatar.Root>
              <BaseAvatar.Image
                height={size}
                loading={lazy ? 'lazy' : 'eager'}
                src={imageUrl}
                width={size}
                style={{
                  opacity: loaded ? 1 : 0,
                  ...(radius
                    ? {
                        borderRadius:
                          radius === 'full' ? '100%' : `${radius}px`,
                      }
                    : undefined),
                }}
                onError={() => setLoadError(true)}
                onLoad={() => setLoaded(true)}
                {...imageProps}
                className={clsxm(
                  'aspect-square duration-200',
                  imageProps.className,
                )}
              />
              <BaseAvatar.Fallback
                delay={600}
                className={clsxm(
                  'size-full block shrink-0',
                  imageProps.className,
                )}
                style={{
                  height: `${size}px`,
                  width: `${size}px`,
                  borderRadius: radius === 'full' ? '100%' : `${radius}px`,
                }}
              />
            </BaseAvatar.Root>
          </div>
        ) : text ? (
          <div
            className="relative flex size-full grow select-none items-center justify-center"
            style={{
              backgroundColor: bgColor,
              ...(radius
                ? { borderRadius: radius === 'full' ? '100%' : `${radius}px` }
                : undefined),
            }}
          >
            <FlexText scale={0.5} text={text} />
          </div>
        ) : null,
      )}
    </div>
  )
}
