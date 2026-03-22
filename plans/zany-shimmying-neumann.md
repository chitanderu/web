# Mention Plugin: `@` Trigger + Platform Registry + Slash Menu

## Context

`MentionNode` 已存在，支持4种平台(GH/TW/TG/ZH)，有完整的 static/edit renderer 分离。但缺少编辑器中的快捷插入机制——用户只能通过手写 markdown `{GH@handle}` 或通过 MentionEditRenderer 的 Popover 编辑已有节点。

需求：
1. 输入 `@` 触发 typeahead 面板，两阶段交互（选平台 → 输handle → Enter插入）
2. 可扩展的平台注册机制，外部可注册新 mention 类型
3. MentionNode 加入 slash menu

## Implementation Plan

### Step 1: Create `packages/rich-plugin-mention` package

新建包，与 `rich-plugin-slash-menu` 同级，结构如下：

```
packages/rich-plugin-mention/
├── src/
│   ├── index.ts
│   ├── MentionMenuPlugin.tsx      # 主 plugin 组件
│   ├── MentionMenuItem.ts         # MenuOption 子类
│   ├── MentionMenuList.tsx        # 面板 UI
│   ├── MentionPlatformRegistry.ts # 平台注册表
│   └── styles.css.ts              # Vanilla Extract 样式
├── package.json
├── tsconfig.json
└── vite.config.ts
```

**Files to reference/copy pattern from:**
- `packages/rich-plugin-slash-menu/package.json` — package.json 模板
- `packages/rich-plugin-slash-menu/vite.config.ts` — build 配置
- `packages/rich-plugin-slash-menu/tsconfig.json`

### Step 2: Platform Registry (`MentionPlatformRegistry.ts`)

```typescript
export interface MentionPlatformDef {
  key: string           // e.g. "GH"
  label: string         // e.g. "GitHub"
  icon: ReactNode       // 平台图标
  getUrl: (handle: string) => string
}

// 默认注册4个内置平台（从 MentionRenderer 的 platformMetaMap 对齐）
const builtinPlatforms: MentionPlatformDef[] = [
  { key: 'GH', label: 'GitHub', icon: ..., getUrl: ... },
  { key: 'TW', label: 'Twitter', icon: ..., getUrl: ... },
  { key: 'TG', label: 'Telegram', icon: ..., getUrl: ... },
  { key: 'ZH', label: 'Zhihu', icon: ..., getUrl: ... },
]
```

Plugin 通过 props 接收额外平台定义：
```typescript
interface MentionMenuPluginProps {
  extraPlatforms?: MentionPlatformDef[]
}
```

同时 export `builtinPlatforms` 供外部使用。

### Step 3: `MentionMenuPlugin.tsx` — 两阶段 Typeahead

复用 `LexicalTypeaheadMenuPlugin` + `useBasicTypeaheadTriggerMatch('@', { minLength: 0 })`。

**状态机：**

```
Phase 1: 输入 @
  → 展示所有平台列表（过滤 by queryString）
  → 选中平台 → 进入 Phase 2

Phase 2: 输入 @GH: (平台已锁定)
  → 面板显示 "GitHub — 输入用户名"
  → 继续输入 handle
  → Enter → 插入 $createMentionNode(platform, handle)
  → Esc → 回到 Phase 1
```

**实现要点：**
- 用 `useState` 管理 `selectedPlatform: string | null`
- Phase 1 时 `options` 是平台列表的 `MentionMenuItem[]`
- Phase 2 时 options 为单个 "confirm" 项（显示当前输入的 handle），或简化为 queryString 解析
- `onSelectOption` 中：
  - Phase 1：设置 `selectedPlatform`，不关闭 menu，更新 queryString 追加 `PLATFORM:`
  - Phase 2：解析 handle，调用 `$insertNodes([$createMentionNode(...)])`

**替代方案（更简洁）：** 不用两阶段状态机，而是直接在 queryString 中解析。
- `@` → 显示所有平台
- `@gh` → 过滤匹配 GH
- 选择 GH → 把 textNode 内容替换为 `@GH:`，menu 自然收到新 queryString `GH:`
- `@GH:innei` → queryString 为 `GH:innei`，检测到 `:` 分隔符，进入 handle 输入模式
- Enter on the "confirm" item → 插入 MentionNode

推荐此方案，利用 typeahead 自身的 queryString 更新来驱动阶段切换，无需额外状态。

### Step 4: `MentionMenuItem.ts`

```typescript
export class MentionMenuItem extends MenuOption {
  platform?: MentionPlatformDef  // Phase 1 item
  handleText?: string            // Phase 2 confirm item
  icon: ReactNode
  description: string
}
```

### Step 5: `MentionMenuList.tsx`

复用 slash menu list 的 UI 结构（icon + title + description），但更简洁：
- Phase 1：列出平台（icon + label + 简短描述）
- Phase 2：显示输入提示 "输入用户名，Enter确认"

样式复用 `@haklex/rich-style-token` 的 vars，与 slash menu 视觉一致。

### Step 6: Slash Menu Integration

在 `MentionNode` 添加 `static slashMenuItems`：

```typescript
// packages/rich-editor/src/nodes/MentionNode.ts
static slashMenuItems: SlashMenuItemConfig[] = [
  {
    title: 'Mention',
    icon: createElement(AtSign, { size: 20 }),
    description: 'Mention a social account',
    keywords: ['mention', 'at', '@', 'github', 'twitter'],
    section: 'INLINE',
    onSelect: (editor) => {
      // 插入 @ 触发符，让 MentionMenuPlugin 接管
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          selection.insertText('@')
        }
      })
    },
  },
]
```

这样选中 slash menu 的 "Mention" 后，会插入 `@` 字符，自动触发 MentionMenuPlugin 的 typeahead。

### Step 7: Integration in `rich-renderers-edit`

- `packages/rich-renderers-edit/src/index.ts` — 新增 export `MentionMenuPlugin`
- `packages/rich-renderers-edit/package.json` — 添加 `@haklex/rich-plugin-mention` 依赖
- `pnpm-workspace.yaml` — 确认 packages glob 已覆盖新包

### Step 8: Wire up in editor demo

在 `packages/rich-editor-demo` 或 `apps/web` 中，在 `RichEditor` 旁放置 `<MentionMenuPlugin />` 插件。

## Critical Files

| File | Action |
|------|--------|
| `packages/rich-plugin-mention/` (new) | 新建整个包 |
| `packages/rich-editor/src/nodes/MentionNode.ts` | 添加 `static slashMenuItems` |
| `packages/rich-renderers-edit/src/index.ts` | 新增 export |
| `packages/rich-renderers-edit/src/config.ts` | 无需改（renderer 无变化） |
| `packages/rich-renderers-edit/package.json` | 添加依赖 |
| `packages/rich-renderer-mention/src/MentionRenderer.tsx` | 导出 `platformMetaMap` 类型供 plugin 复用 |

## Reuse Points

- `LexicalTypeaheadMenuPlugin` + `useBasicTypeaheadTriggerMatch` — from `@lexical/react`
- `MenuOption` — from `@lexical/react/LexicalTypeaheadMenuPlugin`
- `PortalThemeWrapper` — from `@haklex/rich-style-token`
- `vars` (design tokens) — from `@haklex/rich-style-token`
- `$createMentionNode` — from `@haklex/rich-editor`
- `platformMetaMap` — from `@haklex/rich-renderer-mention`（复用 icon + url + label）
- Slash menu styles pattern — from `packages/rich-plugin-slash-menu/src/styles.css.ts`

## Verification

1. `pnpm --filter @haklex/rich-plugin-mention build` — 构建成功
2. `pnpm --filter @haklex/rich-editor-demo dev` — 启动 playground
3. 在编辑器中输入 `@` → 应出现平台列表
4. 输入 `@gh` → 列表过滤到 GitHub
5. 选择 GH → 文本变为 `@GH:`，面板切换到 handle 输入模式
6. 输入 `@GH:innei` + Enter → 插入 MentionNode，渲染为 GitHub badge
7. 输入 `/` → slash menu 中应出现 "Mention" 项
8. 选择 "Mention" → 插入 `@`，触发 mention 面板
9. 验证 Esc 可取消/回退阶段
