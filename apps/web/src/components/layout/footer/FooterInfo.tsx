import 'server-only'

import { getTranslations } from 'next-intl/server'
import type { JSX, ReactNode } from 'react'

import { fetchAggregationData } from '~/app/[locale]/api'
import { SubscribeTextButton } from '~/components/modules/subscribe/SubscribeTextButton'
import { FloatPopover } from '~/components/ui/float-popover'
import { MarkdownLink } from '~/components/ui/link'
import { Link } from '~/i18n/navigation'

import type { FooterConfig } from './config'
import { getDefaultLinkSections } from './config'
import { GatewayInfo } from './GatewayInfo'
import { OwnerName } from './OwnerName'

interface FooterInfoProps {
  localeSwitcher: ReactNode
  themeSwitcher: ReactNode
}

export const FooterInfo = async ({
  localeSwitcher,
  themeSwitcher,
}: FooterInfoProps) => {
  const t = await getTranslations('common')
  const data = await fetchAggregationData()
  const { footer } = data.theme
  const footerConfig: FooterConfig = footer || {
    linkSections: getDefaultLinkSections(t),
    otherInfo: {} as any,
  }
  const { otherInfo } = footerConfig
  const currentYear = new Date().getFullYear().toString()
  const { date = currentYear, icp } = otherInfo || {}

  return (
    <>
      {/* Desktop: asymmetric split */}
      <div className="hidden md:flex md:gap-20">
        {/* Left: brand column */}
        <div className="w-70 shrink-0">
          <div className="text-xl font-semibold tracking-wide text-neutral-9">
            <a href="/">
              <OwnerName />
            </a>
          </div>
          <div className="mt-2 text-sm leading-relaxed italic text-neutral-7">
            {t('footer_motto')}
          </div>

          <div className="mt-7 text-sm leading-loose text-neutral-6">
            <div>© {date.replace('{{now}}', currentYear)}</div>
            <PoweredBy />
          </div>

          <div className="mt-1.5 text-sm text-neutral-6">
            <GatewayInfo />
          </div>
        </div>

        {/* Right: link columns */}
        <FooterLinkColumns sections={footerConfig.linkSections} />
      </div>

      {/* Mobile: flat inline flow */}
      <div className="md:hidden">
        {/* Brand block */}
        <div className="mb-6">
          <div className="mb-1.5 text-lg font-semibold text-neutral-9">
            <a href="/">
              <OwnerName />
            </a>
          </div>
          <div className="text-sm leading-relaxed italic text-neutral-7">
            {t('footer_motto')}
          </div>
        </div>

        {/* Links block */}
        <FooterLinkInline
          linksLabel={t('footer_links_label')}
          sections={footerConfig.linkSections}
        />

        {/* Bottom block */}
        <div className="border-t border-black/4 pt-4 dark:border-white/4">
          <div className="text-sm leading-relaxed text-neutral-6">
            <div>
              © {date.replace('{{now}}', currentYear)} <PoweredBy />
            </div>
            <div className="mt-0.5">
              <GatewayInfo />
            </div>
            {icp && (
              <div className="mt-0.5">
                <StyledLink external href={icp.link} rel="noreferrer">
                  {icp.text}
                </StyledLink>
              </div>
            )}
          </div>
          <div className="mt-3.5 space-y-3 text-sm text-neutral-6">
            <div>
              <a href="/feed" rel="noreferrer" target="_blank">
                {t('rss_subscribe')}
              </a>
              <DotSep />
              <a href="/sitemap.xml" rel="noreferrer" target="_blank">
                {t('sitemap')}
              </a>
              <SubscribeTextButton>
                <DotSep />
              </SubscribeTextButton>
            </div>
            <div className="flex items-center gap-3">
              {themeSwitcher}
              <SectionSep />
              {localeSwitcher}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop bottom bar */}
      <div className="mt-8 hidden border-t border-black/4 pt-4 dark:border-white/4 md:flex md:items-center md:justify-between">
        <span className="flex items-center gap-4 text-sm text-neutral-6">
          <span>
            <a href="/feed" rel="noreferrer" target="_blank">
              {t('rss_subscribe')}
            </a>
            <DotSep />
            <a href="/sitemap.xml" rel="noreferrer" target="_blank">
              {t('sitemap')}
            </a>
            <SubscribeTextButton>
              <DotSep />
            </SubscribeTextButton>
          </span>
          <SectionSep />
          {themeSwitcher}
          <SectionSep />
          {localeSwitcher}
        </span>
        {icp && (
          <span className="text-sm text-neutral-6">
            <StyledLink external href={icp.link} rel="noreferrer">
              {icp.text}
            </StyledLink>
          </span>
        )}
      </div>
    </>
  )
}

const DotSep = () => (
  <span aria-hidden className="mx-1.5 select-none text-neutral-5">
    ·
  </span>
)

const SectionSep = () => (
  <span aria-hidden className="select-none text-neutral-4">
    |
  </span>
)

const FooterLinkColumns = ({
  sections,
}: {
  sections: FooterConfig['linkSections']
}) => (
  <div className="flex flex-1 justify-end gap-30 pt-0.5">
    {sections.map((section) => (
      <div key={section.name}>
        <div className="mb-3.5 text-sm font-medium uppercase tracking-[3px] text-neutral-6">
          {section.name}
        </div>
        <div className="text-sm leading-[2.6]">
          {section.links.map((link) => (
            <StyledLink
              className="block text-neutral-8/90 hover:underline hover:decoration-current/30 hover:underline-offset-2"
              external={link.external}
              href={link.href}
              key={link.name}
            >
              {link.name}
              {link.external && (
                <span className="ml-0.5 text-neutral-6"> ↗</span>
              )}
            </StyledLink>
          ))}
        </div>
      </div>
    ))}
  </div>
)

const FooterLinkInline = ({
  sections,
  linksLabel,
}: {
  sections: FooterConfig['linkSections']
  linksLabel: string
}) => {
  const allLinks = sections.flatMap((s) => s.links)

  return (
    <div className="mb-6">
      <div className="mb-2.5 text-sm font-medium uppercase tracking-[3px] text-neutral-6">
        {linksLabel}
      </div>
      <div className="text-sm leading-[2.4] text-neutral-8/90">
        {allLinks.map((link, i) => (
          <span key={link.name}>
            <StyledLink
              className="underline-transparent hover:underline hover:decoration-current/30 hover:underline-offset-2"
              external={link.external}
              href={link.href}
            >
              {link.name}
            </StyledLink>
            {i < allLinks.length - 1 && <DotSep />}
          </span>
        ))}
      </div>
    </div>
  )
}

const StyledLink = (
  props: JSX.IntrinsicElements['a'] & {
    external?: boolean
  },
) => {
  const { external, ...rest } = props
  const As = external ? 'a' : Link

  return (
    // @ts-ignore
    <As
      rel={external ? 'noreferrer' : undefined}
      target={external ? '_blank' : props.target}
      {...rest}
    >
      {props.children}
    </As>
  )
}

const PoweredBy = async () => {
  const t = await getTranslations('common')
  return (
    <span>
      Powered by{' '}
      <StyledLink
        external
        className="underline decoration-black/15 underline-offset-2 dark:decoration-white/10"
        href="https://github.com/mx-space"
      >
        Mix Space
      </StyledLink>
      <span className="mx-0.5">&</span>
      <FloatPopover
        mobileAsSheet
        type="tooltip"
        triggerElement={
          <StyledLink
            external
            className="cursor-help underline decoration-black/15 underline-offset-2 dark:decoration-white/10"
            href="https://github.com/Innei/Yohaku"
          >
            余白 / Yohaku
          </StyledLink>
        }
      >
        <div className="space-y-2">
          <p>
            {t.rich('shiroi_closed_source', {
              link: (chunks) => (
                <StyledLink
                  external
                  className="underline"
                  href="https://github.com/Innei/Yohaku"
                >
                  {chunks}
                </StyledLink>
              ),
            })}
          </p>
          <p>
            {t.rich('shiroi_get_via', {
              link: (chunks) => (
                <MarkdownLink
                  noIcon
                  href="https://github.com/sponsors/Innei"
                  popper={false}
                >
                  {chunks}
                </MarkdownLink>
              ),
            })}
          </p>
          {process.env.COMMIT_HASH && process.env.COMMIT_URL && (
            <p>
              <MarkdownLink noIcon href={process.env.COMMIT_URL} popper={false}>
                {t('version_hash', {
                  hash: process.env.COMMIT_HASH.slice(0, 8),
                })}
              </MarkdownLink>
            </p>
          )}
          {process.env.BUILD_TIME && (
            <p>
              {t('build_time', {
                time: new Date(process.env.BUILD_TIME).toLocaleDateString(),
              })}
            </p>
          )}
        </div>
      </FloatPopover>
      .
    </span>
  )
}
