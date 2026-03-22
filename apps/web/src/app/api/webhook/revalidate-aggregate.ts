import { revalidatePath } from 'next/cache'

import { defaultLocale, locales } from '~/i18n/config'

const aggregateSections = ['notes', 'posts', 'says', 'friends', 'timeline']

const buildLocalePaths = (suffix = '') =>
  locales.map((locale) =>
    locale === defaultLocale ? suffix || '/' : `/${locale}${suffix}`,
  )

export const aggregateRevalidatePaths = [
  ...buildLocalePaths(),
  ...aggregateSections.flatMap((section) => buildLocalePaths(`/${section}`)),
]

export const revalidateAggregatePaths = async () => {
  const revalidated: string[] = []
  const failed: Array<{ path: string; message: string }> = []

  for (const path of aggregateRevalidatePaths) {
    try {
      revalidatePath(path)
      revalidated.push(path)
    } catch (error) {
      failed.push({
        path,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return {
    revalidated,
    failed,
    count: revalidated.length,
  }
}
