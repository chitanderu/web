import 'server-only'

import chroma from 'chroma-js'
import type { FC } from 'react'

import { generateSingleColorStyle } from '~/lib/accent-color'
import { generateGlowOrbs, renderGlowOrbStyle } from '~/lib/glow.server'

import { RootPortal } from '../ui/portal'

export const PageColorGradient: FC<{
  seed?: string
  baseColor?: string
}> = async ({ seed, baseColor }) => {
  const orbs = generateGlowOrbs({ seed, baseColor })

  const mainOrb = orbs[0]
  const bgAccent = chroma.hsl(mainOrb.hue, mainOrb.saturation / 100, 0.5).hex()

  const cssContent = await generateSingleColorStyle(bgAccent, {
    withNoise: false,
    useThemedClass: true,
    mixRatio: { light: 0.0015, dark: 0.00075 },
  })

  return (
    <>
      <RootPortal>
        <div className="page-glow-container">
          {orbs.map((orb) => (
            <div
              key={orb.id}
              style={
                {
                  ...renderGlowOrbStyle(orb),
                  '--glow-opacity': orb.opacity,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      </RootPortal>
      <style
        id="accent-color-style"
        dangerouslySetInnerHTML={{
          __html: cssContent,
        }}
      />
    </>
  )
}
