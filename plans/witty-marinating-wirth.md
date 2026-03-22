# 修复 SSR 渲染器 + 统一为唯一 RichRenderer

**约束**：无 RSC 要求。hooks 可用。SSR 引擎 render 路径不依赖浏览器 API。Static renderer 用 Isomorphic 标准（useEffect/callback 里可用浏览器 API，首帧有意义 HTML，不导入 edit-UI 包）。先 A 后 B。

## Context

SSR 渲染器未复刻 Readonly Renderer 效果。根因：`editor.getDecorators()` 在 headless 模式下返回空 `{}`，所有 DecoratorNode 丢失。此外 `DetailsNode`/`SpoilerNode`（ElementNode）无 builtin case 亦消失。

---

## Part A：修复 SSR 引擎渲染

### A1：修复 DecoratorNode 渲染

**文件**：`packages/rich-ssr-renderer/src/RichSSRRenderer.tsx`

**根因**：`editor.getDecorators()` 在 headless 下返回 `{}`。

**修复**：移除 `getDecorators()` 调用，在 `renderTree` 中对 DecoratorNode 直接调用 `node.decorate(editor, editor._config)`。

**关键**：`decorate()` 返回 `null`/`undefined` 时（如 `HorizontalRuleNode`），继续 fallthrough 到 builtin 分支。

**`editor._config` 规避**：不用私有字段，自行构造 `EditorConfig`：
```tsx
const editorConfig = { namespace: 'ssr', theme: editorTheme }
// node.decorate(editor, editorConfig)
```

```tsx
function renderTree(
  node: any,
  editor: LexicalEditor,
  editorConfig: { namespace: string; theme: any },
  headingSlugs: Map<string, number>,
  key: string,
): ReactNode {
  const nodeKey = node.getKey ? node.getKey() : key

  // DecoratorNode: 调用 decorate()，返回 null 则 fallthrough
  if (typeof node.decorate === 'function') {
    try {
      const decoration = node.decorate(editor, editorConfig)
      if (decoration != null) return decoration
    } catch { /* fallthrough to builtin */ }
  }

  const serialized = node.exportJSON ? node.exportJSON() : {}

  if (serialized.type === 'text') {
    return renderTextNode(serialized, nodeKey)
  }

  let children: ReactNode[] | null = null
  if (node.getChildren) {
    const childNodes = node.getChildren()
    if (childNodes.length > 0) {
      children = childNodes.map((child: any, i: number) =>
        renderTree(child, editor, editorConfig, headingSlugs, `${nodeKey}-${i}`),
      )
    }
  }

  return renderBuiltinNode(serialized, nodeKey, children, headingSlugs)
}
```

**变更清单**：
- 移除 `decorations` 参数和 `editor.getDecorators()` 调用
- `renderTree` 新增 `editor` + `editorConfig` 参数
- `editorConfig = { namespace: 'ssr', theme: editorTheme }` 在 `renderEditorToReact` 中构造一次复用
- DecoratorNode 分支：`decorate()` 返回非 null → use，否则 fallthrough
- `renderEditorToReact` 和 `renderNestedContent` 同步更新签名

**影响节点**（全部 DecoratorNode 均通过此路径渲染）：
- Alert、Banner、Grid → 各自的 StaticDecorator
- Image、Video、Mermaid、CodeBlock、LinkCard、KaTeX、Mention、Footnote、FootnoteSection → RendererWrapper
- HorizontalRuleNode → `decorate()` 返回 null → fallthrough → `renderBuiltinNode` 的 `<hr>` 分支
- Tldraw、Gallery、Embed、CodeSnippet → 各自的 static decorate

### A2：补全 ElementNode — details + spoiler

**文件**：`packages/rich-ssr-renderer/src/engine/renderBuiltinNode.tsx`

这两个是自定义 ElementNode（非 DecoratorNode），当前 switch 无 case，命中 `default: null`。

**新增 case**：

```tsx
case 'details': {
  // DetailsNode: <details class="rich-details"> + <summary> + <div class="rich-details-content">children</div>
  const summary = node.summary || ''
  return (
    <details key={key} className="rich-details" open={node.open || undefined}>
      <summary className="rich-details-summary">
        <span className="rich-details-summary-text">{summary}</span>
        <span className="rich-details-chevron">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8L10 12L14 8" />
          </svg>
        </span>
      </summary>
      <div className="rich-details-content">{children}</div>
    </details>
  )
}

case 'spoiler':
  // SpoilerNode: inline <span class="rich-spoiler">
  return <span key={key} className="rich-spoiler" role="button" tabIndex={0}>{children}</span>
```

**注**：SSR 下 spoiler 的 click-to-reveal 行为需浏览器端 JS hydrate，静态渲染仅输出 `rich-spoiler` class（CSS 控制遮罩）。

### A3：补全嵌套 listitem class

**文件**：`packages/rich-ssr-renderer/src/engine/renderBuiltinNode.tsx`

Lexical 序列化中嵌套 listitem 不存独立标识。检测方式：children 中包含 `list` 类型节点。但因 `renderBuiltinNode` 接收的是已渲染的 `ReactNode[]` children（非序列化节点），需在 `renderTree` 层传递额外信息。

**实际方案**：在 `renderBuiltinNode` 中检查 serialized node 的 `children` 是否包含 list 类型子节点：

```tsx
case 'listitem': {
  const isChecklist = node.checked !== undefined
  const hasNestedList = node.children?.some(
    (c: any) => c.type === 'list'
  )
  let cls: string
  if (hasNestedList) {
    cls = 'rich-list-nested-item'
  } else if (isChecklist) {
    cls = node.checked
      ? 'rich-list-item rich-list-item-checked'
      : 'rich-list-item rich-list-item-unchecked'
  } else {
    cls = 'rich-list-item'
  }
  return <li key={key} className={cls} value={node.value}>{children}</li>
}
```

**注**：`renderBuiltinNode` 已接收 `node`（序列化 JSON），其 `children` 字段可用于此检测。

### A4：补全 embed 样式

**文件**：`packages/rich-kit-shiro/src/style-ssr.css`

缺少 embed 样式，但默认 SSR extraNodes 包含 `embedNodes`。

```css
@import '@haklex/rich-editor/style.css';
@import '@haklex/rich-renderers/style.css';
@import '@haklex/rich-renderer-katex/style.css';
@import '@haklex/rich-ext-code-snippet/style.css';
@import '@haklex/rich-ext-embed/style.css';       /* ← 新增 */
@import 'katex/dist/katex.min.css';
```

---

## Part B：包改名与统一

### B1：包改名

| 操作 | 文件 | 说明 |
|------|------|------|
| RENAME DIR | `packages/rich-ssr-renderer/` → `packages/rich-renderer/` | |
| MODIFY | `packages/rich-renderer/package.json` | name → `@haklex/rich-renderer` |
| RENAME+MODIFY | `src/RichSSRRenderer.tsx` → `src/RichRenderer.tsx` | 函数/类型/日志改名 |
| MODIFY | `src/types.ts` | `RichSSRRendererProps` → `RichRendererProps` |
| MODIFY | `src/index.ts` | 导出改名 |

### B2：从 `@haklex/rich-editor` 移除旧 RichRenderer

| 操作 | 文件 | 说明 |
|------|------|------|
| DELETE | `src/components/RichRenderer.tsx` | 旧 LexicalComposer renderer |
| DELETE | `src/renderer.ts` | 旧入口 |
| MODIFY | `src/index.ts` | 删 `RichRenderer`、`RichRendererProps` 导出 |
| MODIFY | `src/types.ts` | 删 `RichRendererProps` interface |
| MODIFY | `src/static-entry.ts` | 删 `RichRendererProps` 导出 |
| MODIFY | `package.json` | 删 `./renderer` 入口 |
| MODIFY | `vite.config.ts` | 删 `renderer` entry |

### B3：`@haklex/rich-kit-shiro` 合并

| 操作 | 文件 | 说明 |
|------|------|------|
| MODIFY | `src/ShiroRenderer.tsx` | `RichRenderer` 改从 `@haklex/rich-renderer` 导入 |
| DELETE | `src/ssr.tsx` | 合入 ShiroRenderer |
| RENAME | `src/style-ssr.css` → `src/style-renderer.css` | |
| MODIFY | `package.json` | dep: `rich-ssr-renderer` → `rich-renderer`；exports: 删 `./ssr`，`./style-ssr.css` → `./style-renderer.css` |
| MODIFY | `vite.config.ts` | 删 `ssr` entry |
| MODIFY | `src/index.ts` | `RichRenderer`/`RichRendererProps` re-export 改从 `@haklex/rich-renderer` |

### B4：`@haklex/rich-diff` 迁移

| 操作 | 文件 | 说明 |
|------|------|------|
| MODIFY | `package.json` | 加 `@haklex/rich-renderer` dep |
| MODIFY | `src/RichDiff.tsx` | `RichRenderer`/`RichRendererProps` 改从 `@haklex/rich-renderer` |

### B5：Demo 更新（全部 5 处）

| 操作 | 文件 | 说明 |
|------|------|------|
| MODIFY | `src/App.tsx:3` | `@haklex/rich-kit-shiro/style-ssr.css` → `@haklex/rich-kit-shiro/style-renderer.css` |
| MODIFY | `pages/DiffPage.tsx` | `RichRenderer` 改从 `@haklex/rich-renderer` |
| MODIFY | `pages/EditorPage.tsx` | 删 `ShiroSSRRenderer` import，SSR 模式改用 `ShiroRenderer` |
| MODIFY | `pages/PresetsPage.tsx` | 同上 |
| MODIFY | `package.json` | 加 `@haklex/rich-renderer` dep |

### B6：CSS 产物路径

`style-renderer.css` 无 JS entry 引用，Vite 不会自动产出。方案：在 `src/renderer.tsx` 中 `import './style-renderer.css'`。构建时 Vite 会提取 CSS 至 `dist/renderer.css`，`publishConfig` 对应更新。

---

## 验证

```bash
pnpm install
pnpm --filter @haklex/rich-renderer build
pnpm --filter @haklex/rich-editor build
pnpm --filter @haklex/rich-diff build
pnpm --filter @haklex/rich-kit-shiro build

# Demo 视觉验证
pnpm --filter @haklex/rich-editor-demo dev
# Readonly 和 SSR 模式逐一对比：
# ✓ Alert (TIP/WARNING/CALLOUT) — 容器+图标+嵌套内容
# ✓ Banner — 容器+嵌套内容
# ✓ Grid — 多列布局
# ✓ Image — thumbhash+caption
# ✓ Mermaid — fallback pre/code
# ✓ CodeBlock — Shiki 高亮
# ✓ LinkCard
# ✓ KaTeX 公式
# ✓ Tldraw — SSR placeholder
# ✓ Footnote 引用+section
# ✓ HorizontalRule — <hr> 正常渲染
# ✓ Details — <details> 折叠块
# ✓ Spoiler — 遮罩文字
# ✓ Table — 表格结构
# ✓ Checklist — 勾选样式
# ✓ Embed — 嵌入块+样式
# ✓ Heading anchor 链接
```
