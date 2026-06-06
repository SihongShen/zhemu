/**
 * CodeMirror 雾港同色系主题：行号槽 / 高亮行 / 光标 / 选区。
 * 全部用 CSS 变量 hsl(var(--…))，自动随 .dark 切换；野兽派直角 + 2px 槽边线。
 */
import { EditorView } from '@uiw/react-codemirror'

export const zhemuCmTheme = EditorView.theme({
  '&': {
    backgroundColor: 'hsl(var(--card))',
    color: 'hsl(var(--foreground))',
    fontSize: '13px',
  },
  '.cm-content': {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    caretColor: 'hsl(var(--foreground))',
  },
  '&.cm-focused': { outline: 'none' },
  // 行号槽：副色底 + 墨色右边线（与外框呼应）
  '.cm-gutters': {
    backgroundColor: 'hsl(var(--secondary))',
    color: 'hsl(var(--muted-foreground))',
    border: 'none',
    borderRight: '2px solid hsl(var(--foreground))',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'hsl(var(--accent))',
    color: 'hsl(var(--accent-foreground))',
    fontWeight: '700',
  },
  // 高亮当前行：accent 半透明
  '.cm-activeLine': {
    backgroundColor: 'hsl(var(--accent) / 0.45)',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'hsl(var(--foreground))',
    borderLeftWidth: '2px',
  },
  // 选区：主色半透明
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'hsl(var(--primary) / 0.25)',
  },
  '.cm-selectionMatch': {
    backgroundColor: 'hsl(var(--primary) / 0.18)',
  },
  '.cm-foldGutter span': {
    color: 'hsl(var(--muted-foreground))',
  },
  '.cm-scroller': { lineHeight: '1.6' },
})
