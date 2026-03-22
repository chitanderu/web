# Plan: `@haklex/rich-ext-code-snippet`

## Context

Create a new rich-editor extension for multi-file code snippets. Supports tabbed file display with shiki syntax highlighting (static), and a full IDE-like edit modal with shikicode editor and file management (edit). Replaces the deleted `rich-ext-tabs` slot conceptually but is a distinct feature.

## Step 1: Export shiki/constants from `@haklex/rich-renderer-codeblock`

Add sub-path exports so code-snippet can reuse the singleton highlighter and language utilities.

**Files:**
- `packages/rich-renderer-codeblock/package.json` — add `"./shiki"` and `"./constants"` exports
- `packages/rich-renderer-codeblock/src/index.ts` — no change (sub-paths point to separate files)

Add to `exports`:
```json
"./shiki": "./src/shiki.ts",
"./constants": "./src/constants.ts"
```
And matching `publishConfig.exports`.

## Step 2: Add `CodeSnippet` to `RendererConfig`

**Files:**
- `packages/rich-editor/src/types/renderer-config.ts` — add `CodeFile` interface, `CodeSnippetRendererProps`, and `CodeSnippet` field on `RendererConfig`
- `packages/rich-editor/src/index.ts` — export `CodeFile`, `CodeSnippetRendererProps`

```ts
export interface CodeFile {
  filename: string
  code: string
  language?: string
  highlightLines?: number[]
}
export interface CodeSnippetRendererProps {
  files: CodeFile[]
  title?: string
}
// In RendererConfig:
CodeSnippet?: ComponentType<CodeSnippetRendererProps>
```

## Step 3: Create `packages/rich-ext-code-snippet/` package scaffold

**New files:**
- `package.json` — name `@haklex/rich-ext-code-snippet`, deps: `@haklex/rich-renderer-codeblock`, `@haklex/rich-style-token`, `lucide-react`, `shikicode`, `@iconify-json/material-icon-theme`, `@iconify/utils`; peerDeps: `@haklex/rich-editor`, `@haklex/rich-editor-ui`, `lexical`, `react`
- `vite.config.ts` — `createViteConfig({ vanillaExtract: true, external: { include: ['@haklex/rich-editor', '@haklex/rich-renderer-codeblock', 'lexical'], startsWith: ['@lexical/', '@base-ui/', 'lucide-react', '@haklex/rich-editor-ui', 'shiki'] } })`
- `tsconfig.json` — standard (copy from rich-ext-embed)

## Step 4: Create `CodeSnippetNode` (static node)

**New file:** `src/nodes/CodeSnippetNode.ts`

Pattern: follow `CodeBlockNode` from `packages/rich-editor/src/nodes/CodeBlockNode.ts`

- `type: 'code-snippet'`
- Fields: `__files: CodeFile[]`, `__title: string`
- `importJSON` / `exportJSON` with `{ files, title, version: 1 }`
- `createDOM()` → `<div class="rich-code-snippet">`
- `decorate()` → `createRendererDecoration('CodeSnippet', CodeSnippetRenderer, { files, title })`
- Helpers: `$createCodeSnippetNode(files, title?)`, `$isCodeSnippetNode(node)`
- Getters/setters: `getFiles/setFiles`, `getTitle/setTitle`

## Step 5: Create `CodeSnippetEditNode` (edit node)

**New file:** `src/nodes/CodeSnippetEditNode.ts`

Pattern: follow `EmbedEditNode` from `packages/rich-ext-embed/src/nodes/EmbedEditNode.ts`

- Extends `CodeSnippetNode`
- Override `clone`, `importJSON`, `decorate`
- `decorate()` → `createElement(CodeSnippetEditDecorator, { nodeKey, files, title })`
- `slashMenuItems` for slash menu insertion (icon: `FileCode` from lucide-react)

## Step 6: Create `nodes/index.ts`

```ts
export const codeSnippetNodes = [CodeSnippetNode]
export const codeSnippetEditNodes = [CodeSnippetEditNode]
```

## Step 7: Create `CodeSnippetRenderer` (static renderer)

**New file:** `src/CodeSnippetRenderer.tsx`

Reference UI: `/private/tmp/mdx-code-snippet-component/components/code-block/code-block.tsx`

- Props: `CodeSnippetRendererProps` (from `@haklex/rich-editor`)
- Use `getHighlighterWithLang` + `SHIKI_THEMES` from `@haklex/rich-renderer-codeblock/shiki`
- Use `normalizeLanguage`, `languageToColorMap` from `@haklex/rich-renderer-codeblock/constants`
- State: `activeIndex`, `html` (per file, keyed)
- Layout:
  - Header: multi-file → tab buttons with FileIcon + filename; single-file → title bar
  - Right: CopyButton (hover reveal)
  - Separator line
  - Code area: shiki `codeToHtml` → `dangerouslySetInnerHTML`, fallback `<pre>` while loading
- `getLanguageFromFilename(filename)` utility in `src/utils.ts`

## Step 8: Create `CodeSnippetEditDecorator`

**New file:** `src/CodeSnippetEditDecorator.tsx`

Pattern: follow CodeBlockEditNode's decorator concept

- Uses `useLexicalComposerContext()` to get editor
- Wires `onFilesChange` callback: `editor.update(() => { node.setFiles(newFiles) })`
- Passes `{ files, title, onFilesChange }` to `CodeSnippetEditRenderer`
- Uses `createRendererDecoration` pattern or renders edit renderer directly

## Step 9: Create `CodeSnippetEditRenderer`

**New file:** `src/CodeSnippetEditRenderer.tsx`

- Renders static `CodeSnippetRenderer` as base display
- Overlays edit button (pencil icon, hover reveal)
- On click: calls `presentDialog` (from `@haklex/rich-editor-ui`) to open `CodeEditorModal`
- `presentDialog({ content: ({ dismiss }) => <CodeEditorModal ... dismiss={dismiss} /> })`

## Step 10: Create `CodeEditorModal`

**New file:** `src/CodeEditorModal.tsx`

Reference UI: `/private/tmp/code-editor-modal.tsx`

Uses `@haklex/rich-editor-ui` Dialog primitives (NOT radix directly).

Layout:
- **Title bar** (h-11): traffic light dots (close=dismiss, green=fullscreen toggle) + title text + fullscreen/close buttons
- **Body** (flex row):
  - **Left sidebar** (w-56): "Files" header + `<FileTree>` + "Add file" button at bottom
  - **Right panel** (flex-1):
    - Breadcrumb bar (h-9): FileIcon + filename + language label + CopyButton
    - Code editor: shikicode instance (imperative, like `CodeBlockEditRenderer`)
- Fullscreen mode: `inset-0` fixed, toggled via state
- ESC closes (unless fullscreen → exit fullscreen first)
- On dismiss: call `onFilesChange(editedFiles)` to commit changes back

State management:
- Local `editFiles` state (deep copy of input `files`)
- `activeFilename` tracking
- Changes accumulate locally, committed on close/save

## Step 11: Create `FileTree`

**New file:** `src/FileTree.tsx`

- Props: `{ files: CodeFile[], activeFilename, onSelect, onAdd, onDelete, onRename }`
- Flat list of files (sorted by filename)
- Each item: FileIcon (material-icon-theme) + filename, click to select
- Active item highlighted
- Hover reveals delete button (X icon)
- Double-click filename to enter inline rename mode
- "+" button at top or bottom to add new file (inline input for filename)

## Step 12: Create `FileIcon` component and `utils.ts`

**New files:** `src/FileIcon.tsx`, `src/utils.ts`

### FileIcon
Uses `@iconify-json/material-icon-theme` + `@iconify/utils` for file type icons:

```tsx
import { icons } from '@iconify-json/material-icon-theme'
import { getIconData, iconToSVG, iconToHTML } from '@iconify/utils'

// Map file extension → material-icon-theme icon name
const EXT_TO_ICON: Record<string, string> = {
  ts: 'typescript', js: 'javascript', tsx: 'react_ts', jsx: 'react',
  py: 'python', rs: 'rust', go: 'go', java: 'java',
  html: 'html', css: 'css', scss: 'sass', json: 'json',
  md: 'markdown', sh: 'console', yml: 'yaml', yaml: 'yaml',
  sql: 'database', c: 'c', cpp: 'cpp', swift: 'swift', kt: 'kotlin',
}

function getIconSvg(filename: string): string | null {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const iconName = EXT_TO_ICON[ext] ?? 'file'
  const data = getIconData(icons, iconName)
  if (!data) return null
  const svg = iconToSVG(data)
  return iconToHTML(svg.body, svg.attributes)
}
```

Renders inline SVG via `dangerouslySetInnerHTML` with size constraints.

### utils.ts
`getLanguageFromFilename(filename)` — maps file extension to shiki language identifier:

```ts
const EXT_TO_LANG: Record<string, string> = {
  ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx',
  py: 'python', rs: 'rust', go: 'go', java: 'java',
  html: 'html', css: 'css', scss: 'scss', json: 'json',
  md: 'markdown', sh: 'bash', yml: 'yaml', yaml: 'yaml',
  sql: 'sql', c: 'c', cpp: 'cpp', swift: 'swift', kt: 'kotlin',
}
```

## Step 13: Create `styles.css.ts`

**New file:** `src/styles.css.ts`

Vanilla Extract styles for:
- `.rich-code-snippet` container (relative, border-radius, overflow hidden)
- Header area (flex, items-center, justify-between)
- Tab button (inactive / active state, font-mono, text-xs)
- Single-file title bar
- Separator line
- Code body (overflow-x-auto, shiki output overrides)
- CopyButton (absolute, hover reveal)
- Edit button overlay
- Modal internals: title bar, traffic lights, sidebar, breadcrumb, editor area

Reuse `@haklex/rich-style-token` vars for colors/spacing.

## Step 14: Create `src/index.ts`

```ts
import './styles.css'
export type { SerializedCodeSnippetNode } from './nodes/CodeSnippetNode'
export { $createCodeSnippetNode, $isCodeSnippetNode, CodeSnippetNode } from './nodes/CodeSnippetNode'
export { $createCodeSnippetEditNode, $isCodeSnippetEditNode, CodeSnippetEditNode } from './nodes/CodeSnippetEditNode'
export { codeSnippetNodes, codeSnippetEditNodes } from './nodes'
export { CodeSnippetRenderer } from './CodeSnippetRenderer'
export type { CodeSnippetEditRendererProps } from './CodeSnippetEditRenderer'
export { CodeSnippetEditRenderer } from './CodeSnippetEditRenderer'
```

## Step 15: Register in aggregator packages

### `@haklex/rich-renderers`
- `package.json` — add `"@haklex/rich-ext-code-snippet": "workspace:*"` dep, add `"./code-snippet"` export
- `src/config.ts` — import `CodeSnippetRenderer`, add `CodeSnippet: CodeSnippetRenderer`
- `src/index.ts` — re-export types/nodes from `@haklex/rich-ext-code-snippet`
- New `src/code-snippet.ts` — sub-path re-exports

### `@haklex/rich-renderers-edit`
- `package.json` — add dep + export
- `src/config.ts` — import `CodeSnippetEditRenderer`, add `CodeSnippet: CodeSnippetEditRenderer`
- `src/index.ts` — re-export edit types/nodes
- New `src/code-snippet.ts` — sub-path re-exports

## Step 16: Register in `@haklex/rich-editor-shiro`

- `src/ShiroRenderer.tsx` — import `codeSnippetNodes` from `@haklex/rich-renderers`, spread into `defaultExtraNodes`
- `src/ShiroEditor.tsx` — import `codeSnippetEditNodes` from `@haklex/rich-renderers-edit`, spread into `defaultExtraNodes`

## Step 17: Add article.css.ts margin

**File:** `packages/rich-editor/src/styles/article.css.ts`

```ts
globalStyle(`${articleBase} .rich-code-snippet`, {
  margin: `${em(32, 18)} 0`,
})
```

## Step 18: Add demo fixtures

**Files:**
- `packages/rich-editor-demo/src/fixtures/node-samples.ts` — add CodeSnippet sample
- `packages/rich-editor-demo/src/fixtures/initial-content.ts` — add CodeSnippet section

## Step 19: pnpm install + lint

- `pnpm install` to update lockfile
- Lint modified files only

## Verification

1. `pnpm install` succeeds
2. `pnpm --filter @haklex/rich-ext-code-snippet build` succeeds
3. `pnpm --filter @haklex/rich-renderers build` succeeds
4. `pnpm --filter @haklex/rich-renderers-edit build` succeeds
5. `pnpm --filter @haklex/rich-editor-shiro build` succeeds
6. `pnpm --filter @haklex/rich-editor-demo dev` — verify code-snippet renders in demo with file tabs and syntax highlighting
7. In editor mode, verify edit button opens modal with file tree and shikicode editor
8. Verify file add/delete/rename works in modal
9. Lint passes on all modified files
