import { apiClient } from '~/lib/request'
import { defineQuery } from '~/queries/helper'

export const getTopicQuery = (topicSlug: string, locale?: string) =>
  defineQuery({
    queryKey: ['topic', topicSlug, locale],
    queryFn: async ({ queryKey }) => {
      const [_, slug] = queryKey
      return (await apiClient.topic.getTopicBySlug(slug!)).$serialized
    },
  })
