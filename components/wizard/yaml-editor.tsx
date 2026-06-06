'use client'
/**
 * CodeMirror YAML 编辑器。被 editor.tsx 用 next/dynamic(ssr:false) 加载，
 * 把所有 CodeMirror 相关 import 隔离在客户端，避免 SSR 报 window is not defined。
 *
 * @see docs/DAY3_PLAN.md · §2.D
 */
import CodeMirror from '@uiw/react-codemirror'
import { yaml } from '@codemirror/lang-yaml'
import { zhemuCmTheme } from './codemirror-theme'

export default function YamlEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <CodeMirror
      value={value}
      height="60vh"
      theme={zhemuCmTheme}
      extensions={[yaml()]}
      onChange={onChange}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
      }}
    />
  )
}
