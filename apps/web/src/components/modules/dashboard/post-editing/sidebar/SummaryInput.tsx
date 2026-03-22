import { TextArea } from '~/components/ui/input'

import { SidebarSection } from '../../writing/SidebarBase'
import { usePostModelSingleFieldAtom } from '../data-provider'

export const SummaryInput = () => {
  const [summary, setSummary] = usePostModelSingleFieldAtom('summary')

  return (
    <SidebarSection className="relative" label="摘要">
      <TextArea
        className="p-2 focus-visible:border-accent"
        placeholder="摘要"
        rounded="md"
        value={summary || ''}
        onChange={(e) => {
          setSummary(e.target.value)
        }}
      />
    </SidebarSection>
  )
}
