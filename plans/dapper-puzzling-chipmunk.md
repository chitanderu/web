# Shadow DOM Isolation for ShiroRenderer

## Context

`LexicalContent.tsx` imports `@haklex/rich-kit-shiro/style.css` which injects rich-editor CSS into `<head>`. External CSS (Tailwind typography/prose, DaisyUI base resets on `h1`/`p`/`a`) also in `<head>` conflicts with the rich-editor's vanilla-extract styles, causing layout/style corruption.

**Goal**: Wrap `ShiroRenderer` in shadow DOM so only its own CSS applies, fully isolated from page-level styles.

## Approach: `adoptedStyleSheets` via `react-shadow`

1. **Build script** bundles all rich-editor CSS (resolving `@import` chain) into a single JS string export
2. **Runtime**: Construct a `CSSStyleSheet` from that string, pass to `react-shadow`'s `styleSheets` prop
3. **No FOUC**: `adoptedStyleSheets` is synchronous — styles apply before content renders

### Why not other approaches
- `injectHostStyles={true}`: Clones ALL host styles into shadow DOM, re-introducing the same pollution
- `?raw` CSS import: Inconsistent turbopack/webpack support, doesn't resolve `@import` chains
- `<link>` in shadow DOM: Async loading causes FOUC, requires copying CSS to `public/`
- CSS `@layer`: Doesn't fully isolate element-level selectors from DaisyUI resets

## Implementation Steps

### Step 1: Create CSS bundling script

**New file**: `packages/rich-kit-shiro/scripts/bundle-css.mjs`

- Use `postcss` + `postcss-import` (both already devDeps of the web app; add to this package)
- Read `src/style.css`, resolve all `@import` chains into flat CSS
- Post-process: replace `:root {` → `:root, :host {` so CSS variables also apply to shadow host
- Output two files:
  - `dist/rich-kit-shiro-bundled.css` (flat CSS for reference)
  - `dist/style-bundled-text.mjs` (JS module exporting CSS as string)

### Step 2: Update `packages/rich-kit-shiro/package.json`

- Add `postcss` and `postcss-import` to devDependencies
- Add `"postbuild": "node scripts/bundle-css.mjs"` script
- Add new exports:
  ```json
  "./style-bundled.css": "./dist/rich-kit-shiro-bundled.css"
  "./style-bundled-text": "./dist/style-bundled-text.mjs"
  ```
- Update `publishConfig.exports` accordingly

### Step 3: Rewrite `LexicalContent.tsx`

**File**: `apps/web/src/components/ui/rich-content/LexicalContent.tsx`

- Remove `import '@haklex/rich-kit-shiro/style.css'` (no longer inject into `<head>`)
- Import CSS string from `@haklex/rich-kit-shiro/style-bundled-text`
- Create singleton `CSSStyleSheet` via `new CSSStyleSheet()` + `replaceSync()`
- Use `react-shadow`'s `root.div` with `styleSheets` prop
- Pass `theme={isDark ? 'dark' : 'light'}` to `ShiroRenderer`
- Add `data-theme` and `id="shadow-html"` on inner wrapper div (matching existing shadow DOM pattern)

### Step 4: Build and verify

- Run `pnpm --filter @haklex/rich-kit-shiro build` (triggers postbuild → bundle-css)
- Run `pnpm --filter @shiro/web dev`
- Verify posts/notes/pages with lexical content render correctly with isolated styles

## Critical Files

| File | Action |
|------|--------|
| `packages/rich-kit-shiro/scripts/bundle-css.mjs` | Create |
| `packages/rich-kit-shiro/package.json` | Edit (exports, scripts, devDeps) |
| `apps/web/src/components/ui/rich-content/LexicalContent.tsx` | Rewrite |

## Existing Patterns Reused

- `react-shadow` `root.div` + `styleSheets` prop (same as `ShadowDOM.tsx` pattern)
- `useIsDark()` hook from `~/hooks/common/use-is-dark`
- `data-theme` + `id="shadow-html"` wrapper convention (from existing `ShadowDOM` component)
- `postcss-import` for CSS resolution (already used in project's PostCSS pipeline)

## Known Limitations

- **Heading anchor fragments**: `#heading-id` URLs won't scroll to headings inside shadow DOM (IDs not in main document namespace). Can be addressed separately.
- **CSS in JS bundle**: ~176K raw (~25K gzipped) CSS as JS string. Acceptable since component is behind `dynamic()` import.
- **Inherited CSS properties**: `color`, `font-family` etc. inherit through shadow boundary. The rich-editor's variant classes override these, so not an issue.

## Verification

1. `pnpm --filter @haklex/rich-kit-shiro build` — confirm `dist/style-bundled-text.mjs` generated
2. `pnpm --filter @shiro/web dev` — dev server starts without errors
3. Open a post/note/page with lexical content format
4. Inspect DOM: confirm `ShiroRenderer` lives inside a `#shadow-root`
5. Verify rich-editor styles render correctly (typography, code blocks, images, alerts)
6. Verify external CSS (prose, DaisyUI resets) does NOT affect content inside shadow DOM
