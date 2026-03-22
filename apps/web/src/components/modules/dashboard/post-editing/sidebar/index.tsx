import { AIGenMetaField } from '../../writing/AIGenMetaField'
import { ImageDetailSection } from '../../writing/ImageDetailSection'
import { MetaKeyValueEditSection } from '../../writing/MetaKeyValueEditSection'
import { PresentComponentFab } from '../../writing/PresentComponentFab'
import { SidebarWrapper } from '../../writing/SidebarBase'
import { usePostModelSingleFieldAtom } from '../data-provider'
import { CategorySelector } from './CategorySelector'
import { PostCombinedSwitch } from './PostCombinedSwitch'
import { RelatedPostSelector } from './RelatedPostSelector'
import { SummaryInput } from './SummaryInput'
import { TagsInput } from './TagsInput'

const Sidebar = () => (
  <SidebarWrapper>
    <CategorySelector />
    <RelatedPostSelector />
    <TagsInput />
    <PostCombinedSwitch />
    <SummaryInput />
    <PostImageSection />
    <PostAIGenSection />
    <PostMetaSection />
  </SidebarWrapper>
)

const PostImageSection = () => {
  const [images, setImages] = usePostModelSingleFieldAtom('images')
  const text = usePostModelSingleFieldAtom('text')[0]
  return (
    <ImageDetailSection
      images={images}
      text={text}
      withDivider="both"
      onChange={setImages}
    />
  )
}

const PostMetaSection = () => {
  const [meta, setMeta] = usePostModelSingleFieldAtom('meta')
  return <MetaKeyValueEditSection keyValue={meta} onChange={setMeta} />
}

const PostAIGenSection = () => {
  const [meta, setMeta] = usePostModelSingleFieldAtom('meta')
  return <AIGenMetaField meta={meta as any} onChangeMeta={setMeta as any} />
}

export const PostEditorSidebar = () => (
  <div className="hidden flex-col lg:flex">
    <Sidebar />

    <PresentComponentFab Component={Sidebar} />
  </div>
)
