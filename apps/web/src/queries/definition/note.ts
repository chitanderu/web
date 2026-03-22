import type {
  NoteModel,
  NoteWrappedWithLikedAndTranslationPayload,
} from '@mx-space/api-client'
import { useMutation } from '@tanstack/react-query'

import { useResetAutoSaverData } from '~/components/modules/dashboard/writing/BaseWritingProvider'
import { cloneDeep } from '~/lib/lodash'
import { apiClient } from '~/lib/request'
import { toast } from '~/lib/toast'
import type { NoteDto } from '~/models/writing'

import { defineQuery } from '../helper'

const LATEST_KEY = 'latest'
export const note = {
  byNid: (nid: string, password?: string | null, lang?: string) =>
    defineQuery({
      queryKey: ['note', nid, lang],

      queryFn: async ({ queryKey }) => {
        const [, id, lang] = queryKey as [string, string, string | undefined]

        if (id === LATEST_KEY) {
          return (await apiClient.note.getLatest()).$serialized
        }
        const data = await apiClient.note.getNoteByNid(Number(id), {
          password: password || undefined,
          lang: lang || undefined,
          prefer: 'lexical',
        })

        return data.$serialized as NoteWrappedWithLikedAndTranslationPayload
      },
    }),
  bySlugDate: (
    year: number,
    month: number,
    day: number,
    slug: string,
    password?: string | null,
    lang?: string,
  ) =>
    defineQuery({
      queryKey: ['note', 'slug', year, month, day, slug, lang],

      queryFn: async ({ queryKey }) => {
        const [, , year, month, day, slug, lang] = queryKey as [
          string,
          string,
          number,
          number,
          number,
          string,
          string | undefined,
        ]

        const data = await apiClient.note.getNoteBySlugDate(
          year,
          month,
          day,
          slug,
          {
            password: password || undefined,
            lang: lang || undefined,
            prefer: 'lexical',
          },
        )

        return data.$serialized as NoteWrappedWithLikedAndTranslationPayload
      },
    }),
}

export const noteAdmin = {
  paginate: (page?: number) =>
    defineQuery({
      queryKey: ['noteAdmin', 'paginate', page],
      queryFn: async ({ pageParam }: any) => {
        const data = await apiClient.note.getList(pageParam ?? page)

        return data.$serialized
      },
    }),

  allTopic: () =>
    defineQuery({
      queryKey: ['noteAdmin', 'allTopic'],
      queryFn: async () => {
        const data = await apiClient.topic.getAll()

        return data.$serialized.data
      },
    }),

  getNote: (id: string) =>
    defineQuery({
      queryKey: ['noteAdmin', 'getNote', id],
      queryFn: async () => {
        const data = await apiClient.note.getNoteById(id)

        const dto = data.$serialized as NoteDto

        return dto
      },
    }),
}

export const useCreateNote = () => {
  const resetAutoSaver = useResetAutoSaverData()
  return useMutation({
    mutationFn: (data: NoteDto) => {
      const readonlyKeys = [
        'id',
        'nid',
        'modified',
        'topic',
      ] as (keyof NoteModel)[]
      const nextData = cloneDeep(data) as any
      for (const key of readonlyKeys) {
        delete nextData[key]
      }
      return apiClient.note.proxy.post<{
        id: string
      }>({
        data: nextData,
      })
    },
    onSuccess: () => {
      toast.success('创建成功')
      resetAutoSaver('note')
    },
  })
}

export const useUpdateNote = () => {
  const resetAutoSaver = useResetAutoSaverData()
  return useMutation({
    mutationFn: (data: NoteDto) => {
      const { id } = data
      const readonlyKeys = [
        'id',
        'nid',
        'modified',
        'topic',
      ] as (keyof NoteModel)[]
      const nextData = cloneDeep(data) as any
      for (const key of readonlyKeys) {
        delete nextData[key]
      }
      return apiClient.note.proxy(id).put<{
        id: string
      }>({
        data: nextData,
      })
    },
    onSuccess: ({ id }) => {
      toast.success('更新成功')
      resetAutoSaver('note', id)
    },
  })
}
