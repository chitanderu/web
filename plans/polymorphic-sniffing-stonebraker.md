# ImageEditRenderer Implementation Plan

## Context

`@haklex/rich-renderer-image` 当前仅有静态 `ImageRenderer`，点击图片触发 `react-photo-view` lightbox 预览。编辑模式下需替换此行为为 Popover 编辑面板，允许修改 `src`、`altText`、`caption` 三个字段。

采用 Renderer 层拆分（方案 A），与 MentionEditRenderer 模式一致。

## Steps

### 1. 创建 `ImageEditRenderer`

**文件**: `packages/rich-renderer-image/src/ImageEditRenderer.tsx`

组件逻辑：
- `useRendererMode()` 检测模式，非 editor → fallback `<ImageRenderer />`
- `editor.isEditable()` 检测可编辑性，不可编辑 → fallback `<ImageRenderer />`
- 编辑模式下：
  - 渲染图片（复用 `rr-image-*` 样式，**不包裹 PhotoView**）
  - 用 `<Popover>` + `<PopoverTrigger>` (click 触发) + `<PopoverPanel>` 包裹
  - Panel 内含三个 input: src (url), altText, caption
  - Actions: Open (新窗口打开 src)、Remove (删除节点)
- 状态管理：`useState` 管理三个编辑字段，`useEffect` 同步 props
- `commitChanges`: `$getNearestNodeFromDOMNode(wrapperRef.current!)` → `node.getWritable()` 写入 `__src`/`__altText`/`__caption`
- 键盘：Enter 提交，Escape 重置并关闭
- `src` 为空时（slash menu 新建），自动弹出 Popover

**依赖导入**:
- `Popover, PopoverPanel, PopoverTrigger` from `@haklex/rich-editor-ui`
- `useRendererMode, decodeThumbHash` from `@haklex/rich-editor`
- `useLexicalComposerContext` from `@lexical/react/LexicalComposerContext`
- `$getNearestNodeFromDOMNode` from `lexical`
- `ImageIcon, ExternalLink, Trash2, Type, Image as ImageLucide` from `lucide-react`

**参考**: `MentionEditRenderer.tsx` (Popover + commitChanges 模式), `LinkCardEditDecorator.tsx` (url input + open/remove actions)

### 2. 添加 edit panel 样式

**文件**: `packages/rich-renderer-image/src/styles.css`

新增 CSS classes：
- `.rr-image-edit-trigger` — 包裹图片的 trigger 容器
- `.rr-image-edit-panel` — Popover panel 样式（min-width, padding, border-radius, background, shadow）
- `.rr-image-edit-field` — 每行 input 的 flex 容器
- `.rr-image-edit-field-icon` — input 前的图标
- `.rr-image-edit-input` — text input 样式
- `.rr-image-edit-actions` — 底部 action 按钮行
- `.rr-image-edit-action-btn` — action 按钮

参考 `MentionEditRenderer` 和 `LinkCardEditDecorator` 中的 `.rich-mention-edit-*` / `.rich-link-card-edit-*` 样式规范。

### 3. 更新 `@haklex/rich-renderer-image` 导出

**文件**: `packages/rich-renderer-image/src/index.ts`

```ts
export { ImageRenderer } from './ImageRenderer'
export { ImageRenderer as default } from './ImageRenderer'
export { ImageEditRenderer } from './ImageEditRenderer'
```

### 4. 更新 `package.json` peerDeps

**文件**: `packages/rich-renderer-image/package.json`

添加 peerDependencies:
- `@haklex/rich-editor-ui`
- `lucide-react`
- `@lexical/react` (如尚未存在)

### 5. 注册到 `enhancedEditRendererConfig`

**文件**: `packages/rich-renderers-edit/src/config.ts`

```ts
import { ImageEditRenderer } from '@haklex/rich-renderer-image'
// ...
export const enhancedEditRendererConfig: RendererConfig = {
  ...enhancedRendererConfig,
  // existing...
  Image: ImageEditRenderer,
}
```

### 6. Re-export from `@haklex/rich-renderers-edit`

**文件**: `packages/rich-renderers-edit/src/index.ts`

```ts
export { ImageEditRenderer } from '@haklex/rich-renderer-image'
```

### 7. 更新 `rich-renderers-edit/package.json`

添加 `@haklex/rich-renderer-image` 为 dependency（如尚未存在）。

## Critical Files

| File | Action |
|------|--------|
| `packages/rich-renderer-image/src/ImageEditRenderer.tsx` | Create |
| `packages/rich-renderer-image/src/styles.css` | Edit (add edit panel styles) |
| `packages/rich-renderer-image/src/index.ts` | Edit (add export) |
| `packages/rich-renderer-image/package.json` | Edit (add peerDeps) |
| `packages/rich-renderers-edit/src/config.ts` | Edit (add Image override) |
| `packages/rich-renderers-edit/src/index.ts` | Edit (add re-export) |
| `packages/rich-renderers-edit/package.json` | Edit (add dep if needed) |

## Reference Files (read-only)

| File | Purpose |
|------|---------|
| `packages/rich-renderer-mention/src/MentionEditRenderer.tsx` | Primary pattern: Popover + commitChanges via $getNearestNodeFromDOMNode |
| `packages/rich-renderer-linkcard/src/LinkCardEditDecorator.tsx` | URL input + Open/Remove actions pattern |
| `packages/rich-renderer-image/src/ImageRenderer.tsx` | Static renderer to fallback to / style reuse |
| `packages/rich-editor/src/components/renderers/ImageRenderer.tsx` | ImageRendererProps type definition |

## Verification

1. `pnpm --filter @haklex/rich-renderer-image build` — 编译通过
2. `pnpm --filter @haklex/rich-renderers-edit build` — 编译通过
3. `pnpm --filter @haklex/rich-editor-demo dev` — 打开 playground
   - 插入 Image 节点 → 自动弹出 Popover（src 为空时）
   - 填入 src → 图片加载 → 关闭 Popover
   - 再次点击图片 → Popover 弹出，显示当前 src/alt/caption
   - 修改字段 → Enter 提交 → 节点更新
   - Escape → 重置
   - Remove → 节点删除
4. Lint: `pnpm eslint packages/rich-renderer-image/src/ImageEditRenderer.tsx`
