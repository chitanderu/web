# Refactor: LinkCard Plugins 解耦业务数据请求

## Context

`rich-renderer-linkcard` 包中 5 个插件直接调用 `/api/` 业务路由（bangumi、leetcode、netease-music、qq-music、mx-space），导致库与 Next.js 业务耦合。需统一改用已有的 adapter 模式（GitHub/TMDB 已正确使用），使库可独立于业务运行。

## 方案

沿用 `fetchJsonWithContext()` + `provider` adapter 模式。插件传递 canonical URL，业务方通过 adapter 实现代理/鉴权/加密。

## 改动清单

### 1. Bangumi API Route（向后兼容）

**文件**: `apps/web/src/app/api/bangumi/[...all]/route.ts`

- 扩展 `allowedBangumiTypes` 同时接受单复数形式（`subject` 和 `subjects`）
- 使 adapter 可直接传递从 canonical URL 提取的复数路径

### 2. Bangumi Plugin

**文件**: `packages/rich-renderer-linkcard/src/plugins/media/bangumi.tsx`

- 加 `provider: 'bangumi'`
- import `fetchJsonWithContext`, `bangumiTypeMap`, `LinkCardFetchContext`
- `fetch(id, _meta, context?)` 改用:
  ```
  fetchJsonWithContext(`https://api.bgm.tv/v0/${bangumiTypeMap[type]}/${realId}`, context, 'bangumi')
  ```

### 3. LeetCode Plugin

**文件**: `packages/rich-renderer-linkcard/src/plugins/code/leetcode.tsx`

- 加 `provider: 'leetcode'`
- import `fetchJsonWithContext`, `LinkCardFetchContext`
- `fetch(id, _meta, context?)` 改用:
  ```
  fetchJsonWithContext('https://leetcode.cn/graphql/', context, 'leetcode', { method: 'POST', ... })
  ```

### 4. Netease Music Plugin

**文件**: `packages/rich-renderer-linkcard/src/plugins/media/netease-music.tsx`

- 加 `provider: 'netease-music'`
- import `fetchJsonWithContext`, `LinkCardFetchContext`
- `fetch(id, _meta, context?)` 改用:
  ```
  fetchJsonWithContext(`https://music.163.com/song/${id}`, context, 'netease-music')
  ```

### 5. QQ Music Plugin

**文件**: `packages/rich-renderer-linkcard/src/plugins/media/qq-music.tsx`

- 加 `provider: 'qq-music'`
- import `fetchJsonWithContext`, `LinkCardFetchContext`
- `fetch(id, _meta, context?)` 改用:
  ```
  fetchJsonWithContext(`https://y.qq.com/song/${id}`, context, 'qq-music')
  ```

### 6. MxSpace Plugin

**文件**: `packages/rich-renderer-linkcard/src/plugins/self/mx-space.tsx`

- `MxSpacePluginConfig` 移除 `apiBaseUrl`，仅保留 `webUrl`
- `createMxSpacePlugin` 返回的插件加 `provider: 'mx-space'`
- fetch 改用 `fetchJsonWithContext('posts/{cate}/{slug}', context, 'mx-space')`（传相对路径）
- 默认 `mxSpacePlugin` 也加 `provider: 'mx-space'`，fetch 改为同样逻辑（不再 throw，有 adapter 即可用）

### 7. 业务侧注册 Adapters

**文件**: `apps/web/src/components/ui/rich-content/LexicalContent.tsx`

`linkCardFetchContext.adapters` 补充:

| Provider | Adapter 逻辑 |
|----------|-------------|
| `bangumi` | 从 canonical URL 提取 path，转发 `/api/bangumi/{path}` |
| `leetcode` | 透传 `init`（POST body），转发 `/api/leetcode` |
| `netease-music` | 从 URL 提取 songId，POST `/api/music/netease` |
| `qq-music` | 从 URL 提取 songId，POST `/api/music/tencent` |
| `mx-space` | 将相对路径拼接为 `/api/v2/{path}` 请求 |

## 关键约束

- 插件仅定义数据格式解析，不含业务传输细节
- adapter 返回与上游 API 一致的 JSON，插件解析逻辑不变
- 无 adapter 时 `fetchJsonWithContext` fallback 到 native fetch（CORS 可能失败，属预期行为）
- bangumi API route 需同时接受新旧路径，保持向后兼容

## 验证

1. `pnpm --filter @haklex/rich-renderer-linkcard build` 确认包构建通过
2. `pnpm --filter @shiro/web build` 确认业务构建通过
3. 在 dev 环境手动测试各类 linkcard 渲染（GitHub、TMDB、Bangumi、LeetCode、Music）
