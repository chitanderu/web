import { Excalidraw as Board, exportToBlob } from '@excalidraw/excalidraw'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types'
import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
} from '@excalidraw/excalidraw/types/types'
import { useQuery } from '@tanstack/react-query'
import type { Delta } from 'jsondiffpatch'
import { patch } from 'jsondiffpatch'
import * as React from 'react'
import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useIsMobile } from '~/atoms/hooks/viewport'
import { API_URL } from '~/constants/env'
import { useIsDark } from '~/hooks/common/use-is-dark'
import { stopPropagation } from '~/lib/dom'
import { clsxm, safeJsonParse } from '~/lib/helper'
import { cloneDeep } from '~/lib/lodash'
import { toast } from '~/lib/toast'

import { MotionButtonBase } from '../button'
import { useModalStack } from '../modal'

export interface ExcalidrawProps {
  className?: string
  ////
  data?: object
  onChange?: (
    elements: readonly ExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles,
  ) => void
  onReady?: (api: ExcalidrawImperativeAPI) => void
  patchDiffDelta?: Delta
  refUrl?: string

  showExtendButton?: boolean
  viewModeEnabled?: boolean
  zenModeEnabled?: boolean
}

export interface ExcalidrawRefObject {
  getDiffDelta: () => Delta | null | undefined
  getRefData: () => ExcalidrawElement | null | undefined
}
export const Excalidraw = ({
  ref,
  ...props
}: Omit<ExcalidrawProps, 'refUrl' | 'patchDiffDelta' | 'data'> & {
  data: string
} & { ref?: React.RefObject<ExcalidrawRefObject | null> }) => {
  const { data, ...rest } = props
  const transformedProps: {
    data?: ExcalidrawElement
    refUrl?: string
    patchDiffDelta?: Delta
  } = useMemo(() => {
    if (!data) return {}
    const tryParseJson = safeJsonParse(data)
    if (!tryParseJson) {
      // 1. data 是 string，取第一行判断
      const splittedLines = data.split('\n')
      const firstLine = splittedLines[0]
      const otherLines = splittedLines.slice(1).join('\n')

      const props = {} as any
      // 第一行是地址
      if (firstLine.startsWith('http')) {
        props.refUrl = firstLine
      }
      // 第一行是 ref:file/:filename
      // 命中后端文件
      else if (firstLine.startsWith('ref:')) {
        props.refUrl = `${API_URL}/objects/${firstLine.slice(4)}`
      }

      if (otherLines.trim().length > 0) {
        // 识别为其他行是 delta diff

        props.patchDiffDelta = safeJsonParse(otherLines)
      }

      return props
    } else {
      return {
        data: tryParseJson as ExcalidrawElement,
      }
    }
  }, [data])

  const internalRef = useRef<InternelExcalidrawRefObject>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hasEnteredView, setHasEnteredView] = useState(false)

  useEffect(() => {
    if (hasEnteredView) return
    const target = containerRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries.some((entry) => entry.isIntersecting)
        if (isIntersecting) {
          setHasEnteredView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '200px 0px',
        threshold: 0.1,
      },
    )

    observer.observe(target)

    return () => observer.disconnect()
  }, [hasEnteredView])

  useImperativeHandle(ref, () => ({
    getRefData() {
      return internalRef.current?.getRemoteData()
    },
    getDiffDelta() {
      return transformedProps.patchDiffDelta
    },
  }))

  if (!hasEnteredView) {
    return (
      <div
        className={clsxm('relative h-[500px] w-full', props.className)}
        ref={containerRef}
      >
        <div className="center absolute inset-0 z-10 flex">
          <div className="loading loading-spinner" />
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef}>
      <ExcalidrawImpl ref={internalRef} {...rest} {...transformedProps} />
    </div>
  )
}

Excalidraw.displayName = 'Excalidraw'

interface InternelExcalidrawRefObject {
  getRemoteData: () => ExcalidrawElement | null | undefined
}

const ExcalidrawImpl = ({
  ref,
  data,
  refUrl,
  patchDiffDelta,
  viewModeEnabled = true,
  zenModeEnabled = true,
  onChange,
  className,
  showExtendButton = true,
  onReady,
}: ExcalidrawProps & {
  ref?: React.RefObject<InternelExcalidrawRefObject | null>
}) => {
  const excalidrawAPIRef = React.useRef<ExcalidrawImperativeAPI>(undefined)
  const modal = useModalStack()
  const isMobile = useIsMobile()

  const { data: refData, isLoading } = useQuery({
    queryKey: ['excalidraw', refUrl],
    queryFn: async ({ queryKey }) => {
      const [, queryRefUrl] = queryKey
      if (typeof queryRefUrl !== 'string') {
        throw new TypeError('Excalidraw ref url is invalid')
      }
      const res = await fetch(queryRefUrl)
      return await res.json()
    },
    enabled: !!refUrl,
  })

  useImperativeHandle(ref, () => ({
    getRemoteData() {
      return refData
    },
  }))

  const finalDataIfRefUrl = useMemo(() => {
    if (!refData) return null

    return patch(cloneDeep(refData), patchDiffDelta)
  }, [refData, patchDiffDelta])

  const isDarkMode = useIsDark()

  const finalData = useMemo(() => {
    const finalData = data || finalDataIfRefUrl
    if (!finalData && !isLoading) {
      console.error('Excalidraw: data not exist')
    }
    return finalData as ExcalidrawElement
  }, [data, finalDataIfRefUrl, isLoading])

  return (
    <div
      className={clsxm('relative h-[500px] w-full', className)}
      onKeyDown={stopPropagation}
      onKeyUp={stopPropagation}
    >
      {isLoading && (
        <div className="center absolute inset-0 z-10 flex">
          <div className="loading loading-spinner" />
        </div>
      )}
      <>
        <Board
          detectScroll={false}
          initialData={finalData}
          theme={isDarkMode ? 'dark' : 'light'}
          viewModeEnabled={viewModeEnabled}
          zenModeEnabled={zenModeEnabled}
          excalidrawAPI={(api) => {
            excalidrawAPIRef.current = api

            setTimeout(() => {
              api.scrollToContent(undefined, {
                fitToContent: true,
              })
            }, 300)

            onReady?.(api)
          }}
          key={
            refUrl ? `excalidraw-refData-loading-${isLoading}` : 'excalidraw'
          }
          onChange={onChange}
        />

        {viewModeEnabled && showExtendButton && (
          <MotionButtonBase
            className={clsxm(
              'center absolute bottom-2 right-2 z-10 box-content flex size-5 rounded-md border p-2',
              'border-neutral-3 bg-neutral-1 text-neutral-7',
            )}
            onClick={() => {
              if (!excalidrawAPIRef.current) {
                toast.error('Excalidraw API not ready')
                return
              }

              const elements = excalidrawAPIRef.current.getSceneElements()
              if (isMobile) {
                const win = window.open()
                const blob = exportToBlob({
                  elements,
                  files: null,
                })
                blob.then((blob) => {
                  win?.location.replace(URL.createObjectURL(blob))
                })
              } else {
                modal.present({
                  title: 'Preview',
                  content: () => (
                    <ExcalidrawImpl
                      className="h-full"
                      data={data}
                      refUrl={refUrl}
                      showExtendButton={false}
                    />
                  ),
                  clickOutsideToDismiss: true,
                  max: true,
                })
              }
            }}
          >
            <i className="i-mingcute-external-link-line" />
          </MotionButtonBase>
        )}
      </>
    </div>
  )
}
ExcalidrawImpl.displayName = 'ExcalidrawImpl'
