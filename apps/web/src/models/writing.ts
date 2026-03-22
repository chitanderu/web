import type { PostModel } from '@mx-space/api-client'

export interface Count {
  like: number
  read: number
}

export interface Image {
  accent?: string
  blurhash?: string
  height: number
  src: string
  type: string
  width: number
}

export class BaseModel {
  created?: Date
  id?: string
}

export type WriteBaseType = {
  title: string
  text: string
  allowComment: boolean

  id: string
  images: Image[]
  created?: string
  modified?: string

  meta?: any
}

export type PostRelated = Pick<
  PostModel,
  'title' | 'id' | 'slug' | 'categoryId' | 'category'
>
export type PostDto = WriteBaseType & {
  slug: string
  categoryId: string
  copyright: boolean
  tags: string[]
  summary: string
  pinOrder: number
  pin: string | null
  relatedId: string[]
  related?: PostRelated[]
}

export interface NoteMusicRecord {
  id: string
  type: string
}

export interface Coordinate {
  latitude: number
  longitude: number
}

export type NoteDto = {
  hide?: boolean
  mood: string | null
  weather: string | null
  slug?: string
  password: string | null
  publicAt?: Date | null
  bookmark?: boolean
  music?: NoteMusicRecord[]
  location?: null | string
  nid?: null | number
  coordinates?: null | Coordinate
  topicId: string | null | undefined
} & WriteBaseType

export { type Pager, type PaginateResult } from '@mx-space/api-client'
