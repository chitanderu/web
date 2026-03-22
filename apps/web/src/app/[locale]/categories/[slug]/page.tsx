import { getTranslations } from 'next-intl/server'

import { BackToTopFAB } from '~/components/ui/fab'
import { TimelineList } from '~/components/ui/list/TimelineList'
import { TimelineListItem } from '~/components/ui/list/TimelineListItem'
import { TimelineSpineLayout } from '~/components/ui/list/TimelineSpineLayout'
import { BottomToUpSoftScaleTransitionView } from '~/components/ui/transition'
import { definePrerenderPage } from '~/lib/request.server'
import { routeBuilder, Routes } from '~/lib/route-builder'

import { getData } from './api'

export default definePrerenderPage<{ slug: string; locale: string }>()({
  fetcher(params) {
    return getData({ slug: params.slug })
  },

  Component: async ({ data, params: { slug, locale } }) => {
    const { name, children } = data
    const t = await getTranslations({
      namespace: 'post',
      locale,
    })

    return (
      <BottomToUpSoftScaleTransitionView>
        <TimelineSpineLayout
          title={`${t('category_prefix')}${name}`}
          description={
            children.length > 0
              ? `${t('category_count_prefix')} ${children.length} ${t('category_count_suffix')}`
              : t('category_empty')
          }
        >
          <TimelineList>
            {children.map((child) => (
              <TimelineListItem
                date={new Date(child.created)}
                key={child.id}
                label={child.title}
                href={routeBuilder(Routes.Post, {
                  slug: child.slug,
                  category: slug as string,
                })}
              />
            ))}
          </TimelineList>
        </TimelineSpineLayout>
        <BackToTopFAB />
      </BottomToUpSoftScaleTransitionView>
    )
  },
})
