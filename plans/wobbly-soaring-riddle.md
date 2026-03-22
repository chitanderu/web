# Plan: ExcalidrawEditRendererProps 类型化重构

## Context

当前 `ExcalidrawEditRendererProps` 将三种存储模式（inline / remote / delta）编码为单一 `snapshot: string`，解析逻辑散落在 `useExcalidrawData` 和 `ExcalidrawEditorDialogContent` 的 useState 初始化中。需拆分为 discriminated union，使 API 语义清晰、类型安全。

## New Type

```ts
// haklex/rich-ext-excalidraw/src/types.ts (新建)
export type ExcalidrawSnapshot =
  | { type: 'inline'; data: Record<string, any> }
  | { type: 'remote'; url: string }
  | { type: 'delta'; baseUrl: string; delta: object }

export function parseSnapshot(raw: string): ExcalidrawSnapshot | null
export function serializeSnapshot(snapshot: ExcalidrawSnapshot): string
```

- `parseSnapshot`: 从 `useExcalidrawData.ts` 提取现有解析逻辑（JSON.parse → inline, URL → remote, URL+delta → delta, empty → null）
- `serializeSnapshot`: 从 `ExcalidrawEditRenderer.tsx` `performSave` 提取序列化逻辑（inline → JSON.stringify, remote → ref, delta → ref\ndelta）

## Step 1: 新建 `src/types.ts`

提取 `ExcalidrawSnapshot` 类型 + `parseSnapshot()` + `serializeSnapshot()` 工具函数。

```ts
export type ExcalidrawSnapshot =
  | { type: 'inline'; data: Record<string, any> }
  | { type: 'remote'; url: string }
  | { type: 'delta'; baseUrl: string; delta: object }

export function parseSnapshot(raw: string): ExcalidrawSnapshot | null {
  if (!raw || !raw.trim()) return null
  try {
    const json = JSON.parse(raw)
    if (json && typeof json === 'object') return { type: 'inline', data: json }
  } catch { /* not JSON */ }
  const lines = raw.split('\n')
  const firstLine = lines[0].trim()
  if (!firstLine.startsWith('http') && !firstLine.startsWith('blob:') && !firstLine.startsWith('ref:'))
    return null
  const remaining = lines.slice(1).join('\n').trim()
  if (remaining) {
    try {
      const delta = JSON.parse(remaining)
      if (delta && typeof delta === 'object') return { type: 'delta', baseUrl: firstLine, delta }
    } catch { /* not delta */ }
  }
  return { type: 'remote', url: firstLine }
}

export function serializeSnapshot(snapshot: ExcalidrawSnapshot): string {
  switch (snapshot.type) {
    case 'inline': return JSON.stringify(snapshot.data)
    case 'remote': return snapshot.url
    case 'delta': return [snapshot.baseUrl, JSON.stringify(snapshot.delta)].join('\n')
  }
}
```

## Step 2: 重构 `useExcalidrawData.ts`

接受 `string | ExcalidrawSnapshot | null` 输入：

- `string` → 调用 `parseSnapshot()` 转为 typed（兼容 `ExcalidrawDisplayRenderer` 现有 string 接口）
- `ExcalidrawSnapshot | null` → 直接使用

内部逻辑按 typed `ExcalidrawSnapshot` 分发：inline 直接返回，remote/delta 走 fetch 路径。

关键：`useMemo` 内对 string 调用 `parseSnapshot()`，对 object 直接透传。依赖数组用 `input`（string 时值比较稳定；object 时需调用方保证引用稳定，ExcalidrawEditNode.decorate 仅在 node 变更时调用，天然稳定）。

## Step 3: 重构 `ExcalidrawEditRenderer.tsx`

### Props 接口

```ts
export interface ExcalidrawEditRendererProps {
  snapshot: ExcalidrawSnapshot | null
  onSnapshotChange: (snapshot: ExcalidrawSnapshot) => void
}
```

### ExcalidrawEditorDialogContent

- `storageMode` 初始化：从 `snapshot.type` 直接推导，无需 string 解析
  - `null` → `'inline'`
  - `{ type: 'inline' }` → `'inline'`
  - `{ type: 'remote' }` → `'remote'`
  - `{ type: 'delta' }` → `'delta'`
- `initialSnapshot: string` prop → `initialSnapshot: ExcalidrawSnapshot | null`
- `savedRef` 初始化：remote → `snapshot.url`，delta → `snapshot.baseUrl`，其余 `''`
- `performSave` 的 `onSave` 回调签名 → `onSave: (snapshot: ExcalidrawSnapshot) => void`
  - inline: `onSave({ type: 'inline', data: doc })`
  - remote: `onSave({ type: 'remote', url: ref })`
  - delta (有 diff): `onSave({ type: 'delta', baseUrl: currentBaseUrl, delta })`
  - delta (无 diff，即 base 上传后无变更): `onSave({ type: 'remote', url: currentBaseUrl })`
- Storage mode 切换后立即 `performSave()`，与当前行为一致

### ExcalidrawEditRenderer 主组件

- 将 `useExcalidrawData(snapshot)` 调用改为传入 typed `ExcalidrawSnapshot | null`
- `handleOpenEditor` 传给 dialog 的 `initialSnapshot` 改为 typed
- `onSave` 回调直接透传 `onSnapshotChangeRef.current(typedSnapshot)`

## Step 4: 更新 `ExcalidrawEditNode.ts`

`decorate()` 中构建 props 时做 string ↔ typed 转换：

```ts
// string → typed (入)，typed → string (出)
createElement(LazyEditRenderer, {
  snapshot: parseSnapshot(this.__snapshot),
  onSnapshotChange: (snapshot: ExcalidrawSnapshot) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if (node) node.setSnapshot(serializeSnapshot(snapshot))
    })
  },
})
```

## Step 5: 更新 `index.ts` 导出

```ts
export type { ExcalidrawSnapshot } from './types'
export { parseSnapshot, serializeSnapshot } from './types'
```

## Step 6: 更新 BizPage demo

```tsx
// Remote mode
const [remoteSnapshot, setRemoteSnapshot] = useState<ExcalidrawSnapshot>(() => ({
  type: 'remote',
  url: URL.createObjectURL(new Blob([excalidrawInlineSnapshot], { type: 'application/json' })),
}))

// Delta mode
const [deltaSnapshot, setDeltaSnapshot] = useState<ExcalidrawSnapshot>(() => ({
  type: 'delta',
  baseUrl: URL.createObjectURL(new Blob([excalidrawInlineSnapshot], { type: 'application/json' })),
  delta: {},
}))

<ExcalidrawEditRenderer snapshot={remoteSnapshot} onSnapshotChange={setRemoteSnapshot} />
<ExcalidrawEditRenderer snapshot={deltaSnapshot} onSnapshotChange={setDeltaSnapshot} />
```

## 不变的部分

- `ExcalidrawDisplayRenderer` 保持 `snapshot: string` 接口不变（只读路径，string 解析由 `useExcalidrawData` 内部处理）
- `ExcalidrawNode.__snapshot` 仍为 string（Lexical 序列化格式）
- `ExcalidrawSSRRenderer` 不变
- `ExcalidrawConfigContext` 不变

## 文件清单

| 操作 | 文件 |
|------|------|
| CREATE | `haklex/rich-ext-excalidraw/src/types.ts` |
| MODIFY | `haklex/rich-ext-excalidraw/src/useExcalidrawData.ts` |
| MODIFY | `haklex/rich-ext-excalidraw/src/ExcalidrawEditRenderer.tsx` |
| MODIFY | `haklex/rich-ext-excalidraw/src/ExcalidrawEditNode.ts` |
| MODIFY | `haklex/rich-ext-excalidraw/src/index.ts` |
| MODIFY | `haklex/rich-editor-demo/src/pages/BizPage.tsx` |

## 验证

```bash
pnpm --filter @haklex/rich-editor-demo dev
```

- BizPage: Remote demo 打开 modal 后 header 显示 "Remote"，保存后不报错
- BizPage: Delta demo 打开 modal 后 header 显示 "Delta"，保存后不报错
- BizPage: 切换 storage mode 后保存正常
- NodeShowcase: excalidraw node 仍能正常渲染（DisplayRenderer 未改动）
