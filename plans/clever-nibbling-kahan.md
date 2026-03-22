# Toolbar 悬浮态改造

## Context

当前 ToolbarPlugin 作为编辑器 `header` 插槽渲染，全宽 + `borderBottom` 分隔线，视觉上偏"传统编辑器"。用户希望改为悬浮面板风格（类 Notion/macOS），同时支持 sticky 吸顶。

## 方案

仅修改样式层（`styles.css.ts`），不改组件结构。toolbar 仍通过 `header` 插槽传入，DOM 位置不变。

### 修改文件

**`haklex/rich-plugin-toolbar/src/styles.css.ts`**

`toolbarContainer`:
- 移除 `borderBottom`
- 新增：`borderRadius: 12`，`border: 1px solid ${vars.color.border}`
- 新增：`backdropFilter: 'blur(8px)'`，`backgroundColor: color-mix(in srgb, ${vars.color.bg} 90%, transparent)`
- 新增：`boxShadow: vars.boxShadow.topBar`
- 新增：`position: 'sticky'`，`top: 0`，`zIndex: 10`
- 新增：`margin: '12px 16px 0'`（与编辑器边缘留白，使其"浮"起来）
- 新增：`maxWidth: vars.layout.maxWidth`，居中（`margin: '12px auto 0'`，配合 `padding: 0 16px` 的父级）

`toolbarRow`:
- 移除 `maxWidth` 和 `margin: '0 auto'`（容器自身已约束宽度，行无需再限制）

**`haklex/rich-editor/src/components/ContentEditable.tsx`**

- `hasHeader` 时 padding-top 从 48px 调为 16px（浮动 toolbar 自带 margin-top 12px，无需大间距）

### 不变

- `ToolbarPlugin.tsx` 组件逻辑不变
- `ToolbarButton.tsx`、`ToolbarDropdown.tsx` 不变
- `RichEditor.tsx` header 插槽机制不变

## 验证

`pnpm --filter @haklex/rich-editor-demo dev` 查看效果：toolbar 应呈圆角卡片状浮于编辑器顶部，滚动时吸顶。
