'use client'
/**
 * 编辑器工具栏（从 editor.tsx 拆出）：YAML 合法状态徽章 + 制式切换 + 导出。
 */
import type { Style } from '@/lib/store/project-store'
import { BTN_GHOST_SM } from '@/components/brutal-ui'

export function EditorToolbar({
  valid,
  empty,
  style,
  onStyle,
  onExportYaml,
  onExportText,
}: {
  valid: boolean
  empty: boolean
  style: Style
  onStyle: (s: Style) => void
  onExportYaml: () => void
  onExportText: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-2 border-foreground bg-card px-4 py-2.5 shadow-brutal">
      <span
        className={`border-2 px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
          valid
            ? 'border-primary bg-primary text-primary-foreground'
            : empty
              ? 'border-foreground bg-muted text-muted-foreground'
              : 'border-destructive bg-destructive text-destructive-foreground'
        }`}
      >
        {valid ? 'YAML 合法' : empty ? '空白' : 'YAML 有误'}
      </span>

      <div className="ml-auto flex items-center gap-2">
        <div className="flex border-2 border-foreground text-sm font-bold">
          {(['cn-standard', 'hollywood'] as const).map((s, i) => (
            <button
              key={s}
              onClick={() => onStyle(s)}
              data-active={style === s}
              className={`px-3 py-1.5 transition-colors hover:bg-accent data-[active=true]:bg-foreground data-[active=true]:text-background ${
                i === 0 ? 'border-r-2 border-foreground' : ''
              }`}
            >
              {s === 'cn-standard' ? '中式' : '好莱坞'}
            </button>
          ))}
        </div>
        <button onClick={onExportYaml} className={BTN_GHOST_SM}>
          导出 YAML
        </button>
        <button disabled={!valid} onClick={onExportText} className={BTN_GHOST_SM}>
          导出纯文本
        </button>
      </div>
    </div>
  )
}
