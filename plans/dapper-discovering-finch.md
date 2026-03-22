# MarkdownPastePlugin Implementation Plan

## Context

The `@haklex/rich-editor` currently handles paste events only for images (via `ImageUploadPlugin`). When users paste Markdown text (e.g., from GitHub, documentation, or VS Code), it's inserted as plain text. This plugin auto-detects pasted Markdown and converts it to rich Lexical nodes, and also handles VS Code paste as code blocks.

## Architecture

### New File

- `haklex/rich-editor/src/plugins/MarkdownPastePlugin.tsx`

### Modified Files

- `haklex/rich-editor/src/components/RichEditor.tsx` — mount `<MarkdownPastePlugin />`
- `haklex/rich-editor/src/plugins/index.ts` — export plugin

## Plugin Design

Register `PASTE_COMMAND` at `COMMAND_PRIORITY_HIGH`. The handler follows this decision tree:

```
PASTE_COMMAND received
├─ Has `vscode-editor-data` type?
│  └─ YES → Create CodeBlock node with language + code → return true
├─ Has `text/html` with real formatting?
│  └─ YES → return false (let Lexical default HTML paste handle)
├─ Get `text/plain`, run markdown detection
│  ├─ score >= threshold → convert markdown → insert nodes → return true
│  └─ score < threshold → return false (plain text paste)
└─ No text → return false
```

### Step 1: VS Code Paste Detection

```typescript
function getVSCodePasteData(clipboardData: DataTransfer): { language: string } | null {
  const raw = clipboardData.getData('vscode-editor-data')
  if (!raw) return null
  try {
    const data = JSON.parse(raw)
    return { language: data.mode || 'text' }
  } catch {
    return null
  }
}
```

When detected, split by double blank lines (`\n\n\n+`) into separate code blocks:

```typescript
const code = clipboardData.getData('text/plain')
const segments = code.split(/\n{3,}/).filter(Boolean)
const nodes = segments.map((seg) => $createCodeBlockEditNode(seg.trim(), language))
$insertNodes(nodes)
```

Use `$createCodeBlockEditNode` (not `$createCodeBlockNode`) since we're in the editor context. Import from `../nodes/CodeBlockEditNode`. Single blank lines within code are preserved — only 2+ consecutive blank lines trigger splitting.

### Step 2: Rich HTML Check

```typescript
function hasRichHTML(clipboardData: DataTransfer): boolean {
  const html = clipboardData.getData('text/html')
  if (!html) return false
  // VS Code HTML contains data-vscode attributes — not "rich"
  if (/data-vscode|vscode-/i.test(html)) return false
  // Check for formatting tags beyond bare <p>/<span>
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const richTags = doc.body.querySelectorAll(
    'strong,em,b,i,h1,h2,h3,h4,h5,h6,ul,ol,table,img,blockquote,pre>code,a[href]'
  )
  return richTags.length > 0
}
```

If `hasRichHTML` → `return false` to let Lexical's built-in HTML→Lexical conversion handle it.

### Step 3: Markdown Detection (Scoring)

```typescript
function detectMarkdown(text: string): boolean {
  let score = 0

  // High confidence (5 pts each)
  if (/^#{1,6}\s+\S/m.test(text)) score += 5          // ATX heading
  if (/^```[\w-]*$/m.test(text)) score += 5            // Fenced code block
  if (/\[.+?\]\(.+?\)/.test(text)) score += 4          // Link
  if (/!\[.*?\]\(.+?\)/.test(text)) score += 5         // Image
  if (/^\|.+\|$/m.test(text) &&
      /^\|[-:\s|]+\|$/m.test(text)) score += 5         // Table
  if (/^>\s*\[!(NOTE|TIP|WARNING|CAUTION|IMPORTANT)\]/mi.test(text)) score += 5
  if (/^[-*]\s+\[[ x]\]/m.test(text)) score += 4      // Task list

  // Medium confidence (2 pts each)
  if (/\*\*.+?\*\*/.test(text)) score += 2             // Bold
  if (/(?<!\*)\*(?!\*)(?!\s).+?(?<!\s)(?<!\*)\*(?!\*)/.test(text)) score += 1
  if (/^[-*+]\s+\S/m.test(text)) score += 1            // Unordered list
  if (/^\d+\.\s+\S/m.test(text)) score += 1            // Ordered list
  if (/^>\s+\S/m.test(text)) score += 1                // Blockquote
  if (/`.+?`/.test(text)) score += 1                    // Inline code
  if (/^[-*_]{3,}$/m.test(text)) score += 2            // Horizontal rule

  // Structural signals
  const paragraphs = text.split(/\n{2,}/).filter(Boolean)
  if (paragraphs.length >= 3) score += 2               // Multi-paragraph

  // Negative signals
  if (text.length < 20) score -= 3
  if (!text.includes('\n')) score -= 2

  return score >= 5
}
```

### Step 4: Markdown → Lexical Node Conversion

Use a temp editor to convert markdown, then serialize → deserialize into the real editor:

```typescript
import { createEditor, $parseSerializedNode, $insertNodes } from 'lexical'
import { $convertFromMarkdownString } from '@lexical/markdown'
import { getResolvedEditNodes } from '../node-registry'
import { ALL_TRANSFORMERS } from '../transformers'

function convertAndInsert(editor: LexicalEditor, markdown: string): void {
  // Create temp editor with same node types
  const tempEditor = createEditor({
    namespace: 'markdown-paste-temp',
    nodes: getResolvedEditNodes(),
    onError: () => {},
  })

  // Synchronous conversion in temp editor
  tempEditor.update(
    () => { $convertFromMarkdownString(markdown, ALL_TRANSFORMERS) },
    { discrete: true },
  )

  // Serialize nodes from temp editor
  const serializedChildren = tempEditor.getEditorState().toJSON().root.children

  // Insert into real editor (already in editor.update context via PASTE_COMMAND)
  const nodes = serializedChildren.map((s) => $parseSerializedNode(s))
  $insertNodes(nodes)
}
```

Key: `{ discrete: true }` makes `tempEditor.update()` synchronous. `$parseSerializedNode` runs in the real editor's context, so nodes are properly registered.

### Step 5: Plugin Component

```typescript
export function MarkdownPastePlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        const clipboardData = 'clipboardData' in event
          ? (event as ClipboardEvent).clipboardData
          : null
        if (!clipboardData) return false

        // 1. VS Code paste → code block(s), split by 2+ blank lines
        const vscodeData = getVSCodePasteData(clipboardData)
        if (vscodeData) {
          const code = clipboardData.getData('text/plain')
          if (code) {
            const segments = code.split(/\n{3,}/).filter(Boolean)
            const nodes = segments.map((s) =>
              $createCodeBlockEditNode(s.trim(), vscodeData.language)
            )
            $insertNodes(nodes)
            return true
          }
        }

        // 2. Rich HTML → let Lexical handle
        if (hasRichHTML(clipboardData)) return false

        // 3. Markdown detection
        const text = clipboardData.getData('text/plain')
        if (!text || !detectMarkdown(text)) return false

        // 4. Convert and insert
        event.preventDefault()
        convertAndInsert(editor, text)
        return true
      },
      COMMAND_PRIORITY_HIGH,
    )
  }, [editor])

  return null
}
```

### Step 6: Mount in RichEditor

In `RichEditor.tsx`, add after `MarkdownShortcutsPlugin`:

```tsx
<MarkdownPastePlugin />
```

### Step 7: Export from plugins/index.ts

```typescript
export { MarkdownPastePlugin } from './MarkdownPastePlugin'
```

## Edge Cases Handled

| Case | Behavior |
|------|----------|
| VS Code paste | `vscode-editor-data` type → CodeBlock(s) with language, split by 2+ blank lines |
| Rich HTML (browser copy) | Skip, let Lexical HTML paste handle |
| VS Code HTML (syntax spans) | `data-vscode` marker → skip HTML, fall through to VS Code handler |
| Markdown text | Score >= 5 → convert via `$convertFromMarkdownString` |
| Plain text (not markdown) | Score < 5 → default paste |
| Short text / single line | Negative scoring → unlikely to trigger |
| Multi-paragraph markdown | `\n\n` separation adds +2 to score |
| Undo | Lexical `HistoryPlugin` handles automatically |
| Paste into middle of content | `$insertNodes` handles cursor-position insertion |
| Empty editor paste | Same flow — `$insertNodes` works on empty root |

## Verification

1. `pnpm --filter @haklex/rich-editor-demo dev` — open dev playground
2. Paste markdown text (e.g., a GitHub README) → should render as rich nodes
3. Paste from VS Code → should create code block with correct language
4. Paste plain text (no markdown syntax) → should insert as plain text
5. Paste rich HTML from browser → should use Lexical's HTML paste (not markdown)
6. Ctrl+Z after markdown paste → should revert to state before paste
7. Paste markdown into middle of existing content → should insert at cursor
