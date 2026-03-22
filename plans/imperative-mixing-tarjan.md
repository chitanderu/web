# Plan: Move heading ID normalization to rich-static-renderer

## Context

`TocHeadingStrategy.tsx` (业务层) 中的 `normalizeHeadingIds` 在客户端重复为 lexical heading 生成 ID，但 `rich-static-renderer` 的 `renderBuiltinNode.tsx` 在 SSR 时已完成此工作（`textToSlug` + `headingSlugs` Map 去重）。此冗余逻辑应移除，由 renderer 包统一负责。

另外，renderer 已具备 heading anchor UI：`<a class="rich-heading-anchor" href="#slug">`，配合 `shared.css.ts` 的 `::before { content: "#" }` + hover 显示。但当前 anchor 标记为 `aria-hidden="true"` + `tabIndex={-1}`（不可交互），需增强为可交互状态。

## Changes

### 1. `apps/web/src/components/modules/toc/TocHeadingStrategy.tsx`

- 删除 `textToSlug` 函数（renderer 已有）
- 删除 `normalizeHeadingIds` 函数（renderer SSR 时已设 ID）
- 简化 `lexicalHeadingStrategy`：仅 `querySelectorAll` 返回 headings，不再 normalize

```typescript
export const lexicalHeadingStrategy: HeadingQueryStrategy = (container) => {
  return [
    ...container.querySelectorAll(lexicalHeadingSelector),
  ] as HTMLHeadingElement[]
}
```

### 2. `packages/rich-static-renderer/src/engine/renderBuiltinNode.tsx`

增强 heading anchor 的交互性：

- 移除 `aria-hidden="true"`（使锚点可被辅助技术发现）
- 将 `tabIndex={-1}` 改为 `tabIndex={0}`（可键盘聚焦）
- 添加 `role="button"` 以匹配 markdown heading 的语义

```tsx
<a
  className="rich-heading-anchor"
  tabIndex={0}
  href={`#${slug}`}
/>
```

### 3. 无需修改的文件

- `packages/rich-editor/src/styles/shared.css.ts` — 已有完整的 heading anchor 样式（`::before { content: "#" }`、hover opacity、absolute left 定位）
- `apps/web/src/components/ui/markdown/renderers/heading.tsx` — markdown heading 有自己独立的 anchor 实现（inline icon + springScrollToElement），不受影响

## Note: Smooth scroll

Renderer 的 anchor 使用原生 `href="#slug"` 跳转，不含 `springScrollToElement` 平滑滚动。如需平滑滚动，业务方可通过事件委托对 `.rich-heading-anchor` 点击添加增强行为，此为可选后续工作。

## Verification

1. `pnpm --filter @shiro/web lint` — 确认无类型错误
2. 在 lexical 格式的文章页面检查：heading 有正确 ID，hover 显示 `#` anchor，点击跳转正常
3. TOC 侧栏正常显示 lexical 文章的标题列表
