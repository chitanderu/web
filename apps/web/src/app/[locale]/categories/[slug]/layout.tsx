import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { NormalContainer } from '~/components/layout/container/Normal'

import { getData } from './api'

export const dynamic = 'force-dynamic'

export const generateMetadata = async (
  props: NextPageParams<{
    locale: string
    slug: string
  }>,
) => {
  const params = await props.params
  const data = await getData(params).catch(() => null)

  if (!data) {
    return {}
  }
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'post',
  })

  return {
    title: `${t('category_prefix')}${data.name}`,
  } satisfies Metadata
}
export default async function Layout(
  props: NextPageParams<{
    slug: string
  }>,
) {
  return <NormalContainer>{props.children}</NormalContainer>
}
