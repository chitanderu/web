'use client'
import { memoize, range, sample } from 'es-toolkit/compat'
import { AnimatePresence, m } from 'motion/react'
import type { FC } from 'react'

import {
  useIsImmersiveReadingEnabled,
  useIsInReading,
} from '~/atoms/hooks/reading'
import { useIsMobile } from '~/atoms/hooks/viewport'
import { Spring } from '~/constants/spring'
import { useIsDark } from '~/hooks/common/use-is-dark'

import { AutumnLeavesBackground } from './AutumnLeavesBackground'
import { FireflyBackground } from './FireflyBackground'
import { ParticlePhysics } from './ParticlePhysics'
import type { SakuraBackgroundProps } from './SakuraBackground'
import { SakuraBackground } from './SakuraBackground'
import type { SnowBackgroundProps } from './SnowBackground'
import { SnowBackground } from './SnowBackground'

export const BackgroundTexture: FC = () => {
  const isDark = useIsDark()
  const isMobile = useIsMobile()
  const isInReading = useIsInReading()
  const isImmersive = useIsImmersiveReadingEnabled()

  if (isImmersive) return null
  if (isMobile) return null

  const preset = resolveBackgroundPreset(isDark, new Date())

  return (
    <AnimatePresence>
      {!isInReading && (
        <m.div
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          transition={Spring.presets.smooth}
        >
          <preset.Component {...preset.props} />
        </m.div>
      )}
    </AnimatePresence>
  )
}

const createSnowBackgroundProps = memoize(() => {
  const direction = sample(range(45, 135))
  const windSpeed = sample(range(10, 20))
  const intensity = sample(range(0.7, 0.9))
  const density = sample(range(1, 3))
  return {
    windSpeed,
    windDirection: direction,
    speed: 0.5,

    intensity,
    density,
  } satisfies SnowBackgroundProps
})
type BackgroundPreset =
  | { Component: typeof SnowBackground; props: SnowBackgroundProps }
  | { Component: typeof SakuraBackground; props: SakuraBackgroundProps }
  | { Component: typeof AutumnLeavesBackground; props?: undefined }
  | { Component: typeof FireflyBackground; props?: undefined }
  | { Component: typeof ParticlePhysics; props?: undefined }

type Season = 'winter' | 'spring' | 'summer' | 'autumn'

const resolveBackgroundPreset = (
  isDark: boolean,
  date: Date,
): BackgroundPreset => {
  const season = getSeason(date)

  if (!isDark) {
    switch (season) {
      case 'spring': {
        return {
          Component: SakuraBackground,
          props: createSakuraBackgroundProps(),
        }
      }
      case 'autumn': {
        return { Component: AutumnLeavesBackground }
      }
      default: {
        return { Component: ParticlePhysics }
      }
    }
  }

  switch (season) {
    case 'winter': {
      return {
        Component: SnowBackground,
        props: createSnowBackgroundProps(),
      }
    }
    case 'spring': {
      return {
        Component: SakuraBackground,
        props: createSakuraBackgroundProps(),
      }
    }
    case 'autumn': {
      return { Component: AutumnLeavesBackground }
    }
    case 'summer': {
      return { Component: FireflyBackground }
    }
  }
}

const getSeason = (date: Date): Season => {
  const month = date.getMonth()
  if (month === 11 || month === 0) return 'winter'
  if (month >= 1 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  return 'autumn'
}

const createSakuraBackgroundProps = memoize(() => {
  const windDirection = sample(range(10, 60)) ?? 30
  const windSpeed = (sample(range(6, 13)) ?? 10) / 10
  const intensity = (sample(range(8, 12)) ?? 10) / 10
  const density = (sample(range(8, 13)) ?? 10) / 10
  const flutter = (sample(range(8, 13)) ?? 10) / 10
  const speed = (sample(range(9, 11)) ?? 10) / 10
  const volume = (sample(range(9, 12)) ?? 10) / 10
  const weight = (sample(range(9, 11)) ?? 10) / 10
  return {
    windSpeed,
    windDirection,
    speed,
    intensity,
    density,
    volume,
    weight,
    flutter,
  } satisfies SakuraBackgroundProps
})
