import 'server-only'

import chroma from 'chroma-js'
import Color from 'colorjs.io'

import { createPngNoiseBackground } from './noise'

/**
 * 将十六进制颜色转换为OKLCH字符串
 */
export const hexToOklchString = (hex: string) => new Color(hex).oklch

/**
 * 默认背景色
 */
export const DEFAULT_BACKGROUNDS = {
  light: '#fefefb',
  dark: 'rgb(28, 28, 30)',
} as const

const PAPER_NOISE_BASE = {
  light: '#faf7f0',
  dark: '#1c1c1e',
} as const

/**
 * 颜色样式生成配置
 */
export interface AccentColorStyleConfig {
  /** 主题颜色映射 */
  colors: {
    light: string
    dark: string
  }
  /** 自定义根背景混合比例 */
  mixRatio?: {
    light: number
    dark: number
  }
  /** 是否使用themed类选择器 */
  useThemedClass?: boolean
  /** 是否生成噪声背景 */
  withNoise?: boolean
}

/**
 * 生成主题色相关的CSS样式
 */
export async function generateAccentColorStyle(
  config: AccentColorStyleConfig,
): Promise<string> {
  const {
    colors,
    withNoise = false,
    useThemedClass = false,
    mixRatio = { light: 0.004, dark: 0.002 },
  } = config

  const lightOklch = hexToOklchString(colors.light)
  const darkOklch = hexToOklchString(colors.dark)

  const [hl, sl, ll] = lightOklch
  const [hd, sd, ld] = darkOklch

  let cssContent = ''

  const lightRootBg = chroma
    .mix(DEFAULT_BACKGROUNDS.light, colors.light, mixRatio.light, 'rgb')
    .hex()
  const darkRootBg = chroma
    .mix(DEFAULT_BACKGROUNDS.dark, colors.dark, mixRatio.dark, 'rgb')
    .hex()

  if (withNoise) {
    const [lightNoiseImage, darkNoiseImage] = await Promise.all([
      createPngNoiseBackground(PAPER_NOISE_BASE.light),
      createPngNoiseBackground(PAPER_NOISE_BASE.dark),
    ])

    const selector = useThemedClass ? 'html.themed' : 'html'
    cssContent += `
        ${selector}[data-theme='light'].noise {
          --paper-texture-enabled: 1;
          --paper-grain-image: ${lightNoiseImage};
        }
        ${selector}[data-theme='dark'].noise {
          --paper-texture-enabled: 1;
          --paper-grain-image: ${darkNoiseImage};
        }`
  }

  const themeSelector = useThemedClass ? 'html.themed' : 'html'
  cssContent += `
        ${themeSelector}[data-theme='light'], .rich-content[data-theme='light'] {
          --color-accent: oklch(${hl} ${sl} ${ll});
        }
        ${themeSelector}[data-theme='dark'], .rich-content[data-theme='dark'] {
          --color-accent: oklch(${hd} ${sd} ${ld});
        }`

  if (useThemedClass) {
    cssContent += `
        html.themed[data-theme='light'] {
          --color-root-bg: ${lightRootBg};
        }
        html.themed[data-theme='dark'] {
          --color-root-bg: ${darkRootBg};
        }`
  } else {
    cssContent += `
        :root[data-theme='light'] {
          --color-root-bg: ${lightRootBg};
        }
        :root[data-theme='dark'] {
          --color-root-bg: ${darkRootBg};
        }`
  }

  return cssContent
}

/**
 * 单色主题样式生成（用于页面级别的颜色覆盖）
 */
export async function generateSingleColorStyle(
  color: string,
  options: {
    withNoise?: boolean
    useThemedClass?: boolean
    mixRatio?: { light: number; dark: number }
  } = {},
): Promise<string> {
  return generateAccentColorStyle({
    colors: {
      light: color,
      dark: color,
    },
    ...options,
  })
}
