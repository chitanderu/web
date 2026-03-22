'use client'

import clsx from 'clsx'
import type { FC } from 'react'
import * as React from 'react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Divider } from '~/components/ui/divider'
import { useStateToRef } from '~/hooks/common/use-state-ref'
import { useMaskScrollArea } from '~/hooks/shared/use-mask-scrollarea'
import { clsxm } from '~/lib/helper'
import { springScrollToElement } from '~/lib/scroller'

import { ContinuousBar } from './ContinuousBar'
import type { TocSharedProps } from './TocAside'
import { TocGroup } from './TocGroup'
import type { ITocItem, TocItemStatus } from './TocItem'
import { TocItem } from './TocItem'
import { useVisibleHeadings } from './useVisibleHeadings'

export const TocTree: Component<
  {
    $headings: HTMLHeadingElement[]
    containerRef?: React.MutableRefObject<HTMLUListElement | null>
    scrollInNextTick?: boolean
    onItemClick?: (item: ITocItem) => void
    grouping?: boolean
  } & TocSharedProps
> = ({
  $headings,
  containerRef,
  className,
  accessory,
  scrollInNextTick,
  onItemClick,
  grouping = true,
}) => {
  const { visibleIds, activeId } = useVisibleHeadings($headings)

  const toc: ITocItem[] = useMemo(
    () =>
      Array.from($headings).map((el, idx) => {
        const depth = +el.tagName.slice(1)
        const elClone = el.cloneNode(true) as HTMLElement
        elClone.querySelectorAll('del, .katex-container').forEach((del) => {
          del.remove()
        })
        const title = elClone.textContent || ''
        return {
          depth,
          index: idx,
          title,
          anchorId: el.id,
          $heading: el,
        }
      }),
    [$headings],
  )

  const rootDepth = useMemo(
    () =>
      toc.length
        ? toc.reduce((d, cur) => Math.min(d, cur.depth), toc[0].depth)
        : 0,
    [toc],
  )

  const tocRef = useStateToRef(toc)
  const handleScrollTo = useCallback(
    (i: number, $el: HTMLElement | null, anchorId: string) => {
      onItemClick?.(tocRef.current[i])
      if ($el) {
        const handle = () => {
          springScrollToElement($el, -100)
        }
        if (scrollInNextTick) {
          requestAnimationFrame(handle)
        } else {
          handle()
        }
      }
    },
    [onItemClick, scrollInNextTick],
  )

  // Build grouped structure: top-level headings with their children
  const groups = useMemo(() => {
    if (!grouping) return null
    const result: { parent: ITocItem; children: ITocItem[] }[] = []
    for (const item of toc) {
      if (item.depth === rootDepth) {
        result.push({ parent: item, children: [] })
      } else if (result.length > 0) {
        result.at(-1).children.push(item)
      }
    }
    return result
  }, [toc, rootDepth, grouping])

  // Delayed collapse: track which groups should be expanded
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const collapseTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  )

  useEffect(() => {
    if (!groups) return

    setExpandedGroups((prev) => {
      const next = new Set<string>()
      for (const group of groups) {
        const parentVisible = visibleIds.has(group.parent.anchorId)
        const anyChildVisible = group.children.some((c) =>
          visibleIds.has(c.anchorId),
        )
        const shouldExpand = parentVisible || anyChildVisible

        if (shouldExpand) {
          next.add(group.parent.anchorId)
          const timer = collapseTimers.current.get(group.parent.anchorId)
          if (timer) {
            clearTimeout(timer)
            collapseTimers.current.delete(group.parent.anchorId)
          }
        } else if (prev.has(group.parent.anchorId)) {
          if (!collapseTimers.current.has(group.parent.anchorId)) {
            const timer = setTimeout(() => {
              setExpandedGroups((s) => {
                const ns = new Set(s)
                ns.delete(group.parent.anchorId)
                return ns
              })
              collapseTimers.current.delete(group.parent.anchorId)
            }, 300)
            collapseTimers.current.set(group.parent.anchorId, timer)
          }
          next.add(group.parent.anchorId)
        }
      }
      return next
    })

    return () => {
      collapseTimers.current.forEach((timer) => clearTimeout(timer))
      collapseTimers.current.clear()
    }
  }, [visibleIds, groups])

  const getItemStatus = useCallback(
    (anchorId: string): TocItemStatus => {
      if (anchorId === activeId) return 'active'
      if (visibleIds.has(anchorId)) return 'in-range'
      return 'inactive'
    },
    [activeId, visibleIds],
  )

  const accessoryElement = useMemo(() => {
    if (!accessory) return null
    return React.isValidElement(accessory)
      ? accessory
      : React.createElement(accessory as FC)
  }, [accessory])

  const treeRef = useRef<HTMLUListElement>(null)
  const [, maskClass] = useMaskScrollArea({ ref: treeRef })

  return (
    <ul
      ref={containerRef}
      className={clsxm(
        'scrollbar-none flex grow flex-col scroll-smooth px-2',
        className,
      )}
    >
      <ul
        className={clsx('scrollbar-none relative overflow-auto', maskClass)}
        ref={treeRef}
      >
        <ContinuousBar containerRef={treeRef} visibleIds={visibleIds} />

        {groups
          ? groups.map((group) => (
              <React.Fragment key={group.parent.anchorId}>
                <MemoedItem
                  heading={group.parent}
                  rootDepth={rootDepth}
                  status={getItemStatus(group.parent.anchorId)}
                  onClick={handleScrollTo}
                />
                {group.children.length > 0 && (
                  <TocGroup
                    expanded={expandedGroups.has(group.parent.anchorId)}
                  >
                    {group.children.map((child) => (
                      <MemoedItem
                        heading={child}
                        key={child.anchorId}
                        rootDepth={rootDepth}
                        status={getItemStatus(child.anchorId)}
                        onClick={handleScrollTo}
                      />
                    ))}
                  </TocGroup>
                )}
              </React.Fragment>
            ))
          : toc.map((heading) => (
              <MemoedItem
                heading={heading}
                key={heading.anchorId}
                rootDepth={rootDepth}
                status={getItemStatus(heading.anchorId)}
                onClick={handleScrollTo}
              />
            ))}
      </ul>
      {accessoryElement && (
        <li className="shrink-0">
          {toc.length > 0 && <Divider />}
          {accessoryElement}
        </li>
      )}
    </ul>
  )
}

const MemoedItem = memo<{
  status: TocItemStatus
  heading: ITocItem
  rootDepth: number
  onClick?: (i: number, $el: HTMLElement | null, anchorId: string) => void
}>(({ heading, status, onClick, rootDepth }) => {
  const itemRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (status !== 'active') return
    const $item = itemRef.current
    if (!$item) return
    const $container = $item.closest('ul')
    if (!$container) return

    const containerHeight = $container.clientHeight
    const itemHeight = $item.clientHeight
    const itemOffsetTop = $item.offsetTop
    const { scrollTop } = $container

    const itemTop = itemOffsetTop - scrollTop
    const itemBottom = itemTop + itemHeight
    if (itemTop < 0 || itemBottom > containerHeight) {
      $container.scrollTop =
        itemOffsetTop - containerHeight / 2 + itemHeight / 2
    }
  }, [status])

  return (
    <li
      className="relative leading-none"
      data-anchor-id={heading.anchorId}
      ref={itemRef}
    >
      <TocItem
        heading={heading}
        rootDepth={rootDepth}
        status={status}
        onClick={onClick}
      />
    </li>
  )
})
MemoedItem.displayName = 'MemoedItem'
