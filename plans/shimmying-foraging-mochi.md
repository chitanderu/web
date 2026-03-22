# Plan: CSS-based Dark Mode for Rich Editor (消除 SSR 主题闪烁)

## Context

`RichRenderer` SSR 输出始终为 light theme。原因：`useIsDark()` 基于 `next-themes` 的 `useTheme()`，SSR 时返回 `undefined` → `isDark=false` → 传入 `theme='light'`。当前架构用 JS 在 `articleTheme`/`darkArticleTheme` 两个 CSS class 间切换，SSR 必然选错。

修法：色值切换改由 CSS `[data-theme='dark']` / `.dark` 祖先选择器驱动。`next-themes` 的 blocking script 在 hydration 前已于 `<html>` 上设好 `class="dark"`，CSS 立即生效，无闪烁。

## 变更概览

1. **`rich-style-token`**: 接收 `createTheme`/`createGlobalTheme` 逻辑，新增 `[data-theme='dark']`/`.dark` CSS override
2. **`rich-editor`**: 删除所有 dark variant class/theme，简化 `getVariantClass` 去掉 `colorScheme` 参数
3. **消费方** (`RichRenderer`, `RichEditor`, `RichDiff`): 更新 `getVariantClass(variant)` 调用

## 详细变更

### Step 1: `packages/rich-style-token/src/vars.css.ts`

将 `rich-editor/src/styles/vars.css.ts` 的 `createGlobalTheme` + `createTheme` 逻辑合并至此文件（目前仅有 `createGlobalThemeContract`）。

新增内容：
```ts
import { assignVars, createGlobalTheme, createTheme, globalStyle } from '@vanilla-extract/css'
import { articleLayout, commentLayout, darkColors, lightArticleColors, lightCommentColors, noteLayout } from './themes'

// :root 默认 (light article)
createGlobalTheme(':root', vars, { color: lightArticleColors, ...articleLayout })

// :root dark fallback (for elements without theme class)
createGlobalTheme(':root.dark', vars, { color: darkColors, ...articleLayout })

// 三个 variant theme class (仅 light 色值，dark 由 CSS override 处理)
export const articleTheme = createTheme(vars, { color: lightArticleColors, ...articleLayout })
export const noteTheme = createTheme(vars, { color: lightArticleColors, ...noteLayout })
export const commentTheme = createTheme(vars, { color: lightCommentColors, ...commentLayout })

// Dark override: ancestor .dark 或 [data-theme="dark"] 时覆盖 color vars
const darkColorOverrides = assignVars(vars.color, darkColors)
for (const themeClass of [articleTheme, noteTheme, commentTheme]) {
  globalStyle(`.dark ${themeClass}, [data-theme="dark"] ${themeClass}`, {
    vars: darkColorOverrides,
  })
}
```

**不再导出** `darkArticleTheme`, `darkCommentTheme`, `darkNoteTheme`。

### Step 2: `packages/rich-style-token/src/index.ts`

新增导出 `articleTheme`, `noteTheme`, `commentTheme`：
```ts
export { articleTheme, commentTheme, noteTheme } from './vars.css'
```

### Step 3: `packages/rich-editor/src/styles/vars.css.ts`

简化为纯 re-export（不再有 `createTheme`/`createGlobalTheme` 调用）：
```ts
export { articleTheme, commentTheme, noteTheme, vars } from '@haklex/rich-style-token'
```

删除 `darkArticleTheme`, `darkCommentTheme`, `darkNoteTheme` 导出。

### Step 4: Variant CSS files — 删除 dark variant

**`article.css.ts`**:
- 删除 `darkArticleVariant` 导出
- `articleVariant = style([richContent, articleTheme, articleBase])` 不变

**`note.css.ts`**:
- 删除 `darkNoteVariant` 导出

**`comment.css.ts`**:
- 删除 `darkCommentVariant` 导出

### Step 5: `packages/rich-editor/src/components/utils.ts` — 简化 `getVariantClass`

```ts
export function getVariantClass(variant: RichEditorVariant): string {
  if (variant === 'comment') return commentVariant
  if (variant === 'note') return noteVariant
  return articleVariant
}
```

删除 `ColorScheme` 参数和 import。

### Step 6: Entry points 清理

**`styles/index.ts`**: 删除 `darkArticleVariant`, `darkCommentVariant`, `darkNoteVariant`, `darkArticleTheme`, `darkCommentTheme`, `darkNoteTheme` 导出。

**`static-entry.ts`**: 同上。

**`styles-entry.ts`**: 同上。

### Step 7: 消费方更新

**`packages/rich-renderer/src/RichRenderer.tsx`**:
```ts
// Before
const variantClass = getVariantClass(variant, theme)
// After
const variantClass = getVariantClass(variant)
```
保留 `theme` prop 用于 `ColorSchemeProvider` 和 `data-theme={theme}` 属性。

**`packages/rich-editor/src/components/RichEditor.tsx`**: 同上。

**`packages/rich-diff/src/RichDiff.tsx`**: 同上。

## 关键文件清单

| 文件 | 操作 |
|------|------|
| `packages/rich-style-token/src/vars.css.ts` | 扩展：加入 createTheme + dark overrides |
| `packages/rich-style-token/src/index.ts` | 新增 theme 导出 |
| `packages/rich-editor/src/styles/vars.css.ts` | 简化为 re-export |
| `packages/rich-editor/src/styles/article.css.ts` | 删除 darkArticleVariant |
| `packages/rich-editor/src/styles/note.css.ts` | 删除 darkNoteVariant |
| `packages/rich-editor/src/styles/comment.css.ts` | 删除 darkCommentVariant |
| `packages/rich-editor/src/styles/index.ts` | 删除 dark 导出 |
| `packages/rich-editor/src/components/utils.ts` | 简化 getVariantClass |
| `packages/rich-editor/src/static-entry.ts` | 删除 dark 导出 |
| `packages/rich-editor/src/styles-entry.ts` | 删除 dark 导出 |
| `packages/rich-renderer/src/RichRenderer.tsx` | getVariantClass(variant) |
| `packages/rich-editor/src/components/RichEditor.tsx` | getVariantClass(variant) |
| `packages/rich-diff/src/RichDiff.tsx` | getVariantClass(variant) |

## Verification

1. `pnpm --filter @haklex/rich-style-token build`
2. `pnpm --filter @haklex/rich-editor build`
3. `pnpm --filter @haklex/rich-renderer build`
4. `pnpm --filter @haklex/rich-diff build`
5. `pnpm --filter @haklex/rich-kit-shiro build`
6. 浏览器验证：dark mode 下 SSR HTML 应直接呈现深色，无 light→dark 闪烁
