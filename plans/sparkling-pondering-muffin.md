# Plan: Split `@haklex/rich-renderers` into Static + Edit Packages

## Context

`@haklex/rich-renderers` is a pure re-export aggregator that bundles both static (read-only) and edit renderers into one package. The barrel `index.ts` re-exports everything, forcing consumers to pull in edit-only dependencies (DropdownMenu, Popover, presentDialog, lucide-react) even when they only need static rendering. Splitting into two packages enables true on-demand import.

## Naming

- **`@haklex/rich-renderers`** — keeps current name, becomes static-only. Read-only consumers (the majority case) need zero import changes.
- **`@haklex/rich-renderers-edit`** — new package for edit-only exports. Depends on `@haklex/rich-renderers` for `enhancedRendererConfig` (to spread).

## Step 1: Create `@haklex/rich-renderers-edit` package

New directory: `packages/rich-renderers-edit/`

### `package.json`

- Name: `@haklex/rich-renderers-edit`
- Dependencies: `@haklex/rich-renderers`, plus only packages with edit variants: `@haklex/rich-renderer-{alert,banner,codeblock,mention,mermaid}`, `@haklex/rich-ext-{embed,tabs,tldraw}`, `@haklex/rich-plugin-slash-menu`
- Exports: `.`, `./config-edit`, `./alert`, `./banner`, `./codeblock`, `./mention`, `./mermaid`, `./tldraw`, `./embed`, `./tabs`, `./slash-menu`
- Same peerDependencies pattern as rich-renderers

### `tsconfig.json`

Copy from `packages/rich-renderers/tsconfig.json`.

### `vite.config.ts`

```ts
import { createViteConfig } from '../vite.shared'
export default createViteConfig({
  vanillaExtract: false,
  entry: {
    index: 'src/index.ts',
    'config-edit': 'src/config-edit.ts',
    alert: 'src/alert.ts',
    banner: 'src/banner.ts',
    codeblock: 'src/codeblock.ts',
    mention: 'src/mention.ts',
    mermaid: 'src/mermaid.ts',
    tldraw: 'src/tldraw.ts',
    embed: 'src/embed.ts',
    tabs: 'src/tabs.ts',
    'slash-menu': 'src/slash-menu.ts',
  },
  external: {
    include: ['@haklex/rich-editor', '@haklex/rich-renderers'],
    startsWith: ['@haklex/rich-renderer-', '@haklex/rich-ext-', '@haklex/rich-editor-', '@haklex/rich-plugin-', '@base-ui/', 'lexical', '@lexical/'],
  },
})
```

### Source files

| File | Content |
|------|---------|
| `src/config-edit.ts` | Move from `rich-renderers/src/config-edit.ts`. Change `import { enhancedRendererConfig } from './config'` → `from '@haklex/rich-renderers'` |
| `src/index.ts` | Barrel: all edit renderers + edit nodes/plugins + `enhancedEditRendererConfig` |
| `src/alert.ts` | `export { AlertEditRenderer } from '@haklex/rich-renderer-alert'` |
| `src/banner.ts` | `export { BannerEditRenderer } from '@haklex/rich-renderer-banner'` |
| `src/codeblock.ts` | `export { CodeBlockEditRenderer } from '@haklex/rich-renderer-codeblock'` |
| `src/mention.ts` | `export { MentionEditRenderer } from '@haklex/rich-renderer-mention'` |
| `src/mermaid.ts` | `export { MermaidEditRenderer } from '@haklex/rich-renderer-mermaid'` |
| `src/tldraw.ts` | `export { INSERT_TLDRAW_COMMAND, TldrawPlugin } from '@haklex/rich-ext-tldraw'` |
| `src/embed.ts` | Edit-only: `EmbedEditNode`, `embedEditNodes`, `EmbedPlugin`, `INSERT_EMBED_COMMAND`, `$create/$is` helpers, `EmbedPluginProps` type |
| `src/tabs.ts` | Edit-only: `TabsEditNode`, `tabsEditNodes`, `TabsEditRenderer`, `$create/$is` helpers, `TabsEditRendererProps` type |
| `src/slash-menu.ts` | Full re-export from `@haklex/rich-plugin-slash-menu` |

## Step 2: Prune `@haklex/rich-renderers` to static-only

### Files to modify

| File | Change |
|------|--------|
| `src/index.ts` | Remove all `*EditRenderer`, `*EditNode`, `*editNodes`, `EmbedPlugin`, `INSERT_*_COMMAND`, `TldrawPlugin`, slash-menu exports, `enhancedEditRendererConfig` |
| `src/alert.ts` | Remove `AlertEditRenderer` export |
| `src/banner.ts` | Remove `BannerEditRenderer` export |
| `src/mention.ts` | Remove `MentionEditRenderer` export |
| `src/mermaid.ts` | Remove `MermaidEditRenderer` export |
| `src/tldraw.ts` | Remove `INSERT_TLDRAW_COMMAND`, `TldrawPlugin` |
| `src/embed.ts` | Remove `EmbedEditNode`, `embedEditNodes`, `EmbedPlugin`, `INSERT_EMBED_COMMAND`, `$createEmbedEditNode`, `$isEmbedEditNode`, `EmbedPluginProps` |
| `src/tabs.ts` | Remove `TabsEditNode`, `tabsEditNodes`, `TabsEditRenderer`, `$createTabsEditNode`, `$isTabsEditNode`, `TabsEditRendererProps` |
| `vite.config.ts` | Remove `config-edit` and `slash-menu` entries |
| `package.json` | Remove `@haklex/rich-plugin-slash-menu` from dependencies. Remove `./slash-menu` from exports + publishConfig |

### Files to delete

- `src/config-edit.ts` (moved to edit package)
- `src/slash-menu.ts` (moved to edit package)

## Step 3: Update consumer `@haklex/rich-editor-shiro`

### `package.json`
Add `"@haklex/rich-renderers-edit": "workspace:*"` to dependencies.

### `src/ShiroEditor.tsx`
```diff
-import {
-  embedEditNodes, EmbedPlugin, enhancedEditRendererConfig,
-  tabsEditNodes, TldrawNode, TldrawPlugin,
-} from '@haklex/rich-renderers'
+import { TldrawNode } from '@haklex/rich-renderers'
+import {
+  embedEditNodes, EmbedPlugin, enhancedEditRendererConfig,
+  tabsEditNodes, TldrawPlugin,
+} from '@haklex/rich-renderers-edit'
```

### `src/index.ts`
```diff
-export { enhancedEditRendererConfig, enhancedRendererConfig } from '@haklex/rich-renderers'
+export { enhancedRendererConfig } from '@haklex/rich-renderers'
+export { enhancedEditRendererConfig } from '@haklex/rich-renderers-edit'
```

### `src/ShiroRenderer.tsx` — no changes
### `src/style.css` — no changes (CSS stays in `@haklex/rich-renderers/style.css`)

## Step 4: `pnpm install` + Build + Lint

1. `pnpm install` — links new workspace package
2. Build `@haklex/rich-renderers` first (edit depends on it)
3. Build `@haklex/rich-renderers-edit`
4. Build `@haklex/rich-editor-shiro`
5. Lint modified files

## Step 5: Update `packages/CLAUDE.md`

Update the "Renderer: Edit / Static Split" section and the "Registration" table to reflect two separate aggregator packages.

## Shared Items

| Item | Location | Why |
|------|----------|-----|
| Types (`EmbedType`, `SerializedEmbedNode`, etc.) | `@haklex/rich-renderers` | Used by both paths; edit package depends on static |
| `TldrawNode` | `@haklex/rich-renderers` | Lexical node for deserialization in both contexts |
| `EmbedNode` / `embedNodes` | `@haklex/rich-renderers` | Base nodes for deserialization |
| `TabsNode` / `tabsNodes` | `@haklex/rich-renderers` | Base nodes for deserialization |
| `enhancedRendererConfig` | `@haklex/rich-renderers` | Edit config spreads from it |
| `style.css` | `@haklex/rich-renderers` | CSS is shared; no edit-specific styles in aggregator |
| URL matchers, LinkCard utils | `@haklex/rich-renderers` | Pure utilities, no edit deps |

## Demo consumer (`@haklex/rich-editor-demo`) — no changes

Only imports `enhancedRendererConfig` (static) and types, both stay in `@haklex/rich-renderers`.
