import { ColorSchemeProvider } from '@haklex/rich-kit-shiro/editor-core'
import { MermaidRenderer } from '@haklex/rich-kit-shiro/renderers'

import { useIsDark } from '~/hooks/common/use-is-dark'

export const Mermaid = ({ content }: { content: string }) => {
  const isDark = useIsDark()
  return (
    <ColorSchemeProvider colorScheme={isDark ? 'dark' : 'light'}>
      <MermaidRenderer content={content} />
    </ColorSchemeProvider>
  )
}
