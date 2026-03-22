import { atom } from 'jotai'

import { jotaiStore } from '~/lib/store'

export interface UrlConfig {
  adminUrl: string

  webUrl: string
}

export const adminUrlAtom = atom<string | null>(null)
export const webUrlAtom = atom<string | null>(null)

export const getWebUrl = () => jotaiStore.get(webUrlAtom)
export const setWebUrl = (url: string) => jotaiStore.set(webUrlAtom, url)
export const getAdminUrl = () => jotaiStore.get(adminUrlAtom)
