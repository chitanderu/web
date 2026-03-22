import {
  type AggregateRootWithTheme,
  simpleCamelcaseKeys,
} from '@mx-space/api-client'
import { getLocale } from 'next-intl/server'

import { defaultThemeConfig } from '~/app.default.theme-config'
import { appStaticConfig } from '~/app.static.config'
import { resolveLocaleOverride } from '~/i18n/resolve-locale-override'
import { deepMerge } from '~/lib/lodash'
import { fetchServerApiJson } from '~/lib/server-api-fetch'

import type { AggregationDataPayload } from './aggregation-data'

const cacheTime = appStaticConfig.cache.enabled
  ? appStaticConfig.cache.ttl.aggregation
  : 0

type AggregateRootWithThemeCompat = AggregateRootWithTheme<AppThemeConfig> & {
  categories?: AggregationDataPayload['categories']
  pageMeta?: AggregationDataPayload['pageMeta']
}

const withMergedTheme = (
  data: AggregateRootWithThemeCompat,
): AggregationDataPayload =>
  ({
    ...data,
    categories: data.categories || [],
    pageMeta: data.pageMeta || null,
    theme: data.theme
      ? deepMerge(defaultThemeConfig, data.theme)
      : defaultThemeConfig,
  }) as AggregationDataPayload

export const fetchAggregationData = async ({
  locale,
  revalidate,
}: {
  locale?: string
  revalidate?: number
} = {}): Promise<AggregationDataPayload> => {
  const resolvedLocale = await resolveLocaleOverride(locale, getLocale)
  const data = simpleCamelcaseKeys<AggregateRootWithThemeCompat>(
    await fetchServerApiJson('aggregate', {
      locale: resolvedLocale,
      next:
        (revalidate ?? cacheTime) > 0
          ? { revalidate: revalidate ?? cacheTime }
          : undefined,
      query: {
        theme: 'shiro',
      },
    }),
  )

  return withMergedTheme(data)
}
