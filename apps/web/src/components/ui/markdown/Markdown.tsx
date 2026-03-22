'use client'

import './markdown.css'
import './markdown-variants.css'
import './renderers/index.css'

import { clsx } from 'clsx'
import type { MarkdownToJSX } from 'markdown-to-jsx'
import { compiler, RuleType, sanitizer } from 'markdown-to-jsx'
import Script from 'next/script'
import type * as React from 'react'
import type { FC, PropsWithChildren } from 'react'
import { Fragment, memo, Suspense, useCallback, useMemo } from 'react'

import { setMainMarkdownElement } from '~/atoms/hooks/reading'
import { ErrorBoundary } from '~/components/common/ErrorBoundary'
import { CodeBlockRender } from '~/components/modules/shared/CodeBlock'
import { FloatPopover } from '~/components/ui/float-popover'
import { MAIN_CONTENT_ID } from '~/constants/dom-id'
import { isDev } from '~/lib/env'
import { noopObj } from '~/lib/noop'
import { springScrollToElement } from '~/lib/scroller'

import { Gallery } from '../gallery'
import { MarkdownLink } from '../link/MarkdownLink'
import { LinkCard, LinkCardSource } from '../link-card'
import { ContainerRule } from './parsers/container'
import { InsertRule } from './parsers/ins'
import { KateXBlockRule, KateXRule } from './parsers/katex'
import { MentionRule } from './parsers/mention'
import { SpoilerRule } from './parsers/spoiler'
import {
  MParagraph,
  MTable,
  MTableBody,
  MTableHead,
  MTableRow,
  MTableTd,
  MTableTh,
} from './renderers'
import { MBlockQuote } from './renderers/blockqoute'
import { MDetails } from './renderers/collapse'
import { MFootNote } from './renderers/footnotes'
import { createMarkdownHeadingComponent } from './renderers/heading'
import { MarkdownImage } from './renderers/image'
import { Tab, Tabs } from './renderers/tabs'
import { MTag } from './renderers/tag'
import { Video } from './renderers/video'
import { getFootNoteDomId, getFootNoteRefDomId } from './utils/get-id'
import { redHighlight } from './utils/redHighlight'

export type MarkdownVariant = 'post' | 'note' | 'comment'

export interface MdProps {
  allowsScript?: boolean

  as?: React.ElementType
  className?: string
  codeBlockFully?: boolean
  removeWrapper?: boolean
  readonly renderers?: Partial<MarkdownToJSX.PartialRules>
  style?: React.CSSProperties
  value?: string

  variant?: MarkdownVariant

  wrapperProps?: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >

  wrapperRef?: React.Ref<HTMLElement>
}

const debugValue = isDev
  ? ''
  : //       '```component shadow with-styles\n' +
    //         `import=https://cdn.jsdelivr.net/npm/@innei/react-cdn-components@0.0.33/dist/components/ShadowDOMTest.js
    // name=MDX.ShadowDOMTest
    // height=4 05` +
    //         '\n' +
    //         '```',
    //     ].join('')
    null

export const Markdown: FC<MdProps & MarkdownToJSX.Options & PropsWithChildren> =
  memo((props) => {
    const {
      value,
      renderers,
      style,
      wrapperProps = {},
      wrapperRef,
      codeBlockFully = false,
      className,
      overrides,
      extendsRules,

      as: As = 'div',
      allowsScript = false,
      removeWrapper = false,
      variant = 'post',

      ...rest
    } = props

    const MHeader = useMemo(() => createMarkdownHeadingComponent(), [])

    const node = useMemo(() => {
      const mdContent = debugValue || value || props.children

      if (!mdContent) return null
      if (typeof mdContent !== 'string') return null

      const mdElement = compiler(mdContent, {
        slugify,
        doNotProcessHtmlElements: ['tab', 'style', 'script'] as any[],
        wrapper: null,

        overrides: {
          p: MParagraph,

          thead: MTableHead,
          tr: MTableRow,
          tbody: MTableBody,
          td: MTableTd,
          th: MTableTh,
          table: MTable,
          // FIXME: footer tag in raw html will renders not as expected, but footer tag in this markdown lib will wrapper as linkReferer footnotes
          footer: MFootNote,
          details: MDetails,
          img: MarkdownImage,
          tag: MTag,

          Tabs,

          tab: Tab,
          video: Video,

          // for custom react component
          // Tag: MTag,

          LinkCard,
          Gallery,
          script: allowsScript ? Script : undefined!,

          ...overrides,
        },

        overrideRules: {
          [RuleType.heading]: {
            render(node, output, state) {
              return (
                <MHeader id={node.id} key={state?.key} level={node.level}>
                  {output(node.children, state!)}
                </MHeader>
              )
            },
          },
          [RuleType.textMarked]: {
            render(node, output, state) {
              return (
                <mark className="rounded-md" key={state?.key}>
                  <span className="px-1">{output(node.children, state!)}</span>
                </mark>
              )
            },
          },
          [RuleType.gfmTask]: {
            render(node, _, state) {
              return (
                <input
                  readOnly
                  checked={node.completed}
                  className="size-[1em]!"
                  key={state?.key}
                  type="checkbox"
                />
              )
            },
          },

          [RuleType.link]: {
            render(node, output, state) {
              const { target, title } = node

              let realText = ''

              for (const child of node.children) {
                if (child.type === RuleType.text) {
                  realText += child.text
                }
              }

              return (
                <MarkdownLink
                  href={sanitizer(target)!}
                  key={state?.key}
                  text={realText}
                  title={title}
                >
                  {output(node.children, state!)}
                </MarkdownLink>
              )
            },
          },

          [RuleType.blockQuote]: {
            render(node, output, state) {
              return (
                <MBlockQuote alert={node.alert} key={state?.key}>
                  {output(node.children, state!)}
                </MBlockQuote>
              )
            },
          },

          [RuleType.footnoteReference]: {
            render(node, output, state) {
              const { footnoteMap, text } = node
              const footnote = footnoteMap.get(text)
              const linkCardId = (() => {
                try {
                  const thisUrl = new URL(
                    footnote?.footnote?.replace(': ', '') ?? '',
                  )
                  const isCurrentHost =
                    thisUrl.hostname === window.location.hostname
                  if (!isCurrentHost && !isDev) {
                    return
                  }
                  const { pathname } = thisUrl
                  return pathname.slice(1)
                } catch {
                  return
                }
              })()

              return (
                <Fragment key={state?.key}>
                  <FloatPopover
                    as="span"
                    type="tooltip"
                    wrapperClassName="inline"
                    triggerElement={
                      <a
                        href={`${getFootNoteDomId(text)}`}
                        onClick={(e) => {
                          e.preventDefault()
                          const id = getFootNoteDomId(text)
                          springScrollToElement(
                            document.getElementById(id)!,
                            -window.innerHeight / 2,
                          )
                          redHighlight(id)
                        }}
                      >
                        <sup
                          id={`${getFootNoteRefDomId(text)}`}
                        >{`[^${text}]`}</sup>
                      </a>
                    }
                  >
                    {footnote?.footnote?.slice(1)}
                  </FloatPopover>
                  {linkCardId && (
                    <LinkCard
                      id={linkCardId}
                      source={LinkCardSource.MixSpace}
                    />
                  )}
                </Fragment>
              )
            },
          },

          [RuleType.codeBlock]: {
            render(node, output, state) {
              return (
                <CodeBlockRender
                  attrs={node?.rawAttrs}
                  content={node.text}
                  key={state?.key}
                  lang={node.lang}
                />
              )
            },
          },
          [RuleType.codeInline]: {
            render(node, output, state) {
              return (
                <code
                  className="rounded-md bg-neutral-3 px-2 font-mono"
                  key={state?.key}
                >
                  {node.text}
                </code>
              )
            },
          },

          [RuleType.orderedList]: listRule as any,
          [RuleType.unorderedList]: listRule as any,

          ...renderers,
        },
        extendsRules: {
          spoilder: SpoilerRule,
          mention: MentionRule,

          ins: InsertRule,
          kateX: KateXRule,
          kateXBlock: KateXBlockRule,
          container: ContainerRule,
          ...extendsRules,
        },
        ...rest,
      })

      return mdElement
    }, [
      value,
      props.children,
      allowsScript,
      overrides,
      extendsRules,
      renderers,
      rest,
      MHeader,
    ])

    if (removeWrapper) return <Suspense>{node}</Suspense>

    return (
      <ErrorBoundary>
        <Suspense>
          <As
            style={style}
            {...wrapperProps}
            ref={wrapperRef as any}
            className={clsx(
              'markdown',
              codeBlockFully ? 'markdown--code-fully' : undefined,
              variant !== 'post' && `markdown--${variant}`,
              className,
            )}
          >
            {node}
          </As>
        </Suspense>
      </ErrorBoundary>
    )
  })
Markdown.displayName = 'Markdown'

export const MainMarkdown: FC<
  MdProps & MarkdownToJSX.Options & PropsWithChildren
> = (props) => {
  const { wrapperProps = noopObj } = props
  const setMainMarkdownRef = useCallback((element: HTMLElement | null) => {
    setMainMarkdownElement(element)
  }, [])

  return (
    <Markdown
      as="main"
      {...props}
      wrapperRef={setMainMarkdownRef}
      wrapperProps={useMemo(
        () => ({
          ...wrapperProps,
          id: MAIN_CONTENT_ID,
        }),
        [wrapperProps],
      )}
    />
  )
}

// not complete, but probably good enough
function slugify(str: string) {
  return (
    str
      .replaceAll(/[àáâãäåæ]/gi, 'a')
      .replaceAll(/ç/gi, 'c')
      .replaceAll(/ð/gi, 'd')
      .replaceAll(/[èéêë]/gi, 'e')
      .replaceAll(/[ìíîï]/gi, 'i')
      .replaceAll(/ñ/gi, 'n')
      .replaceAll(/[òóôõøœ]/gi, 'o')
      .replaceAll(/[ùúûü]/gi, 'u')
      .replaceAll(/[ýÿ]/gi, 'y')
      // remove non-chinese, non-latin, non-number, non-space
      .replaceAll(
        /[^\d a-z\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF-]/gi,
        '',
      )
      .replaceAll(' ', '-')
      .toLowerCase()
  )
}

const listRule: Partial<
  MarkdownToJSX.Rule<
    MarkdownToJSX.OrderedListNode | MarkdownToJSX.UnorderedListNode
  >
> = {
  render(node, output, state) {
    const Tag = node.ordered ? 'ol' : 'ul'

    return (
      <Tag
        key={state?.key}
        start={node.type === RuleType.orderedList ? node.start : undefined}
      >
        {node.items.map((item: any, i: number) => {
          let className = ''
          if (item[0]?.type === 'gfmTask') {
            className = 'list-none flex items-center'
          }

          return (
            <li className={className} key={i}>
              {output(item, state!)}
            </li>
          )
        })}
      </Tag>
    )
  },
}
