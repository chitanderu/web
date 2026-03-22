# Plan: Move Edit Decorators Out + Decouple PortalTheme

## Context

`KaTeXEditDecorator` 和 `LinkCardEditDecorator` 在 `@haklex/rich-editor` 中引入了 `@haklex/rich-editor-ui`（Popover）和 `lucide-react` 重依赖。移出后 `@haklex/rich-editor` 可彻底去除对 `@haklex/rich-editor-ui` 的依赖。

`PortalThemeProvider` / `usePortalTheme` 目前在 `@haklex/rich-editor-ui`，是 `@haklex/rich-editor` 引用 `@haklex/rich-editor-ui` 的另一处。移至 `@haklex/rich-style-token`（两包皆已依赖之），打破循环。

---

## Part 0: PortalTheme → `@haklex/rich-style-token`

### Step 0.1: 迁移 context

**移动** `rich-editor-ui/src/context/portal-theme.tsx` → `rich-style-token/src/portal-theme.tsx`

**修改** `rich-style-token/src/index.ts` — 添加导出：
```ts
export { PortalThemeProvider, usePortalTheme } from './portal-theme'
```

**修改** `rich-style-token/tsconfig.json` — include 添加 `src/**/*.tsx`

**修改** `rich-style-token/package.json` — 添加 peerDependencies: `react: ">=19"`，devDependencies: `react`, `@types/react`

### Step 0.2: 更新引用方

**`@haklex/rich-editor-ui`**:
- 删除 `src/context/portal-theme.tsx`
- `src/index.ts` — re-export 改为 `export { PortalThemeProvider, usePortalTheme } from '@haklex/rich-style-token'`
- `src/components/popover/index.tsx` — import 改为 `from '@haklex/rich-style-token'`
- `src/components/dialog/index.tsx`、`src/components/dropdown-menu/index.tsx` — 同上（若有引用）

**`@haklex/rich-editor`**:
- `src/components/RichEditor.tsx` line 9 — import 改为 `from '@haklex/rich-style-token'`
- `src/components/RichRenderer.tsx` — 同上（若有引用）

### Step 0.3: 去除 `@haklex/rich-editor` 对 `@haklex/rich-editor-ui` 的依赖

**修改** `rich-editor/package.json` — 移除 dependencies 中的 `@haklex/rich-editor-ui`

（此步须在 Part A/B 完成后执行，确认无其他引用）

---

## Part A: LinkCardEditDecorator → `@haklex/rich-renderer-linkcard`

### Step A1: `@haklex/rich-editor` 导出所需符号

**修改** `packages/rich-editor/src/index.ts` — 添加：
```ts
export { $isLinkCardNode, $createLinkCardNode, LinkCardNode } from './nodes/LinkCardNode'
export type { LinkCardNodePayload, SerializedLinkCardNode } from './nodes/LinkCardNode'
export { LinkCardRenderer } from './components/renderers/LinkCardRenderer'
```

### Step A2: 迁移文件

| Source | Target |
|--------|--------|
| `rich-editor/.../LinkCardEditDecorator.tsx` | `rich-renderer-linkcard/src/LinkCardEditDecorator.tsx` |
| `rich-editor/.../LinkCardEditNode.ts` | `rich-renderer-linkcard/src/LinkCardEditNode.ts` |

两文件 import 路径改为 `@haklex/rich-editor`。

### Step A3: 更新 `rich-renderer-linkcard`

- `package.json` 添加 dev/peer deps：`@lexical/react`, `lexical`, `@haklex/rich-editor-ui`, `lucide-react`
- `src/index.ts` 添加导出：`LinkCardEditDecorator`, `LinkCardEditNode`, `linkCardEditNodes`
- `vite.config.ts` external 添加 `@haklex/rich-editor-ui`

### Step A4: 更新 `@haklex/rich-renderers-edit`

- `src/index.ts` 添加 `export { LinkCardEditNode, linkCardEditNodes } from '@haklex/rich-renderer-linkcard'`

### Step A5: 清理 `@haklex/rich-editor`

- 删除 `src/components/decorators/LinkCardEditDecorator.tsx`
- 删除 `src/nodes/LinkCardEditNode.ts`
- `src/config-edit.ts` 移除 `LinkCardEditNode`

### Step A6: 更新 `@haklex/rich-editor-shiro`

- `ShiroEditor.tsx`：`defaultExtraNodes` 添加 `...linkCardEditNodes`（从 `@haklex/rich-renderers-edit` 导入）

---

## Part B: KaTeXEditDecorator → 新包 `@haklex/rich-renderer-katex`

### Step B1: `@haklex/rich-editor` 导出所需符号

**修改** `packages/rich-editor/src/index.ts` — 添加：
```ts
export { $isKaTeXBlockNode, KaTeXBlockNode } from './nodes/KaTeXBlockNode'
export type { SerializedKaTeXBlockNode } from './nodes/KaTeXBlockNode'
export { $isKaTeXInlineNode, KaTeXInlineNode } from './nodes/KaTeXInlineNode'
export type { SerializedKaTeXInlineNode } from './nodes/KaTeXInlineNode'
export { KaTeXRenderer } from './components/renderers/KaTeXRenderer'
```

### Step B2: 创建 `packages/rich-renderer-katex/`

```
packages/rich-renderer-katex/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── index.ts
    ├── KaTeXEditDecorator.tsx
    ├── KaTeXBlockEditNode.ts
    ├── KaTeXInlineEditNode.ts
    └── styles.css.ts            # edit 样式（从 katex.css.ts line 30+ 迁移）
```

deps：`@haklex/rich-editor`, `@haklex/rich-editor-ui`, `@haklex/rich-style-token`, `@lexical/react`, `lexical`, `lucide-react`, `react`

exports：`KaTeXEditDecorator`, `KaTeXBlockEditNode`, `KaTeXInlineEditNode`, `katexEditNodes`

### Step B3: 清理 `@haklex/rich-editor`

- 删除 `src/components/decorators/KaTeXEditDecorator.tsx`
- 删除 `src/nodes/KaTeXBlockEditNode.ts`, `src/nodes/KaTeXInlineEditNode.ts`
- `src/config-edit.ts` 移除两个 KaTeX edit node
- `src/styles/katex.css.ts` 仅保留 display 样式（lines 1–28），移除 edit 样式（line 30+）

### Step B4: 更新 `@haklex/rich-renderers-edit`

- `package.json` 添加 `@haklex/rich-renderer-katex: workspace:*`
- `src/index.ts` 添加 `export { KaTeXBlockEditNode, KaTeXInlineEditNode, katexEditNodes } from '@haklex/rich-renderer-katex'`

### Step B5: 更新 `@haklex/rich-editor-shiro`

- `ShiroEditor.tsx`：`defaultExtraNodes` 添加 `...katexEditNodes`

---

## Critical Files

| File | Action |
|------|--------|
| `packages/rich-style-token/src/portal-theme.tsx` | **Create** |
| `packages/rich-style-token/src/index.ts` | **Modify** |
| `packages/rich-style-token/package.json` | **Modify** |
| `packages/rich-style-token/tsconfig.json` | **Modify** |
| `packages/rich-editor-ui/src/context/portal-theme.tsx` | **Delete** |
| `packages/rich-editor-ui/src/index.ts` | **Modify** |
| `packages/rich-editor-ui/src/components/popover/index.tsx` | **Modify** |
| `packages/rich-editor/src/components/RichEditor.tsx` | **Modify** |
| `packages/rich-editor/src/components/RichRenderer.tsx` | **Modify** |
| `packages/rich-editor/package.json` | **Modify** — remove `@haklex/rich-editor-ui` dep |
| `packages/rich-editor/src/index.ts` | **Modify** — add node exports |
| `packages/rich-editor/src/config-edit.ts` | **Modify** — remove 3 edit nodes |
| `packages/rich-editor/src/styles/katex.css.ts` | **Modify** — remove edit styles |
| `packages/rich-editor/src/components/decorators/LinkCardEditDecorator.tsx` | **Delete** |
| `packages/rich-editor/src/components/decorators/KaTeXEditDecorator.tsx` | **Delete** |
| `packages/rich-editor/src/nodes/LinkCardEditNode.ts` | **Delete** |
| `packages/rich-editor/src/nodes/KaTeXBlockEditNode.ts` | **Delete** |
| `packages/rich-editor/src/nodes/KaTeXInlineEditNode.ts` | **Delete** |
| `packages/rich-renderer-linkcard/src/LinkCardEditDecorator.tsx` | **Create** |
| `packages/rich-renderer-linkcard/src/LinkCardEditNode.ts` | **Create** |
| `packages/rich-renderer-linkcard/src/index.ts` | **Modify** |
| `packages/rich-renderer-linkcard/package.json` | **Modify** |
| `packages/rich-renderer-linkcard/vite.config.ts` | **Modify** |
| `packages/rich-renderer-katex/` | **Create** — 新包 |
| `packages/rich-renderers-edit/src/index.ts` | **Modify** |
| `packages/rich-renderers-edit/package.json` | **Modify** |
| `packages/rich-editor-shiro/src/ShiroEditor.tsx` | **Modify** |

## Verification

```bash
pnpm install
pnpm --filter @haklex/rich-style-token build
pnpm --filter @haklex/rich-editor-ui build
pnpm --filter @haklex/rich-editor build
pnpm --filter @haklex/rich-renderer-linkcard build
pnpm --filter @haklex/rich-renderer-katex build
pnpm --filter @haklex/rich-renderers-edit build
pnpm --filter @haklex/rich-editor-shiro build
```
