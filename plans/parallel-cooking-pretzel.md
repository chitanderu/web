# Comment Block Gutter UI — 右侧评论指示器 + 面板

## Context

Anchor comment 系统（数据流、API、高亮）已实现。现需将 block comment 的 UI 从简单的 hover 按钮升级为参考图中的「右侧 gutter」模式：

- 文章右侧显示评论者 avatar 堆叠 + 计数（按 block 分组）
- hover 无评论的 block 时显示 ghost "+" 按钮
- 点击 avatar group 或 ghost button 打开评论面板（popover）
- 面板内显示该 block 的评论线程 + 发评论输入框
- 有评论的 block 有微妙的背景高亮

参考视觉代码：`/private/tmp/b_ENCfwcHOEnE-1772209167696/components/editor-block.tsx`

## 现有基础

| 组件 | 路径 | 当前状态 |
|------|------|---------|
| `LexicalCommentWrapper` | `comment/LexicalCommentWrapper.tsx` | 已有 containerRef、blockInfos、comments 数据 |
| `CommentBlockButton` | `comment/CommentBlockButton.tsx` | 简单 hover 按钮，**将被替换** |
| `CommentAnchorHighlight` | `comment/CommentAnchorHighlight.tsx` | CSS Highlight，保持不变 |
| `CommentModal` | `shared/CommentModal.tsx` | Modal 方式，**保留**（markdown 划线评论 + 选中文本评论仍用此） |
| `FloatPopover` | `ui/float-popover/FloatPopover.tsx` | 基于 `@floating-ui/react-dom`，已支持 mobile sheet |
| `Avatar` | `ui/avatar/Avatar.tsx` | 支持 imageUrl、size、text fallback |
| `CommentBoxRoot` | `comment/CommentBox/Root.tsx` | 完整评论输入组件 |

## 布局约束

Post 页面：`grid-cols-[auto_200px]` at `lg:`
- 内容列 auto，右列 200px（TOC + actions）
- gutter 绝对定位于内容右外侧，不影响内容宽度

## Step 1: 重写 CommentBlockButton → CommentBlockGutter

**File**: `apps/web/src/components/modules/comment/CommentBlockButton.tsx` → 删除内容，重写为 `CommentBlockGutter`

### Props

```typescript
interface CommentBlockGutterProps {
  containerRef: React.RefObject<HTMLElement | null>
  blockInfos: BlockInfo[]
  comments: CommentWithAnchor[]  // 新增：传入评论数据
  refId: string
  title: string
}
```

### 数据处理

```typescript
// 按 blockId 分组评论
const commentsByBlock = useMemo(() => {
  const map = new Map<string, CommentWithAnchor[]>()
  for (const c of comments) {
    const blockId = c.anchor?.blockId
    if (blockId) {
      const arr = map.get(blockId) || []
      arr.push(c)
      map.set(blockId, arr)
    }
  }
  return map
}, [comments])
```

### 视觉结构

Gutter 区域绝对定位在内容容器右外侧：

```
内容区 (relative)                    Gutter (absolute, right: -56px)
┌────────────────────────────┐      ┌──────┐
│  "A well-structured..."    │      │ 🧑🧑 2│  ← avatar stack + count
│                            │      └──────┘
│  "Core Principles"         │
│  "Consistency is the..."   │      ┌──────┐
│                            │      │  🧑 1│
│                            │      └──────┘
│  "Component Hierarchy"     │      ┌──────┐
│  (hover state)             │      │  [+] │  ← ghost button
│                            │      └──────┘
└────────────────────────────┘
```

### Block 位置追踪

- 监听 `.rich-content` 子元素的 `getBoundingClientRect()`
- 计算每个 gutter item 的 `top` 相对于 containerRef
- 使用 `useEffect` + `ResizeObserver` 在内容变化时重算

### Gutter Item 渲染逻辑

对每个 block（仅在 `lg:` 以上显示）：

1. **有评论的 block**：始终显示 avatar stack + count
   - 最多 3 个头像重叠（`-space-x-1.5`，`ring-2 ring-background`）
   - 右侧显示数字（`text-[11px] text-muted-foreground`）
   - hover 时 block 内容加浅色背景
   - 点击打开 FloatPopover → `CommentBlockThread`

2. **无评论的 block（hover 中）**：显示 ghost button
   - `opacity-0 → opacity-100` on hover
   - `size-7 rounded-md` 方形按钮，`i-mingcute-comment-plus-line`
   - 点击打开 FloatPopover → 空线程 + 输入框

### 响应式

- `lg:` 以上：显示 gutter（绝对定位右外侧）
- `< lg`：隐藏 gutter，保留现有 `WithArticleSelectionAction` 行为

## Step 2: CommentBlockThread 组件

**New file**: `apps/web/src/components/modules/comment/CommentBlockThread.tsx`

评论线程面板，嵌入 FloatPopover 内部。

### 结构

```
┌─ CommentBlockThread (w-80) ─────────────────┐
│  ┌─ ScrollArea (max-h-72) ─────────────────┐ │
│  │  🧑 Author Name · 2h ago                │ │
│  │  Comment text here...                    │ │
│  │                                          │ │
│  │  🧑 Another User · 1d ago               │ │
│  │  Reply text here...                      │ │
│  └──────────────────────────────────────────┘ │
│  ┌─ border-t ──────────────────────────────┐ │
│  │  CommentBoxRoot (compact mode)           │ │
│  └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### Props

```typescript
interface CommentBlockThreadProps {
  comments: CommentWithAnchor[]
  refId: string
  blockAnchor: BlockAnchor   // 当前 block 的 anchor
  onNewComment?: () => void  // 提交后回调（刷新 query）
}
```

### 评论列表

每条评论渲染：
- `Avatar` (size-6) + author name (`text-[13px] font-semibold`) + `RelativeTime` (`text-[11px]`)
- 评论文本 (`text-[13px] leading-relaxed opacity-80`)
- Range 评论额外显示引用文本（`border-l-2 border-accent/40 pl-2 text-xs italic`）
- 使用现有 `Avatar` 和 `RelativeTime` 组件

### 输入区

嵌入 `CommentBoxRoot`：
- `refId` = 文章 ID
- `anchor` = 当前 block 的 BlockAnchor
- `afterSubmit` → 关闭 popover + invalidate anchor comments query
- 紧凑样式

## Step 3: 更新 LexicalCommentWrapper

**File**: `apps/web/src/components/modules/comment/LexicalCommentWrapper.tsx`

### 修改

1. 将 `comments` 传给 `CommentBlockGutter`（现为 `CommentBlockButton` 的替代）
2. 移除旧的 `CommentBlockButton` 导入

```tsx
export function LexicalCommentWrapper({ content, refId, title, children }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const blockInfos = useMemo(() => extractBlockInfos(content), [content])
  const comments = useMergedAnchorComments(refId)

  return (
    <div ref={containerRef} className="group/comment-block relative">
      {children}
      <CommentBlockGutter
        containerRef={containerRef}
        blockInfos={blockInfos}
        comments={comments}
        refId={refId}
        title={title}
      />
      <CommentAnchorHighlight
        containerRef={containerRef}
        blockInfos={blockInfos}
        comments={comments}
      />
    </div>
  )
}
```

## Step 4: Block Hover 高亮

当 popover 打开时，对应 block 获得浅色背景高亮。

在 `CommentBlockGutter` 中：
- 追踪当前 open 的 popover blockId
- 通过 DOM 给对应 `.rich-content` 子元素添加/移除 CSS class
- CSS: `.comment-block-active { background: color-mix(in srgb, var(--color-accent) 5%, transparent); border-radius: 4px; }`

## Files Summary

| File | Action |
|------|--------|
| `comment/CommentBlockButton.tsx` | **重写**为 `CommentBlockGutter`（文件名保持或改名） |
| `comment/CommentBlockThread.tsx` | **新建**：评论线程面板 |
| `comment/LexicalCommentWrapper.tsx` | **修改**：传递 comments 给 gutter |

## Verification

1. `pnpm --filter @shiro/web dev` 启动
2. 打开 lexical 格式文章（有 anchor 评论）
3. 右侧 gutter 显示评论者头像 + 数量
4. hover 无评论的 block → ghost 按钮出现
5. 点击 avatar group → popover 打开，显示该 block 评论线程
6. 在 popover 中提交评论 → 成功后面板自动关闭/刷新
7. 响应式：< lg 隐藏 gutter
8. Lint: `pnpm --filter @shiro/web lint` 0 error
