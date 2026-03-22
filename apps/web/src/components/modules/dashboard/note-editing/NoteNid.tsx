import { buildNotePath } from '~/lib/note-route'
import { useAggregationSelector } from '~/providers/root/aggregation-data-provider'

import {
  useNoteModelDataSelector,
  useNoteModelSingleFieldAtom,
} from './data-provider'

export const NoteNid = () => {
  const webUrl = location.origin

  const [nid] = useNoteModelSingleFieldAtom('nid')
  const noteRoute = useNoteModelDataSelector((data) =>
    data
      ? buildNotePath({
          nid: data.nid || '',
          slug: data.slug,
          created: data.created,
        })
      : '',
  )

  const latestNid = useAggregationSelector((s) => s.latestNoteId)

  return (
    <label className="text-neutral-9">
      {noteRoute && !noteRoute.endsWith('/notes/')
        ? `${webUrl}${noteRoute}`
        : `${webUrl}/notes/${nid || (latestNid?.nid ? latestNid.nid + 1 : '')}`}
    </label>
  )
}
