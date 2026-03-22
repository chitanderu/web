import { Noto_Serif_SC, Sora } from 'next/font/google'

const sansFont = Sora({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--app-font-sans',
  display: 'swap',
})

const serifFont = Noto_Serif_SC({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--app-font-serif',
  display: 'swap',
  // adjustFontFallback: false,
  fallback: ['Noto Serif SC'],
})

export { sansFont, serifFont }
