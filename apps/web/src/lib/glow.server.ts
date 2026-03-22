import 'server-only'

import { hexToHsl } from './color'

const SOFT_HUES = [
  { name: 'dawn', hue: 25 },
  { name: 'sunrise', hue: 35 },
  { name: 'morning', hue: 45 },
  { name: 'spring', hue: 85 },
  { name: 'sky', hue: 200 },
  { name: 'twilight', hue: 220 },
  { name: 'lavender', hue: 270 },
  { name: 'rose', hue: 340 },
  { name: 'coral', hue: 15 },
  { name: 'mint', hue: 160 },
  { name: 'peach', hue: 20 },
  { name: 'sage', hue: 120 },
]

type GlowShape = 'circle' | 'ellipse-h' | 'ellipse-v' | 'blob'

export interface GlowOrb {
  blur: number
  delay: number
  height: number
  hue: number
  id: number
  lightnessDark: number
  lightnessLight: number
  opacity: number
  saturation: number
  shape: GlowShape
  width: number
  x: number
  y: number
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.codePointAt(i)!
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

function seededRandom(initialSeed: number): () => number {
  let s = initialSeed
  return function () {
    s = (s * 1103515245 + 12345) & 0x7FFFFFFF
    return s / 0x7FFFFFFF
  }
}

function getShapeBorderRadius(shape: GlowShape): string {
  switch (shape) {
    case 'circle':
    case 'ellipse-h':
    case 'ellipse-v': {
      return '50%'
    }
    case 'blob': {
      return '60% 40% 30% 70% / 60% 30% 70% 40%'
    }
    default: {
      return '50%'
    }
  }
}

function resolveBaseHue(
  seed?: string,
  baseColor?: string,
): { hue: number; hash: number } {
  if (baseColor) {
    const [h] = hexToHsl(baseColor)
    return { hue: h, hash: hashString(baseColor) }
  }
  const hash = hashString(seed!)
  const hueIndex = hash % SOFT_HUES.length
  const baseHue = SOFT_HUES[hueIndex].hue
  const hueOffset = ((hash >> 8) % 30) - 15
  return { hue: (baseHue + hueOffset + 360) % 360, hash }
}

export function generateGlowOrbs(options: {
  seed?: string
  baseColor?: string
}): GlowOrb[] {
  const { hue: baseHue, hash } = resolveBaseHue(options.seed, options.baseColor)
  const random = seededRandom(hash)

  const orbCount = 3 + Math.floor(random() * 4)
  const shapes: GlowShape[] = ['circle', 'ellipse-h', 'ellipse-v', 'blob']
  const orbs: GlowOrb[] = []

  for (let i = 0; i < orbCount; i++) {
    const isMain = i === 0

    const x = isMain ? 50 : 10 + random() * 80
    const y = isMain ? 15 : 5 + random() * 50

    const baseSize = isMain ? 400 : 100 + random() * 180
    const width = baseSize * (0.8 + random() * 0.8)
    const height = baseSize * (0.6 + random() * 0.8)

    const blur = isMain ? 80 + random() * 40 : 40 + random() * 60
    const opacity = isMain ? 0.5 + random() * 0.2 : 0.2 + random() * 0.3

    const hueOffset = (random() - 0.5) * 60
    const hue = (baseHue + hueOffset + 360) % 360
    const saturation = Math.max(15, Math.min(50, 30 + (random() - 0.5) * 20))
    const lightnessLight = Math.max(
      80,
      Math.min(95, 88 + (random() - 0.5) * 10),
    )
    const lightnessDark = Math.max(10, Math.min(30, 20 + (random() - 0.5) * 14))

    const shape = isMain
      ? 'ellipse-h'
      : shapes[Math.floor(random() * shapes.length)]
    const delay = isMain ? 0.1 : 0.3 + i * 0.15

    orbs.push({
      id: i,
      x,
      y,
      width,
      height,
      blur,
      opacity,
      hue,
      saturation,
      lightnessLight,
      lightnessDark,
      shape,
      delay,
    })
  }

  return orbs
}

export function renderGlowOrbStyle(orb: GlowOrb): React.CSSProperties {
  return {
    position: 'absolute',
    left: `${orb.x}%`,
    top: `${orb.y * 6}px`,
    width: `${orb.width}px`,
    height: `${orb.height}px`,
    background: `light-dark(hsl(${orb.hue}, ${orb.saturation}%, ${orb.lightnessLight}%), hsl(${orb.hue}, ${orb.saturation}%, ${orb.lightnessDark}%))`,
    borderRadius: getShapeBorderRadius(orb.shape),
    filter: `blur(${orb.blur}px)`,
    opacity: 0,
    transform: 'translate(-50%, -50%) scale(0.6)',
    animation: `glow-enter 1.2s ease-out ${orb.delay}s forwards`,
  }
}
