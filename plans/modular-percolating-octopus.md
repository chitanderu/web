# Gallery Editor Enhancement: dnd-kit + SegmentedControl

## Context

GalleryEditRenderer 已实现基础功能（dialog 编辑器 + up/down 箭头排序）。需两项增强：
1. 用 `@dnd-kit` 替换 up/down 按钮，实现拖拽排序（所见即所得体验）
2. 将 layout toggle（segmented control）抽为 `@haklex/rich-editor-ui` 通用组件，优化 UI（高度、variant 变体）

## Part A: SegmentedControl 组件 — `@haklex/rich-editor-ui`

### A1. 新建组件文件

**File**: `packages/rich-editor-ui/src/components/segmented-control/index.tsx`

```tsx
export interface SegmentedControlItem<T extends string = string> {
  value: T
  label: ReactNode
}

export interface SegmentedControlProps<T extends string = string> {
  items: SegmentedControlItem<T>[]
  value: T
  onChange: (value: T) => void
  size?: 'sm' | 'md'       // sm=24h, md=28h
  className?: string
}

export function SegmentedControl<T extends string>({ items, value, onChange, size = 'sm', className }: SegmentedControlProps<T>) {
  // 渲染: 外层容器 + 每项 button，active 项有背景高亮
}
```

**设计要点：**
- 外层: `inline-flex`, `borderRadius: 6`, `padding: 2`, 浅灰底 `color-mix(in srgb, ${vars.color.text} 6%, transparent)`
- 每项 button: `borderRadius: 4`, `border: none`, `background: transparent`
- Active 项: `background: vars.color.bg`, `color: vars.color.text`, `fontWeight: 500`, `boxShadow: 0 1px 2px rgba(0,0,0,0.06)` (pill 浮起效果)
- Hover 非 active 项: `color: vars.color.text`
- `size='sm'`: 高度 24px, fontSize 0.6875rem, padding `0 8px`
- `size='md'`: 高度 28px, fontSize 0.75rem, padding `0 10px`
- 无 border 外框（区别于旧 tldraw mode switch），改用 pill-in-tray 风格

### A2. 样式文件

**File**: `packages/rich-editor-ui/src/components/segmented-control/styles.css.ts`

用 vanilla-extract `style` + `styleVariants`，引用 `vars` from `@haklex/rich-style-token`。

### A3. 导出

**File**: `packages/rich-editor-ui/src/index.ts`

添加:
```ts
export type { SegmentedControlItem, SegmentedControlProps } from './components/segmented-control'
export { SegmentedControl } from './components/segmented-control'
```

### A4. 替换已有使用处

| 位置 | 变更 |
|------|------|
| `packages/rich-ext-gallery/src/GalleryEditRenderer.tsx` | 用 `<SegmentedControl>` 替换手动 layout toggle |
| `packages/rich-ext-tldraw/src/TldrawEditRenderer.tsx` | 用 `<SegmentedControl>` 替换 Inline/Remote mode switch |

替换后移除 gallery `styles.css.ts` 中 `galleryLayoutToggle`/`galleryLayoutBtn`/`galleryLayoutBtnActive` 样式，及 tldraw `styles.css.ts` 中 `tldrawModeSwitch`/`tldrawModeSwitchBtn`/`tldrawModeSwitchActive` 样式。

## Part B: dnd-kit 拖拽排序 — GalleryEditRenderer

### B1. 添加依赖

**File**: `packages/rich-ext-gallery/package.json`

添加（同 `rich-ext-tabs` 使用的版本）:
```json
"dependencies": {
  "@dnd-kit/core": "^6.3.1",
  "@dnd-kit/sortable": "^10.0.0",
  "@dnd-kit/utilities": "^3.2.2",
  ...
}
```

### B2. 重构 GalleryEditorDialogContent 图片列表

**File**: `packages/rich-ext-gallery/src/GalleryEditRenderer.tsx`

参照 `rich-ext-tabs/src/TabsEditDecorator.tsx` 的 dnd-kit 模式:

- 为每张图片生成稳定 id（用 `useRef` + `crypto.randomUUID()` 或递增计数器）
- `DndContext` + `SortableContext` + `verticalListSortingStrategy` 包裹图片列表
- `PointerSensor`（`activationConstraint: { distance: 5 }`）
- 提取 `SortableImageCard` 组件，使用 `useSortable({ id })`
  - `setNodeRef` 绑定到 card 根元素
  - `CSS.Transform.toString(transform)` 应用位移
  - `isDragging` 时 `opacity: 0.4`
  - drag handle 上绑 `{...attributes} {...listeners}`
- `DragOverlay` 显示拖拽中的图片卡片副本（简化版，仅 thumbnail + URL 文字）
- `handleDragEnd`: 用 `arrayMove`（从 `@dnd-kit/sortable`）重排 images 数组
- 移除旧的 `ArrowUp`/`ArrowDown` 按钮及 `handleMoveImage`

### B3. 更新样式

**File**: `packages/rich-ext-gallery/src/styles.css.ts`

- 移除 `galleryImageActionBtn`（up/down 按钮样式）
- 调整 `galleryImageDragHandle` 使其更明显（cursor: grab, 适当 padding）
- 添加 `galleryImageCardDragging` style（可选，用于 overlay 卡片）

## File Summary

| File | Action |
|------|--------|
| `packages/rich-editor-ui/src/components/segmented-control/index.tsx` | **新建** — SegmentedControl 组件 |
| `packages/rich-editor-ui/src/components/segmented-control/styles.css.ts` | **新建** — 样式 |
| `packages/rich-editor-ui/src/index.ts` | 导出 SegmentedControl |
| `packages/rich-ext-gallery/src/GalleryEditRenderer.tsx` | dnd-kit 拖拽排序 + SegmentedControl |
| `packages/rich-ext-gallery/src/styles.css.ts` | 移除旧 layout toggle + action btn 样式，调整 drag handle |
| `packages/rich-ext-gallery/package.json` | 添加 `@dnd-kit/*` 依赖 |
| `packages/rich-ext-tldraw/src/TldrawEditRenderer.tsx` | 用 SegmentedControl 替换 mode switch |
| `packages/rich-ext-tldraw/src/styles.css.ts` | 移除旧 mode switch 样式 |

## Verification

1. `pnpm --filter @haklex/rich-editor-ui build` — 构建成功
2. `pnpm --filter @haklex/rich-ext-gallery build` — 构建成功
3. `pnpm --filter @haklex/rich-ext-tldraw build` — 构建成功
4. Gallery dialog 中拖拽图片卡片可重排序
5. SegmentedControl 在 Gallery（Grid/Masonry/Carousel）和 Tldraw（Inline/Remote）中正确切换
