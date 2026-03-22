# Fix: ShiroRenderer Bundle 静态/编辑分离

## Context

ShiroRenderer 仅用于只读渲染，但因 barrel export 将编辑器重型依赖（CodeMirror, dnd-kit, editor-ui 等）拉入 bundle。入口 chunk 达 2167 KB，含不应存在的 @codemirror/state、cm-editor、@base-ui/react 等。

根因：ext 包（code-snippet, embed, gallery, tldraw）及 renderer 包（alert, banner 等）均为单一 `.` 入口，static 和 edit 组件混合导出。`@haklex/rich-renderers/src/index.ts` barrel import 这些包时，edit 代码被一并拉入。

## 修改方案

### Step 1: 为 4 个 ext 包添加 `./static` 子路径

每个包创建 `src/static.ts`，仅导出静态组件（node 定义 + 静态 renderer + 共享类型），不含任何 edit 相关 import。

**`packages/rich-ext-code-snippet/src/static.ts`**
⚠️ 不能从 `./nodes` import `codeSnippetNodes`（因 `nodes/index.ts` 同时 import 了 CodeSnippetEditNode），需直接定义。
```ts
import type { Klass, LexicalNode } from 'lexical'
import { CodeSnippetNode } from './nodes/CodeSnippetNode'
export { CodeSnippetRenderer } from './CodeSnippetRenderer'
export type { SerializedCodeSnippetNode } from './nodes/CodeSnippetNode'
export { $createCodeSnippetNode, $isCodeSnippetNode, CodeSnippetNode } from './nodes/CodeSnippetNode'
export { CODE_SNIPPET_BLOCK_TRANSFORMER } from './transformer'
export const codeSnippetNodes: Array<Klass<LexicalNode>> = [CodeSnippetNode]
```

**`packages/rich-ext-embed/src/static.ts`**
⚠️ 同理，不能从 `./nodes` import `embedNodes`（因 `nodes/index.ts` 同时 import 了 EmbedEditNode）。
```ts
import type { Klass, LexicalNode } from 'lexical'
import { EmbedNode } from './nodes/EmbedNode'
export type { SerializedEmbedNode } from './nodes/EmbedNode'
export { $createEmbedNode, $isEmbedNode, EmbedNode } from './nodes/EmbedNode'
export const embedNodes: Array<Klass<LexicalNode>> = [EmbedNode]
export type { EmbedLinkRendererProps } from './renderers/EmbedLinkRenderer'
export { EmbedLinkRenderer } from './renderers/EmbedLinkRenderer'
export type { EmbedStaticRendererProps } from './renderers/EmbedStaticRenderer'
export { EmbedStaticRenderer } from './renderers/EmbedStaticRenderer'
export type { EmbedRendererComponent, EmbedRendererMap } from './context/EmbedRendererContext'
export { EmbedRendererProvider, useEmbedRenderers } from './context/EmbedRendererContext'
export type { EmbedType } from './url-matchers'
export { createSelfThinkingMatcher, isBilibiliVideoUrl, isCodesandboxUrl, isGistUrl, isGithubFilePreviewUrl, isTweetUrl, isYoutubeUrl, matchEmbedUrl } from './url-matchers'
```

**`packages/rich-ext-gallery/src/static.ts`**
⚠️ `galleryNodes` 在 index.ts 中定义（与 GalleryEditNode 同文件），需直接定义。
```ts
import type { Klass, LexicalNode } from 'lexical'
import { GalleryNode } from './GalleryNode'
export type { GalleryNodePayload, SerializedGalleryNode } from './GalleryNode'
export { $createGalleryNode, $isGalleryNode, GalleryNode } from './GalleryNode'
export { default, GalleryRenderer } from './GalleryRenderer'
export const galleryNodes: Array<Klass<LexicalNode>> = [GalleryNode]
```

**`packages/rich-ext-tldraw/src/static.ts`**
```ts
export type { TldrawConfig } from './TldrawConfigContext'
export { TldrawConfigProvider, useTldrawConfig } from './TldrawConfigContext'
export type { TldrawStaticRendererProps } from './TldrawDisplayRenderer'
export { TldrawDisplayRenderer } from './TldrawDisplayRenderer'
export type { SerializedTldrawNode } from './TldrawNode'
export { $createTldrawNode, $isTldrawNode, TldrawNode } from './TldrawNode'
export { TldrawSSRRenderer } from './TldrawSSRRenderer'
export type { TldrawSSRRendererProps } from './TldrawSSRRenderer'
export { TLDRAW_BLOCK_TRANSFORMER } from './transformer'
// Backward compat aliases
export { TldrawDisplayRenderer as TldrawStaticRenderer } from './TldrawDisplayRenderer'
export { TldrawDisplayRenderer as TldrawRenderer } from './TldrawDisplayRenderer'
```

每个 ext 包的 `package.json` 增加：
```json
"./static": "./src/static.ts"
```
以及 publishConfig 中对应的 dist 映射。

### Step 2: 为 renderer 包添加 `./static` 子路径

对 `rich-renderer-alert`, `rich-renderer-banner`, `rich-renderer-codeblock`, `rich-renderer-image`, `rich-renderer-video`, `rich-renderer-mention`, `rich-renderer-mermaid` 各创建 `src/static.ts`：

```ts
// rich-renderer-alert/src/static.ts
export { AlertRenderer, default } from './AlertRenderer'
```
模式相同，仅导出 `XxxRenderer`。

每个 renderer 包的 `package.json` 增加 `"./static"` 子路径。

`rich-renderer-linkcard` 比较特殊，需要将 LinkCardRenderer + plugins/utilities 放入 static.ts，edit 相关（LinkCardEditNode, PasteLinkCardPlugin, ConvertToLinkCardAction）排除。

### Step 3: 更新 `@haklex/rich-renderers`

**`src/config.ts`** — 改为从 `/static` 子路径 import：
```ts
import { CodeSnippetRenderer } from '@haklex/rich-ext-code-snippet/static'
import { GalleryRenderer } from '@haklex/rich-ext-gallery/static'
import { AlertRenderer } from '@haklex/rich-renderer-alert/static'
// ... 其余同理
```

**`src/index.ts`** — 两处修改：
1. 所有 re-export 改为从 `/static` 子路径 import
2. 移除 edit 相关 re-export（GalleryEditNode, TldrawEditNode 等），这些应在 `rich-renderers-edit` 中

各 sub-entry 文件（`code-snippet.ts`, `gallery.ts`, `tldraw.ts`, `embed.ts` 等）同样改为从 `/static` import。

### Step 4: 更新 `@haklex/rich-renderers-edit`

接收从 `rich-renderers` 移除的 edit re-exports：
- `GalleryEditNode`, `$createGalleryEditNode`, `$isGalleryEditNode`, `galleryEditNodes`
- 确认 tldraw edit exports 已存在

### Step 5: 更新 `@haklex/rich-kit-shiro/src/index.ts`

将原本从 `@haklex/rich-renderers` 导入的 edit 组件改为从 `@haklex/rich-renderers-edit` 导入。

## 涉及文件

### 新建文件
- `packages/rich-ext-code-snippet/src/static.ts`
- `packages/rich-ext-embed/src/static.ts`
- `packages/rich-ext-gallery/src/static.ts` + 可能需要 `src/nodes.ts`
- `packages/rich-ext-tldraw/src/static.ts`
- `packages/rich-renderer-alert/src/static.ts`
- `packages/rich-renderer-banner/src/static.ts`
- `packages/rich-renderer-codeblock/src/static.ts`
- `packages/rich-renderer-image/src/static.ts`
- `packages/rich-renderer-video/src/static.ts`
- `packages/rich-renderer-mention/src/static.ts`
- `packages/rich-renderer-mermaid/src/static.ts`
- `packages/rich-renderer-linkcard/src/static.ts`

### 修改文件
- 12 个包的 `package.json`（添加 `./static` exports）
- `packages/rich-renderers/src/config.ts`
- `packages/rich-renderers/src/index.ts`
- `packages/rich-renderers/src/code-snippet.ts`
- `packages/rich-renderers/src/gallery.ts`
- `packages/rich-renderers/src/tldraw.ts`
- `packages/rich-renderers/src/embed.ts`
- `packages/rich-renderers/src/alert.ts`
- `packages/rich-renderers/src/banner.ts`
- `packages/rich-renderers/src/image.ts`
- `packages/rich-renderers/src/video.ts`
- `packages/rich-renderers/src/mention.ts`
- `packages/rich-renderers/src/mermaid.ts`
- `packages/rich-renderers/src/linkcard.ts`（如存在）
- `packages/rich-renderers-edit/src/index.ts`（添加 gallery edit re-exports）
- `packages/rich-kit-shiro/src/index.ts`（edit imports 来源更改）

## 验证

1. 重新运行 `bundle-test`：`cd packages/rich-kit-shiro/bundle-test && npx vite build`
2. 运行 `summary.mjs` 对比入口 chunk 大小
3. 确认 CodeMirror、cm-editor 不再出现在入口 chunk
4. TypeScript 类型检查无误：`pnpm --filter @haklex/rich-renderers exec tsc --noEmit`
5. 确认 `@haklex/rich-kit-shiro` 的 index 入口（含 editor）仍正常构建
