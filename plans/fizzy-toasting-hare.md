# Plan: Superscript/Subscript + Footnote Enhancement

## Context

Two issues to address:
1. **No superscript/subscript support** — Lexical natively supports `superscript` and `subscript` text formats, but the editor lacks markdown transformers (`^text^` / `~text~`) and floating toolbar buttons for them.
2. **Footnote editing broken** — When a user types `[^id]` inline, a `FootnoteNode` is created but no `FootnoteSectionNode` is auto-created at the document bottom. Without the section node, there's nowhere to display or edit footnote definitions. The infrastructure (nodes, renderers, plugin, context) all exist but the **auto-creation glue** is missing.

## Task 1: Superscript / Subscript

### 1a. Markdown Transformers

**Files to modify:**
- `packages/rich-headless/src/transformers.ts` — Add two `TextFormatTransformer` entries (export-only, same pattern as `INSERT_TRANSFORMER`)
- `packages/rich-editor/src/transformers/index.ts` — Import and add to `ALL_TRANSFORMERS` array

```ts
// In rich-headless/src/transformers.ts
export const SUPERSCRIPT_TRANSFORMER: TextFormatTransformer = {
  format: ['superscript'],
  tag: '^',
  type: 'text-format',
}

export const SUBSCRIPT_TRANSFORMER: TextFormatTransformer = {
  format: ['subscript'],
  tag: '~',
  type: 'text-format',
}
```

Add to `allHeadlessTransformers` in rich-headless and `ALL_TRANSFORMERS` in rich-editor.

### 1b. Theme CSS Classes

**Files to modify:**
- `packages/rich-editor/src/styles/theme.ts` — Add `superscript` and `subscript` to `editorTheme.text`
- `packages/rich-editor/src/styles/shared.css.ts` — Add CSS rules

```ts
// theme.ts text block
superscript: 'rich-text-superscript',
subscript: 'rich-text-subscript',
```

```ts
// shared.css.ts after strikethrough
globalStyle(`${richContent} .rich-text-superscript`, {
  verticalAlign: 'super',
  fontSize: '0.8em',
})

globalStyle(`${richContent} .rich-text-subscript`, {
  verticalAlign: 'sub',
  fontSize: '0.8em',
})
```

### 1c. Floating Toolbar Buttons

**File to modify:** `packages/rich-plugin-floating-toolbar/src/FloatingToolbarPlugin.tsx`

- Import `Superscript, Subscript` from `lucide-react`
- Add `isSuperscript`, `isSubscript` to `ToolbarState` and `INITIAL_STATE`
- Add `selection.hasFormat('superscript')` / `selection.hasFormat('subscript')` to `getSelectionState`
- Add `'superscript' | 'subscript'` to `handleFormat` union type
- Add two `ToolbarButton` entries after Strikethrough in Group 1

## Task 2: Footnote Auto-Creation & Editing

### 2a. Enhance FootnotePlugin to Auto-Create Section Node

**File to modify:** `packages/rich-editor/src/plugins/FootnotePlugin.tsx`

Current behavior: Plugin only **reads** existing section nodes. It never creates one.

New behavior: When `FootnoteNode` instances exist but no `FootnoteSectionNode` exists, auto-create one at the document root's end. Also auto-populate missing identifiers into the section's definitions (with empty content as placeholder).

```ts
// In the registerUpdateListener callback, after computing numberMap:
const sectionNodes = $nodesOfType(FootnoteSectionNode)
if (footnoteNodes.length > 0 && sectionNodes.length === 0) {
  // Need to auto-create — schedule a separate update to avoid read-only violation
  editor.update(() => {
    const root = $getRoot()
    const defs: Record<string, string> = {}
    for (const id of seen) {
      defs[id] = ''
    }
    const section = $createFootnoteSectionNode(defs)
    root.append(section)
  })
}
// If section exists, ensure all referenced identifiers have definitions
if (sectionNodes.length > 0) {
  const section = sectionNodes[0]
  const existingDefs = section.getDefinitions()
  const missingIds = [...seen].filter((id) => !(id in existingDefs))
  if (missingIds.length > 0) {
    editor.update(() => {
      const freshSection = $nodesOfType(FootnoteSectionNode)
      if (freshSection.length > 0) {
        for (const id of missingIds) {
          freshSection[0].setDefinition(id, '')
        }
      }
    })
  }
}
```

Note: The auto-creation must happen via `editor.update()` since the listener reads `editorState.read()`. We schedule a separate update.

### 2b. Footnote Section Renders at Document Bottom (Already Works)

The `FootnoteSectionNode` is a block-level `DecoratorNode`. Once it's appended to root, it renders at the bottom via its `decorate()` method. The existing `FootnoteSectionRenderer` and `FootnoteSectionEditRenderer` already handle display/editing. **No changes needed to renderers.**

### 2c. Edit Mode: FootnoteSectionEditRenderer Already Works

The `FootnoteSectionEditNode` overrides `decorate()` to use `FootnoteSectionEditRenderer`, which provides:
- Text inputs for each definition
- Remove (×) button per definition
- Content changes update the node via `editor.update()`

This already works — the only issue was that the node was never created. Task 2a fixes this.

### 2d. Cleanup: Remove Orphaned Section When No Footnotes Remain

When all `FootnoteNode` references are deleted, the `FootnoteSectionNode` should also be removed.

In the same `registerUpdateListener`:
```ts
if (footnoteNodes.length === 0 && sectionNodes.length > 0) {
  editor.update(() => {
    const sections = $nodesOfType(FootnoteSectionNode)
    for (const s of sections) s.remove()
  })
}
```

## Files to Modify (Summary)

| # | File | Change |
|---|------|--------|
| 1 | `packages/rich-headless/src/transformers.ts` | Add `SUPERSCRIPT_TRANSFORMER`, `SUBSCRIPT_TRANSFORMER` |
| 2 | `packages/rich-editor/src/transformers/index.ts` | Import and register in `ALL_TRANSFORMERS` |
| 3 | `packages/rich-editor/src/styles/theme.ts` | Add superscript/subscript CSS class names |
| 4 | `packages/rich-editor/src/styles/shared.css.ts` | Add superscript/subscript CSS rules |
| 5 | `packages/rich-plugin-floating-toolbar/src/FloatingToolbarPlugin.tsx` | Add toolbar buttons + state |
| 6 | `packages/rich-editor/src/plugins/FootnotePlugin.tsx` | Auto-create/sync/cleanup FootnoteSectionNode |

## Verification

1. `pnpm --filter @haklex/rich-editor build` — ensure build passes
2. `pnpm --filter @haklex/rich-headless build` — ensure build passes
3. `pnpm --filter @haklex/rich-plugin-floating-toolbar build` — ensure build passes
4. `pnpm --filter @haklex/rich-editor-demo dev` — manual test:
   - Type `^superscript^` → text becomes superscript
   - Type `~subscript~` → text becomes subscript
   - Select text, click toolbar superscript/subscript buttons → format toggles
   - Type `[^1]` → FootnoteNode created + FootnoteSectionNode auto-created at bottom
   - Edit footnote definition via the section's input fields
   - Delete all `[^1]` references → section auto-removed
