import type { MusicMetadata } from '@mx-space/api-client'
import { RecentlyTypeEnum } from '@mx-space/api-client'

import type { LinkCardData, LinkCardPlugin, UrlMatchResult } from '../../types'

async function fetchNeteaseSongRaw(songId: string) {
  const res = await fetch(`/api/music/netease`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ songId }),
  })
  if (!res.ok) throw new Error('Failed to fetch NeteaseMusic song')
  const data = await res.json()
  return data.songs[0]
}

export const neteaseMusicPlugin: LinkCardPlugin = {
  name: 'netease-music-song',
  displayName: 'Netease Music Song',
  priority: 60,
  typeClass: 'wide',
  recentlyType: RecentlyTypeEnum.Music,

  matchUrl(url: URL): UrlMatchResult | null {
    if (url.hostname !== 'music.163.com') return null
    if (!url.pathname.includes('/song') && !url.hash.includes('/song'))
      return null

    // Handle hash-based URLs like music.163.com/#/song?id=123
    const urlString = url.toString().replaceAll('/#/', '/')
    const _url = new URL(urlString)
    const id = _url.searchParams.get('id')

    if (!id) return null

    return {
      id,
      fullUrl: url.toString(),
    }
  },

  isValidId(id: string): boolean {
    return id.length > 0
  },

  async fetch(id: string): Promise<LinkCardData> {
    const songInfo = await fetchNeteaseSongRaw(id)
    const albumInfo = songInfo.al
    const singerInfo = songInfo.ar

    return {
      title: (
        <>
          <span>{songInfo.name}</span>
          {songInfo.tns && (
            <span className="ml-2 text-sm text-neutral-6">
              {songInfo.tns[0]}
            </span>
          )}
        </>
      ),
      desc: (
        <>
          <span className="block">
            <span className="font-bold">歌手：</span>
            <span>
              {singerInfo.map((person: any) => person.name).join(' / ')}
            </span>
          </span>
          <span className="block">
            <span className="font-bold">专辑：</span>
            <span>{albumInfo.name}</span>
          </span>
        </>
      ),
      image: albumInfo.picUrl,
      color: '#e72d2c',
    }
  },

  async fetchRawMetadata(id: string, url: string) {
    const song = await fetchNeteaseSongRaw(id)
    return {
      url,
      title: song.name || '',
      artist: (song.ar || []).map((a: any) => a.name).join(', '),
      album: song.al?.name || undefined,
      cover: song.al?.picUrl || undefined,
      source: 'NetEase',
    } satisfies MusicMetadata
  },
}
