export const getDefaultLinkSections = (
  t: (key: string) => string,
): LinkSection[] => [
  {
    name: t('footer_section_about'),
    links: [
      {
        name: t('footer_about_site'),
        href: '/about-site',
      },
      {
        name: t('footer_about_me'),
        href: '/about-me',
      },
      {
        name: t('footer_about_project'),
        href: 'https://github.com/innei/Shiro',
        external: true,
      },
    ],
  },
  {
    name: t('footer_section_more'),
    links: [
      {
        name: t('nav_timeline'),
        href: '/timeline',
      },
      {
        name: t('nav_friends'),
        href: '/friends',
      },
      {
        name: t('footer_monitor'),
        href: 'https://status.shizuri.net/status/main',
        external: true,
      },
    ],
  },
  {
    name: t('footer_section_contact'),
    links: [
      {
        name: t('footer_write_message'),
        href: '/message',
      },
      {
        name: t('footer_send_email'),
        href: 'mailto:i@innei.in',
        external: true,
      },
      {
        name: 'GitHub',
        href: 'https://github.com/innei',
        external: true,
      },
    ],
  },
]

export interface FooterConfig {
  linkSections: LinkSection[]
  otherInfo: OtherInfo
}
