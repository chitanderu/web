import type { RecentlyMetadata } from '@mx-space/api-client'
import { RecentlyTypeEnum } from '@mx-space/api-client'

import { plugins } from '~/components/ui/link-card/plugins'

export interface ResolvedMetadata {
  metadata: RecentlyMetadata
  type: RecentlyTypeEnum
}

/**
 * Resolve a URL into typed metadata by matching against the
 * link card plugin registry.
 *
 * Each plugin that implements `fetchRawMetadata` can be used
 * for backend metadata storage (thinking page PostBox).
 */
export async function resolveMetadataFromUrl(
  urlString: string,
): Promise<ResolvedMetadata | null> {
  let url: URL
  try {
    url = new URL(urlString)
  } catch {
    return null
  }

  for (const plugin of plugins) {
    const match = plugin.matchUrl(url)
    if (!match) continue
    if (!plugin.recentlyType || !plugin.fetchRawMetadata) continue

    try {
      const metadata = await plugin.fetchRawMetadata(
        match.id,
        urlString,
        match.meta,
      )
      return { type: plugin.recentlyType, metadata }
    } catch {
      // Plugin fetch failed, continue to next or fallback
      continue
    }
  }

  // Fallback: generic link with just the URL
  return {
    type: RecentlyTypeEnum.Link,
    metadata: { url: urlString },
  }
}

// --- Type label map for UI ---

export const typeLabels: Record<RecentlyTypeEnum, string> = {
  [RecentlyTypeEnum.Text]: 'Text',
  [RecentlyTypeEnum.Book]: 'Book',
  [RecentlyTypeEnum.Media]: 'Media',
  [RecentlyTypeEnum.Music]: 'Music',
  [RecentlyTypeEnum.Github]: 'GitHub',
  [RecentlyTypeEnum.Link]: 'Link',
  [RecentlyTypeEnum.Academic]: 'Paper',
  [RecentlyTypeEnum.Code]: 'Code',
}
