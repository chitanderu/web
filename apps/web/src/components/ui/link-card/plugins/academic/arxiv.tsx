import type { AcademicMetadata } from '@mx-space/api-client'
import { RecentlyTypeEnum } from '@mx-space/api-client'

import type { LinkCardData, LinkCardPlugin, UrlMatchResult } from '../../types'

async function fetchArxivRaw(id: string) {
  const response = await fetch(
    `https://export.arxiv.org/api/query?id_list=${id}`,
  )
  const text = await response.text()
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(text, 'application/xml')
  const entry = xmlDoc.getElementsByTagName('entry')[0]
  const title = entry.getElementsByTagName('title')[0].textContent?.trim() || ''
  const authors = Array.from(entry.getElementsByTagName('author')).map(
    (a) => a.getElementsByTagName('name')[0].textContent?.trim() || '',
  )
  return { title, authors }
}

export const arxivPlugin: LinkCardPlugin = {
  name: 'arxiv',
  displayName: 'arXiv Paper',
  priority: 80,
  typeClass: 'academic',
  recentlyType: RecentlyTypeEnum.Academic,

  matchUrl(url: URL): UrlMatchResult | null {
    if (url.hostname !== 'arxiv.org') return null
    // Match /abs/2301.12345 or /pdf/2301.12345v1
    const match = url.pathname.match(/\/(abs|pdf)\/(\d{4}\.\d+(?:v\d+)?)/i)
    if (!match) return null

    return {
      id: match[2].toLowerCase(),
      fullUrl: url.toString(),
    }
  },

  isValidId(id: string): boolean {
    return /^\d{4}\.\d+(?:v\d+)?$/.test(id)
  },

  async fetch(id: string): Promise<LinkCardData> {
    const { title, authors } = await fetchArxivRaw(id)

    return {
      title: (
        <span className="flex items-center gap-2">
          <span className="flex-1">{title}</span>
          <span className="shrink-0 place-self-end">
            <span className="inline-flex shrink-0 items-center gap-1 self-center text-sm text-orange-400 dark:text-yellow-500">
              <span className="font-sans font-medium">{id}</span>
            </span>
          </span>
        </span>
      ),
      desc: authors.length > 1 ? `${authors[0]} et al.` : authors[0],
    }
  },

  async fetchRawMetadata(id: string, url: string) {
    const { title, authors } = await fetchArxivRaw(id)

    return {
      url,
      title,
      authors: authors.length > 0 ? authors : undefined,
      arxivId: id,
    } satisfies AcademicMetadata
  },
}
