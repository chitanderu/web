# Plan: Extract `@haklex/cm-editor` & Replace shikicode

## Context

`CodeBlockEditRenderer.tsx` 中约 200 行 CM6 通用逻辑（主题、语言加载、Compartment 管理）与 Lexical 专用逻辑混杂。`rich-ext-code-snippet` 的 `CodeEditorModal` 使用 shikicode（Shiki-based textarea editor），与 codeblock 的 CM6 编辑器技术栈不统一。

目标：
1. 抽取通用 CM6 逻辑为 `@haklex/cm-editor` 子包
2. `CodeBlockEditRenderer` 改用共享包
3. `CodeEditorModal` 从 shikicode 迁移至 CM6（通过共享包）

## Step 1: Create `@haklex/cm-editor` package

新建 `packages/cm-editor/`，遵循 monorepo 既有模式（Vite + vanilla-extract + vite-plugin-dts）。

### 文件结构

```
packages/cm-editor/
├── src/
│   ├── index.ts           # Re-exports
│   ├── theme.ts           # baseTheme, getThemeExtensions()
│   ├── language.ts        # languageAliases, loadLanguageExtension()
│   └── selection.ts       # isOnFirstLine(), isOnLastLine()
├── vite.config.ts         # 使用 ../vite.shared.ts
├── package.json
└── tsconfig.json
```

### `theme.ts` — 从 CodeBlockEditRenderer L46-72 提取

```ts
export const baseTheme: Extension           // EditorView.theme({...})
export function getThemeExtensions(colorScheme: 'light' | 'dark'): Extension
```

### `language.ts` — 从 CodeBlockEditRenderer L31-99 提取

```ts
export const languageAliases: Record<string, string[]>
export function getLanguageCandidates(language: string): string[]
export async function loadLanguageExtension(language: string): Promise<Extension>
```

### `selection.ts` — 从 CodeBlockEditRenderer L101-111 提取

```ts
export function isOnFirstLine(view: EditorView): boolean
export function isOnLastLine(view: EditorView): boolean
```

### `package.json`

```json
{
  "name": "@haklex/cm-editor",
  "dependencies": {
    "@codemirror/commands": "^6.10.2",
    "@codemirror/language": "^6.12.2",
    "@codemirror/language-data": "^6.5.2",
    "@codemirror/state": "^6.5.4",
    "@codemirror/theme-one-dark": "^6.1.3",
    "@codemirror/view": "^6.39.15"
  }
}
```

### 涉及文件

- `packages/cm-editor/src/theme.ts` — **新建**
- `packages/cm-editor/src/language.ts` — **新建**
- `packages/cm-editor/src/selection.ts` — **新建**
- `packages/cm-editor/src/index.ts` — **新建**
- `packages/cm-editor/package.json` — **新建**
- `packages/cm-editor/tsconfig.json` — **新建**
- `packages/cm-editor/vite.config.ts` — **新建**
- `pnpm-workspace.yaml` — 确认 `packages/*` glob 已覆盖

## Step 2: Refactor `CodeBlockEditRenderer`

用 `@haklex/cm-editor` 替换内联逻辑。

### 变更

- 删除 `languageAliases`（L31-44）、`baseTheme`（L46-66）、`getThemeExtensions`（L68-72）、`getLanguageCandidates`（L74-77）、`loadLanguageExtension`（L79-99）、`isOnFirstLine`（L101-105）、`isOnLastLine`（L107-111）
- 改为 `import { baseTheme, getThemeExtensions, loadLanguageExtension, isOnFirstLine, isOnLastLine } from '@haklex/cm-editor'`
- package.json 添加 `"@haklex/cm-editor": "workspace:*"` 依赖，移除已被共享包覆盖的 `@codemirror/language`、`@codemirror/language-data`、`@codemirror/theme-one-dark` 直接依赖（`@codemirror/state`、`@codemirror/view`、`@codemirror/commands` 仍需保留，因组件直接使用其 API）

### 涉及文件

- `packages/rich-renderer-codeblock/src/CodeBlockEditRenderer.tsx` — **修改**
- `packages/rich-renderer-codeblock/package.json` — **修改**

## Step 3: Migrate `CodeEditorModal` from shikicode to CM6

### 变更

- `CodeEditorModal.tsx`（L173-223）：替换 shikicode 创建逻辑为 CM6 EditorView
  - 使用 `@haklex/cm-editor` 的 `loadLanguageExtension`、`getThemeExtensions`
  - Compartment 管理语言切换（文件切换时 reconfigure 而非 destroy/recreate）
  - `EditorView.updateListener` 替代 `editor.input.addEventListener('input', ...)`
- `styles.css.ts`：移除 shikicode 专用 DOM class 规则（`.shikicode.output`、`.shikicode.input` 等），添加 `.cm-editor`、`.cm-gutters`、`.cm-lineNumbers` 规则
- `package.json`：移除 `shikicode` 依赖，添加 `@haklex/cm-editor: workspace:*`，保留 `shiki`（CodeSnippetRenderer 静态渲染仍需）

### 涉及文件

- `packages/rich-ext-code-snippet/src/CodeEditorModal.tsx` — **修改**
- `packages/rich-ext-code-snippet/src/styles.css.ts` — **修改**
- `packages/rich-ext-code-snippet/package.json` — **修改**

## Step 4: pnpm install & 验证

- `pnpm install` 更新 lockfile
- `pnpm --filter @haklex/cm-editor build` 验证新包构建
- `pnpm --filter @haklex/rich-renderer-codeblock build` 验证 codeblock 包
- `pnpm --filter @haklex/rich-ext-code-snippet build` 验证 code-snippet 包
- lint 受影响文件

## Verification

1. `pnpm --filter @haklex/cm-editor build` — 构建通过
2. `pnpm --filter @haklex/rich-renderer-codeblock build` — 构建通过
3. `pnpm --filter @haklex/rich-ext-code-snippet build` — 构建通过
4. 在 demo 中验证 code block 编辑功能（键盘导航、语言切换、主题切换）
5. 在 demo 中验证 code snippet 编辑 modal（文件切换、代码编辑、语言高亮）
