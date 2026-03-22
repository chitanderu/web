import { generateAccentColorStyle } from '~/lib/accent-color'

const accentColorLight = [
  // 浅葱
  '#33A6B8',

  '#FF6666',
  '#26A69A',
  '#fb7287',
  '#69a6cc',
]
const accentColorDark = [
  // 桃
  '#F596AA',

  '#A0A7D4',
  '#ff7b7b',
  '#99D8CF',
  '#838BC6',
]
const defaultAccentColor = { light: accentColorLight, dark: accentColorDark }

export async function AccentColorStyleInjector({
  color,
}: {
  color?: AccentColor
}) {
  const { light, dark } = color || defaultAccentColor

  const lightColors = light ?? accentColorLight
  const darkColors = dark ?? accentColorDark

  const Length = Math.max(lightColors.length ?? 0, darkColors.length ?? 0)
  const randomSeedRef = (Math.random() * Length) | 0
  const currentAccentColorLRef = lightColors[randomSeedRef]
  const currentAccentColorDRef = darkColors[randomSeedRef]

  const cssContent = await generateAccentColorStyle({
    colors: {
      light: currentAccentColorLRef,
      dark: currentAccentColorDRef,
    },
    withNoise: true,
    useThemedClass: false,
  })

  return (
    <style
      data-dark={currentAccentColorDRef}
      data-light={currentAccentColorLRef}
      id="accent-color-style"
      dangerouslySetInnerHTML={{
        __html: cssContent,
      }}
    />
  )
}
