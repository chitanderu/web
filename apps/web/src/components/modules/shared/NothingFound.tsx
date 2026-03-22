'use client'

import { useTranslations } from 'next-intl'

import { EmptyIcon } from '~/components/icons/empty'
import { NormalContainer } from '~/components/layout/container/Normal'

export const NothingFound: Component = () => {
  const t = useTranslations('common')

  return (
    <NormalContainer className="center flex h-[500px] flex-col space-y-4 [&_p]:my-4">
      <EmptyIcon />
      <p>{t('empty_nothing')}</p>
      <p>{t('empty_comeback')}</p>
    </NormalContainer>
  )
}
