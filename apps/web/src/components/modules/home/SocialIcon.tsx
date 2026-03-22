/* eslint-disable @eslint-react/no-missing-key */
import type { ReactNode } from 'react'
import { memo, useMemo } from 'react'

import { BilibiliIcon } from '~/components/icons/platform/BilibiliIcon'
import { BlueskyIcon } from '~/components/icons/platform/BlueskyIcon'
import { NeteaseCloudMusicIcon } from '~/components/icons/platform/NeteaseIcon'
import { SteamIcon } from '~/components/icons/platform/SteamIcon'
import { XIcon } from '~/components/icons/platform/XIcon'
import { MotionButtonBase } from '~/components/ui/button'
import { FloatPopover } from '~/components/ui/float-popover'

interface SocialIconProps {
  id: string
  type: string
  variant?: 'default' | 'mono'
}

const iconSet: Record<
  string,
  [string, ReactNode, string, (id: string) => string]
> = {
  github: [
    'Github',
    <i className="i-mingcute-github-line" />,
    '#181717',
    (id) => `https://github.com/${id}`,
  ],
  twitter: [
    'Twitter',
    <i className="i-mingcute-twitter-line" />,
    '#1DA1F2',
    (id) => `https://twitter.com/${id}`,
  ],
  x: ['X', <XIcon />, 'rgba(36,46,54,1.00)', (id) => `https://x.com/${id}`],
  telegram: [
    'Telegram',
    <i className="i-mingcute-telegram-line" />,
    '#0088cc',
    (id) => `https://t.me/${id}`,
  ],
  mail: [
    'Email',
    <i className="i-mingcute-mail-line" />,
    '#D44638',
    (id) => `mailto:${id}`,
  ],
  get email() {
    return this.mail
  },
  get feed() {
    return this.rss
  },
  rss: ['RSS', <i className="i-mingcute-rss-line" />, '#FFA500', (id) => id],
  bilibili: [
    '哔哩哔哩',
    <BilibiliIcon />,
    '#00A1D6',
    (id) => `https://space.bilibili.com/${id}`,
  ],
  netease: [
    '网易云音乐',
    <NeteaseCloudMusicIcon />,
    '#C20C0C',
    (id) => `https://music.163.com/#/user/home?id=${id}`,
  ],
  qq: [
    'QQ',
    <i className="i-mingcute-qq-fill" />,
    '#1e6fff',
    (id) => `https://wpa.qq.com/msgrd?v=3&uin=${id}&site=qq&menu=yes`,
  ],
  wechat: [
    '微信',
    <i className="i-mingcute-wechat-fill" />,
    '#2DC100',
    (id) => id,
  ],
  weibo: [
    '微博',
    <i className="i-mingcute-weibo-line" />,
    '#E6162D',
    (id) => `https://weibo.com/${id}`,
  ],
  discord: [
    'Discord',
    <i className="i-mingcute-discord-fill" />,
    '#7289DA',
    (id) => `https://discord.gg/${id}`,
  ],
  bluesky: [
    'Bluesky',
    <BlueskyIcon />,
    '#0085FF',
    (id) => `https://bsky.app/profile/${id}`,
  ],
  steam: [
    'Steam',
    <SteamIcon />,
    '#0F1C30',
    (id) => `https://steamcommunity.com/id/${id}`,
  ],
}
const icons = Object.keys(iconSet)

export const isSupportIcon = (icon: string) => icons.includes(icon)
export const SocialIcon = memo((props: SocialIconProps) => {
  const { id, type, variant = 'default' } = props

  const [name, Icon, iconBg, hrefFn] = useMemo(() => {
    const [name, Icon, iconBg, hrefFn] = (iconSet as any)[type as any] || []
    return [name, Icon, iconBg, hrefFn]
  }, [type])

  if (!name) return null
  const href = hrefFn(id)

  if (variant === 'mono') {
    return (
      <FloatPopover
        type="tooltip"
        triggerElement={
          <a
            aria-label={name}
            className="center flex size-9 rounded-full border border-neutral-4 text-neutral-6 transition-colors duration-300"
            href={href}
            rel="noreferrer"
            target="_blank"
            style={
              {
                '--hover-color': iconBg,
              } as React.CSSProperties
            }
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = iconBg
              e.currentTarget.style.color = iconBg
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = ''
              e.currentTarget.style.color = ''
            }}
          >
            <span className="flex items-center justify-center [&_svg]:size-4 [&_i]:text-base">
              {Icon}
            </span>
          </a>
        }
      >
        {name}
      </FloatPopover>
    )
  }

  return (
    <FloatPopover
      type="tooltip"
      triggerElement={
        <MotionButtonBase
          className="center flex aspect-square size-10 rounded-full text-2xl text-white"
          style={{
            background: iconBg,
          }}
        >
          <a
            className="center flex"
            href={href}
            rel="noreferrer"
            target="_blank"
          >
            {Icon}
          </a>
        </MotionButtonBase>
      }
    >
      {name}
    </FloatPopover>
  )
})
SocialIcon.displayName = 'SocialIcon'
