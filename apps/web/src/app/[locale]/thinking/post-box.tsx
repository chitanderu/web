'use client'

import type { RecentlyMetadata, RecentlyModel } from '@mx-space/api-client'
import { RecentlyTypeEnum } from '@mx-space/api-client'
import type { InfiniteData } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { produce } from 'immer'
import { useTranslations } from 'next-intl'
import { useCallback, useRef, useState } from 'react'

import { useIsOwnerLogged } from '~/atoms/hooks/owner'
import { TiltedSendIcon } from '~/components/icons/TiltedSendIcon'
import { MotionButtonBase } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { MarkdownEditor } from '~/components/ui/markdown-editor'
import { preventDefault } from '~/lib/dom'
import { apiClient } from '~/lib/request'
import { toast } from '~/lib/toast'

import { QUERY_KEY } from './constants'
import { MetadataCard } from './metadata-card'
import { resolveMetadataFromUrl, typeLabels } from './resolve-metadata'

const LINK_TYPES = [
  RecentlyTypeEnum.Text,
  RecentlyTypeEnum.Link,
  RecentlyTypeEnum.Github,
  RecentlyTypeEnum.Media,
  RecentlyTypeEnum.Music,
  RecentlyTypeEnum.Book,
  RecentlyTypeEnum.Academic,
  RecentlyTypeEnum.Code,
] as const

export const PostBox = () => {
  const t = useTranslations('thinking')
  const isLogin = useIsOwnerLogged()
  const queryClient = useQueryClient()

  const [type, setType] = useState<RecentlyTypeEnum>(RecentlyTypeEnum.Text)
  const [content, setContent] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [metadata, setMetadata] = useState<RecentlyMetadata | null>(null)
  const [resolving, setResolving] = useState(false)
  const [resolvedType, setResolvedType] = useState<RecentlyTypeEnum | null>(
    null,
  )

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const handleUrlChange = useCallback(
    (value: string) => {
      setUrlInput(value)
      setMetadata(null)
      setResolvedType(null)

      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (!value.trim()) return

      debounceRef.current = setTimeout(async () => {
        setResolving(true)
        try {
          const result = await resolveMetadataFromUrl(value.trim())
          if (result) {
            setMetadata(result.metadata)
            setResolvedType(result.type)
            // Auto-switch type if user is on generic "link"
            if (
              type === RecentlyTypeEnum.Link ||
              type === RecentlyTypeEnum.Text
            ) {
              setType(result.type)
            }
          }
        } catch {
          // silent
        } finally {
          setResolving(false)
        }
      }, 600)
    },
    [type],
  )

  const isNonText = type !== RecentlyTypeEnum.Text
  const canSend = isNonText
    ? !!metadata || !!urlInput.trim()
    : content.trim().length > 0

  const { mutateAsync: handleSend, isPending } = useMutation({
    mutationFn: async () => {
      const actualType = resolvedType || type
      const payload: Record<string, any> = { content }

      if (isNonText) {
        payload.type = actualType
        if (metadata) {
          payload.metadata = metadata
        } else if (urlInput.trim()) {
          // Fallback: store URL as link metadata
          payload.type = RecentlyTypeEnum.Link
          payload.metadata = { url: urlInput.trim() }
        }
      }

      const res = await apiClient.shorthand.proxy.post({ data: payload })

      // Reset form
      setContent('')
      setUrlInput('')
      setMetadata(null)
      setResolvedType(null)
      setType(RecentlyTypeEnum.Text)

      queryClient.setQueryData<
        InfiniteData<RecentlyModel[] & { comments: number }>
      >(QUERY_KEY, (old) =>
        produce(old, (draft) => {
          draft?.pages[0].unshift(res.$serialized as any)
          return draft
        }),
      )
    },
    onError: () => {
      toast.error('Failed to send')
    },
  })

  if (!isLogin) return null

  return (
    <form className="mb-8 space-y-3" onSubmit={preventDefault}>
      {/* Type selector */}
      <div className="flex flex-wrap gap-1.5">
        {LINK_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            className={clsx(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              type === t
                ? 'bg-neutral-9 text-white dark:text-black'
                : 'bg-neutral-2 text-neutral-7 hover:bg-neutral-3',
            )}
            onClick={() => {
              setType(t)
              if (t === RecentlyTypeEnum.Text) {
                setUrlInput('')
                setMetadata(null)
                setResolvedType(null)
              }
            }}
          >
            {typeLabels[t]}
          </button>
        ))}
      </div>

      {/* URL input for non-text types */}
      {isNonText && (
        <div className="relative">
          <Input
            className="w-full"
            placeholder="Paste a URL..."
            type="url"
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
          />
          {resolving && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-6">
              Resolving...
            </span>
          )}
        </div>
      )}

      {/* Metadata preview */}
      {isNonText && metadata && resolvedType && (
        <div className="pointer-events-none">
          <MetadataCard metadata={metadata} type={resolvedType} />
        </div>
      )}

      {/* Content editor */}
      <MarkdownEditor
        value={content}
        actions={
          <div className="center absolute bottom-2 right-2 flex size-5">
            <MotionButtonBase
              className="duration-200 disabled:cursor-not-allowed disabled:opacity-10"
              disabled={!canSend || isPending}
              onClick={() => handleSend()}
            >
              <TiltedSendIcon className="size-5 text-neutral-9" />
              <span className="sr-only">{t('send')}</span>
            </MotionButtonBase>
          </div>
        }
        className={clsx(
          'bg-neutral-3/50',
          isNonText ? 'h-[80px]' : 'h-[150px]',
        )}
        placeholder={
          isNonText ? 'Add a comment... (optional)' : t('post_placeholder')
        }
        onChange={setContent}
        onSubmit={() => canSend && handleSend()}
      />
    </form>
  )
}
