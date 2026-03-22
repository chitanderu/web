'use server'

import { PNG } from 'pngjs'

const hexToRbg = (hex: string) => {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

const createSeed = (input: string) => {
  let seed = 0x811C9DC5

  for (const char of input) {
    seed ^= char.charCodeAt(0)
    seed = Math.imul(seed, 0x01000193)
  }

  return seed >>> 0
}

const createRandom = (seed: number) => () => {
  let value = (seed += 0x6D2B79F5)
  value = Math.imul(value ^ (value >>> 15), value | 1)
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296
}

const cache = new Map<string, Promise<string>>()

export const createPngNoiseBackground = async (hex: string) => {
  const cached = cache.get(hex)
  if (cached) return cached
  const promise = createPngNoiseBackgroundImpl(hex)
  cache.set(hex, promise)
  return promise
}

const createPngNoiseBackgroundImpl = async (hex: string) => {
  const { b, g, r } = hexToRbg(hex)
  const width = 192
  const height = 192
  const png = new PNG({
    width,
    height,
    filterType: -1,
  })

  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  const noiseChannel = brightness > 150 ? 0 : 255
  const random = createRandom(createSeed(hex))

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2
      const grain = random()
      const alpha =
        grain > 0.985
          ? Math.round(10 + random() * 10)
          : grain > 0.72
            ? Math.round(1 + random() * 4)
            : 0

      png.data[idx] = noiseChannel
      png.data[idx + 1] = noiseChannel
      png.data[idx + 2] = noiseChannel
      png.data[idx + 3] = alpha
    }
  }

  return new Promise<string>((resolve) => {
    const chunks = [] as Buffer[]
    png
      .pack()
      .on('data', (chunk) => {
        chunks.push(chunk)
      })
      .on('end', () => {
        const buffer = Buffer.concat(chunks)
        resolve(`url('data:image/png;base64,${buffer.toString('base64')}')`)
      })
  })
}
