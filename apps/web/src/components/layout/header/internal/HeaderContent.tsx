'use client'

import './nav-menu.css'

import { NavigationMenu } from '@base-ui/react/navigation-menu'
import { AnimatePresence, m, useSpring } from 'motion/react'
import { useTranslations } from 'next-intl'
import * as React from 'react'
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { RootPortal } from '~/components/ui/portal'
import useDebounceValue from '~/hooks/common/use-debounce-value'
import { Link, usePathname } from '~/i18n/navigation'
import { clsxm } from '~/lib/helper'
import { useIsScrollUpAndPageIsOver } from '~/providers/root/page-scroll-info-provider'

import type { IHeaderMenu } from '../config'
import { dropdownTypeMap } from './DropdownContents'
import {
  useHeaderConfig,
  useHeaderConfigValue,
} from './HeaderDataConfigureProvider'
import { useMenuOpacity } from './hooks'

/** Debug: prevent menu from closing on focus loss (e.g. when opening DevTools). Enable via ?nav_debug=1 or localStorage.nav_debug */
const useNavDebugMode = () => {
  const [debug] = useState(() => {
    if (typeof window === 'undefined') return false
    return (
      new URLSearchParams(window.location.search).get('nav_debug') === '1' ||
      !!localStorage.getItem('nav_debug')
    )
  })
  return debug
}

const NavSeparator = () => (
  <div className="h-3.5 w-px shrink-0 bg-gradient-to-b from-transparent via-black/[0.06] to-transparent dark:via-white/[0.06]" />
)

function useIconSlide(activeKey: string | undefined) {
  const ref = useRef<HTMLSpanElement>(null)
  const prevRect = useRef<{ left: number; top: number } | null>(null)

  const springConfig = { stiffness: 400, damping: 30 }
  const x = useSpring(0, springConfig)
  const y = useSpring(0, springConfig)
  const opacity = useSpring(1, { stiffness: 600, damping: 35 })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) {
      prevRect.current = null
      return
    }

    const rect = el.getBoundingClientRect()
    const naturalLeft = rect.left - x.get()
    const naturalTop = rect.top - y.get()

    const prev = prevRect.current

    if (prev) {
      const dx = prev.left - naturalLeft
      const dy = prev.top - naturalTop

      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        x.jump(dx)
        y.jump(dy)
        x.set(0)
        y.set(0)

        opacity.jump(0)
        opacity.set(1)
      }
    }

    prevRect.current = { left: naturalLeft, top: naturalTop }
  }, [activeKey, x, y, opacity])

  return { ref, style: { x, y, opacity } }
}

export const HeaderContent = () => (
  <>
    <AnimatedMenu>
      <ForDesktop />
    </AnimatedMenu>
    <AccessibleMenu />
  </>
)

const AccessibleMenu: Component = () => {
  const showShow = useDebounceValue(useIsScrollUpAndPageIsOver(600), 120)
  return (
    <RootPortal>
      <AnimatePresence>
        {showShow && (
          <m.div
            animate={{ y: 0 }}
            className="pointer-events-none fixed inset-x-0 top-4 z-10 mr-[var(--removed-body-scroll-bar-size)] flex justify-center"
            exit={{ y: -20, opacity: 0 }}
            initial={{ y: -20 }}
          >
            <ForDesktop solid />
          </m.div>
        )}
      </AnimatePresence>
    </RootPortal>
  )
}

const AnimatedMenu: Component = ({ children }) => {
  const opacity = useMenuOpacity()

  const shouldHideNavBg = opacity === 0
  return (
    <m.div
      className="duration-100"
      style={{
        opacity,
        visibility: opacity === 0 ? 'hidden' : 'visible',
      }}
    >
      {/* @ts-ignore */}
      {React.cloneElement(children, { shouldHideNavBg })}
    </m.div>
  )
}

const ForDesktop: Component<{
  shouldHideNavBg?: boolean
  animatedIcon?: boolean
  solid?: boolean
}> = ({ className, shouldHideNavBg, animatedIcon = true, solid }) => {
  const headerMenuConfig = useHeaderConfigValue('configAtom')
  const { ensureMenuData } = useHeaderConfig()
  const pathname = usePathname()
  const t = useTranslations('common')
  const navDebugMode = useNavDebugMode()

  const [menuValue, setMenuValue] = useState<string | null>(null)
  const handleValueChange = useCallback(
    (value: string | null) => {
      if (navDebugMode && value == null) return
      if (value) {
        const section = headerMenuConfig.find((item) => item.path === value)
        if (section?.type) {
          ensureMenuData(section.type as Parameters<typeof ensureMenuData>[0])
        }
      }
      setMenuValue(value)
    },
    [ensureMenuData, headerMenuConfig, navDebugMode],
  )

  const getTitle = useCallback(
    (item: IHeaderMenu) => {
      if (item.titleKey) {
        return t(item.titleKey as any)
      }
      return item.title
    },
    [t],
  )

  const activeSectionPath = useMemo(() => {
    for (const section of headerMenuConfig) {
      const subItemActive =
        section.subMenu?.findIndex(
          (item) =>
            item.path === pathname ||
            pathname.slice(1) === item.path ||
            pathname.startsWith(`${item.path}/`),
        ) ?? -1

      if (
        pathname === section.path ||
        (pathname.startsWith(`${section.path}/`) &&
          !section.exclude?.includes(pathname)) ||
        subItemActive > -1
      ) {
        return section.path
      }
    }
    return undefined
  }, [headerMenuConfig, pathname])

  const iconSlide = useIconSlide(animatedIcon ? activeSectionPath : undefined)

  return (
    <NavigationMenu.Root
      closeDelay={150}
      delay={80}
      render={<nav />}
      value={menuValue}
      className={clsxm(
        'relative',
        'rounded-sm',
        solid
          ? 'bg-white dark:bg-neutral-900'
          : 'bg-white/[0.38] dark:bg-neutral-900/[0.38] backdrop-blur-lg',
        'border border-[rgba(200,180,160,0.08)] dark:border-neutral-700/20',
        'pointer-events-auto duration-200',
        shouldHideNavBg && 'bg-none! border-transparent!',
        className,
      )}
      onValueChange={handleValueChange}
    >
      <NavigationMenu.List className="flex list-none items-center px-2 font-medium text-neutral-9">
        {headerMenuConfig.map((section, index) => {
          const DropdownContent = section.type
            ? dropdownTypeMap[section.type]
            : undefined

          const subItemActive =
            section.subMenu?.findIndex(
              (item) =>
                item.path === pathname ||
                pathname.slice(1) === item.path ||
                pathname.startsWith(`${item.path}/`),
            ) ?? -1

          const isActive =
            pathname === section.path ||
            (pathname.startsWith(`${section.path}/`) &&
              !section.exclude?.includes(pathname)) ||
            subItemActive > -1 ||
            false

          const activeSubItem = section.subMenu?.[subItemActive]

          let href = section.path
          if (section.search) {
            href += `?${new URLSearchParams(section.search).toString()}`
          }

          const activeClass =
            'text-neutral-9 bg-white/55 dark:bg-white/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.1)] rounded-[2px] m-0.5'
          const inactiveClass = 'text-neutral-7 hover:text-neutral-9'

          let menuItem: React.ReactNode

          if (DropdownContent) {
            menuItem = (
              <NavigationMenu.Item value={section.path}>
                <NavigationMenu.Trigger
                  nativeButton={false}
                  render={<Link href={href} onClick={section.do} />}
                  className={clsxm(
                    'relative inline-flex cursor-pointer items-center whitespace-nowrap border-none bg-transparent px-3 py-1.5 transition duration-200',
                    isActive ? activeClass : inactiveClass,
                  )}
                >
                  <span className="relative flex items-center">
                    {isActive && (
                      <m.span
                        className="mr-2 flex items-center"
                        ref={iconSlide.ref}
                        style={iconSlide.style}
                      >
                        {activeSubItem?.icon ?? section.icon}
                      </m.span>
                    )}
                    <span>
                      {activeSubItem
                        ? getTitle(activeSubItem)
                        : getTitle(section)}
                    </span>
                  </span>
                </NavigationMenu.Trigger>
                <NavigationMenu.Content className="nav-menu-content">
                  <DropdownContent section={section} />
                </NavigationMenu.Content>
              </NavigationMenu.Item>
            )
          } else {
            const isExternal = href.startsWith('http')
            menuItem = (
              <NavigationMenu.Item>
                <NavigationMenu.Link
                  active={isActive}
                  className={clsxm(
                    'relative block whitespace-nowrap px-3 py-1.5 transition duration-200',
                    isActive ? activeClass : inactiveClass,
                  )}
                  render={
                    isExternal ? (
                      <a href={href} target="_blank" />
                    ) : (
                      <Link href={href} onClick={section.do} />
                    )
                  }
                >
                  <span className="relative flex items-center">
                    {isActive && (
                      <m.span
                        className="mr-2 flex items-center"
                        ref={iconSlide.ref}
                        style={iconSlide.style}
                      >
                        {activeSubItem?.icon ?? section.icon}
                      </m.span>
                    )}
                    <span>
                      {activeSubItem
                        ? getTitle(activeSubItem)
                        : getTitle(section)}
                    </span>
                  </span>
                </NavigationMenu.Link>
              </NavigationMenu.Item>
            )
          }

          return (
            <React.Fragment key={section.path}>
              {index > 0 && <NavSeparator />}
              {menuItem}
            </React.Fragment>
          )
        })}
      </NavigationMenu.List>

      <NavigationMenu.Portal>
        <NavigationMenu.Positioner
          className="nav-menu-positioner"
          positionMethod="fixed"
          sideOffset={12}
        >
          <NavigationMenu.Popup
            className={clsxm(
              'nav-menu-popup',
              'select-none rounded bg-[var(--color-root-bg)] dark:bg-neutral-900 outline-hidden',
              'border border-[rgba(200,180,160,0.08)] dark:border-neutral-700/20',
              'shadow-[0_8px_32px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.02)]',
              'dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
            )}
          >
            <NavigationMenu.Viewport className="nav-menu-viewport" />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  )
}
