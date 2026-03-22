'use client'

import { BilibiliIcon } from '~/components/icons/platform/BilibiliIcon'
import { SimpleIconsFigma } from '~/components/icons/platform/FigmaIcon'
import { GitHubBrandIcon } from '~/components/icons/platform/GitHubBrandIcon'
import { CibMozilla } from '~/components/icons/platform/Moz'
import { VscodeIconsFileTypeNpm } from '~/components/icons/platform/NpmIcon'
import { IcBaselineTelegram } from '~/components/icons/platform/Telegram'
import { SimpleIconsThemoviedatabase } from '~/components/icons/platform/TheMovieDB'
import { TwitterIcon } from '~/components/icons/platform/Twitter'
import { WikipediaIcon } from '~/components/icons/platform/WikipediaIcon'
import { SimpleIconsXiaohongshu } from '~/components/icons/platform/XiaoHongShuIcon'
import { SimpleIconsZhihu } from '~/components/icons/platform/ZhihuIcon'
import {
  isBilibiliUrl,
  isFigmaUrl,
  isGithubUrl,
  isMozillaUrl,
  isNpmUrl,
  isTelegramUrl,
  isTMDBUrl,
  isTwitterUrl,
  isWikipediaUrl,
  isXiaoHongShuUrl,
  isZhihuUrl,
} from '~/lib/link-parser'

const platformMap = [
  {
    type: 'GH',
    icon: <GitHubBrandIcon className="text-[#1D2127] dark:text-[#FFFFFF]" />,
    test: isGithubUrl,
  },
  { type: 'TW', icon: <TwitterIcon />, test: isTwitterUrl },
  {
    type: 'TG',
    icon: <IcBaselineTelegram className="text-[#2AABEE]" />,
    test: isTelegramUrl,
  },
  {
    type: 'BL',
    icon: <BilibiliIcon className="text-[#469ECF]" />,
    test: isBilibiliUrl,
  },
  {
    type: 'ZH',
    icon: <SimpleIconsZhihu className="text-[#0084FF]" />,
    test: isZhihuUrl,
  },
  {
    type: 'WI',
    icon: <WikipediaIcon className="text-current" />,
    test: isWikipediaUrl,
  },
  {
    type: 'TMDB',
    icon: (
      <SimpleIconsThemoviedatabase className="text-[#0D243F] dark:text-[#5CB7D2]" />
    ),
    test: isTMDBUrl,
  },
  {
    type: 'Moz',
    icon: <CibMozilla className="text-[#8cb4ff]" />,
    test: isMozillaUrl,
  },
  { type: 'Npm', icon: <VscodeIconsFileTypeNpm />, test: isNpmUrl },
  {
    type: 'Figma',
    icon: <SimpleIconsFigma className="text-[#A259FF]" />,
    test: isFigmaUrl,
  },
  {
    type: 'XHS',
    icon: <SimpleIconsXiaohongshu className="text-[#FE2442]" />,
    test: isXiaoHongShuUrl,
  },
] as const

export type PlatformType = (typeof platformMap)[number]['type']

export const platformIconMap = Object.fromEntries(
  platformMap.map((item) => [item.type, item.icon]),
) as Record<PlatformType, React.ReactNode>

export function getPlatformFromUrl(url: URL): PlatformType | null {
  return platformMap.find((item) => item.test(url))?.type ?? null
}
