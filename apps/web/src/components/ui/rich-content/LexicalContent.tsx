'use client'

import '@haklex/rich-kit-shiro/style.css'

import type {
  EnhancedLinkCardProps,
  LinkCardFetchContext,
  PresentDialogFn,
  PresentDialogProps,
  RendererConfig,
  RichEditorVariant,
} from '@haklex/rich-kit-shiro'
import {
  createMxSpacePlugin,
  createThemeStyle,
  LinkCardFetchProvider,
  LinkCardRenderer,
  PresentDialogProvider,
} from '@haklex/rich-kit-shiro'
import { ShiroRenderer } from '@haklex/rich-kit-shiro/renderer'
import clsx from 'clsx'
import type { SerializedEditorState } from 'lexical'
import { useCallback, useMemo } from 'react'

import { getWebUrl } from '~/atoms'
import { useIsMobile } from '~/atoms/hooks/viewport'
import { Paper } from '~/components/layout/container/Paper'
import { PeekModal } from '~/components/modules/peek/PeekModal'
import { useModalStack } from '~/components/ui/modal/stacked/provider'
import { useIsDark } from '~/hooks/common/use-is-dark'
import { fetchGitHubApi } from '~/lib/github'

const fallbackSansFont =
  "var(--app-font-sans, system-ui), -apple-system, 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', Roboto, Helvetica, 'noto sans sc', 'hiragino sans gb', sans-serif, Apple Color Emoji, Segoe UI Emoji, Not Color Emoji"
const fallbackSerifFont =
  "'Noto Serif CJK SC', 'Noto Serif SC', var(--app-font-serif, 'Source Han Serif SC'), 'Source Han Serif SC', 'Source Han Serif', source-han-serif-sc, SongTi SC, SimSum, 'Hiragino Sans GB', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, 'Microsoft YaHei', 'WenQuanYi Micro Hei', sans-serif"
const fallbackMonoFont =
  "'OperatorMonoSSmLig Nerd Font', 'Cascadia Code PL', 'FantasqueSansMono Nerd Font', 'operator mono', JetBrainsMono, 'Fira code Retina', 'Fira code', Consolas, Monaco, 'Hannotate SC', monospace, -apple-system"

const linkCardFetchContext: LinkCardFetchContext = {
  adapters: {
    github: {
      request: fetchGitHubApi,
    },
    tmdb: {
      request: async (url) => {
        const u = new URL(url)
        const path = u.pathname.replace(/^\/3\//, '')
        const r = await fetch(`/api/tmdb/${path}${u.search}`)
        return await r.json()
      },
    },
    bangumi: {
      request: async (url) => {
        const u = new URL(url)
        const path = u.pathname.replace(/^\/v0\//, '')
        const r = await fetch(`/api/bangumi/${path}`)
        return await r.json()
      },
    },
    leetcode: {
      request: async (_url, init) => {
        const r = await fetch('/api/leetcode', init)
        return await r.json()
      },
    },
    'netease-music': {
      request: async (url) => {
        const songId = new URL(url).pathname.split('/').pop()
        const r = await fetch('/api/music/netease', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ songId }),
        })
        return await r.json()
      },
    },
    'qq-music': {
      request: async (url) => {
        const songId = new URL(url).pathname.split('/').pop()
        const r = await fetch('/api/music/tencent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ songId }),
        })
        return await r.json()
      },
    },
    'mx-space': {
      request: async (path) => {
        const r = await fetch(`/api/v2/${path}`)
        return await r.json()
      },
    },
  },
}

function LinkCardWithMxSpace(props: EnhancedLinkCardProps) {
  const webUrl = getWebUrl()
  const plugins = useMemo(() => {
    if (!webUrl) return
    return [createMxSpacePlugin({ webUrl })]
  }, [webUrl])
  return <LinkCardRenderer {...props} plugins={plugins} />
}

const customRendererConfig: Partial<RendererConfig> = {
  LinkCard: LinkCardWithMxSpace,
}

function PeekDialogModal({
  content: Content,
}: {
  content: PresentDialogProps['content']
}) {
  const { dismissTop } = useModalStack()
  return (
    <PeekModal>
      <Paper
        as="div"
        className="[&_.rich-content]:max-w-full! [&_.rich-content]:w-full! [&_.rich-content_table]:overflow-x-auto!"
      >
        <Content dismiss={dismissTop} />
      </Paper>
    </PeekModal>
  )
}

export interface LexicalContentProps {
  className?: string
  content: string
  variant?: RichEditorVariant
}

export function LexicalContent({
  content,
  variant,
  className,
}: LexicalContentProps) {
  const editorState = useMemo<SerializedEditorState | null>(() => {
    try {
      return JSON.parse(content)
    } catch {
      return null
    }
  }, [content])

  const isDark = useIsDark()
  const isMobile = useIsMobile()
  const { present } = useModalStack()
  const presentDialog: PresentDialogFn = useCallback(
    (props) => {
      if (isMobile) {
        present({
          title: props.title || ' ',
          content: props.content,
          clickOutsideToDismiss: props.clickOutsideToDismiss,
          modalClassName: props.className,
          contentClassName: 'p-0 -mx-2',
        })
        return
      }
      present({
        clickOutsideToDismiss: props.clickOutsideToDismiss ?? true,
        overlay: true,
        title: props.title || 'Preview',
        modalClassName:
          'relative mx-auto mt-[10vh] scrollbar-none max-w-full overflow-auto px-2 lg:max-w-[65rem] lg:p-0',
        // eslint-disable-next-line @eslint-react/no-nested-component-definitions
        CustomModalComponent: () => <PeekDialogModal content={props.content} />,
        content: () => null,
      })
    },
    [isMobile, present],
  )

  const baseVarStyle = useMemo(
    () =>
      ({
        '--font-sans': fallbackSansFont,
        '--font-serif': fallbackSerifFont,
        '--font-mono': fallbackMonoFont,
      }) as React.CSSProperties,
    [],
  )

  const editorOverrideStyle = useMemo(
    () =>
      createThemeStyle({
        color: {
          accent: 'var(--color-accent, #33a6b8)',
          link: 'var(--color-accent, #33a6b8)',
          accentLight:
            'color-mix(in srgb, var(--color-accent, #33a6b8) 20%, transparent)',
          quoteBorder: 'var(--color-accent, #33a6b8)',
        },
        layout: { maxWidth: '100%' },
        typography: {
          fontFamily:
            variant === 'note'
              ? `var(--note-font-override, ${fallbackSerifFont})`
              : fallbackSansFont,
          fontFamilySerif: fallbackSerifFont,
          fontMono: fallbackMonoFont,
        },
      }),
    [variant],
  )

  if (!editorState) return null

  return (
    <PresentDialogProvider value={presentDialog}>
      <LinkCardFetchProvider value={linkCardFetchContext}>
        <ShiroRenderer
          className={clsx(className, 'bg-transparent!')}
          rendererConfig={customRendererConfig}
          style={{ ...baseVarStyle, ...editorOverrideStyle }}
          theme={isDark ? 'dark' : 'light'}
          value={editorState}
          variant={variant}
        />
      </LinkCardFetchProvider>
    </PresentDialogProvider>
  )
}
