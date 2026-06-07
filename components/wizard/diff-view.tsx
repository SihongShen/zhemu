'use client'
/**
 * 版本对比弹窗：两份 YAML 的行级 diff，统一视图 + 绿增/红删高亮 + 折叠未改动段。
 * 纯客户端，数据来自 lib/diff（无第三方依赖）。Esc / 点遮罩 / 关闭按钮均可退出。
 */
import { useEffect, useMemo } from 'react'
import { diffLines, collapseUnchanged, diffStat } from '@/lib/diff'

export function DiffView({
  oldText,
  newText,
  oldLabel,
  newLabel,
  onClose,
}: {
  oldText: string
  newText: string
  oldLabel: string
  newLabel: string
  onClose: () => void
}) {
  const { rows, stat } = useMemo(() => {
    const lines = diffLines(oldText, newText)
    return { rows: collapseUnchanged(lines), stat: diffStat(lines) }
  }, [oldText, newText])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const noDiff = stat.add === 0 && stat.del === 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} aria-hidden />
      <div className="relative flex max-h-[85vh] w-full max-w-4xl flex-col border-2 border-foreground bg-card shadow-brutal-lg">
        <div className="flex items-center gap-3 border-b-2 border-foreground px-4 py-3">
          <span className="font-heading text-lg font-black">版本对比</span>
          <span className="hidden truncate text-sm text-muted-foreground sm:inline">
            {oldLabel} → {newLabel}
          </span>
          <span className="ml-auto flex items-center gap-2 font-mono text-xs font-bold">
            <span className="text-emerald-600 dark:text-emerald-400">+{stat.add}</span>
            <span className="text-destructive">−{stat.del}</span>
          </span>
          <button
            onClick={onClose}
            className="border-2 border-foreground px-2.5 py-0.5 text-sm font-bold transition-colors hover:bg-accent"
          >
            关闭
          </button>
        </div>

        {noDiff ? (
          <div className="p-12 text-center text-sm text-muted-foreground">两个版本内容完全一致，无差异。</div>
        ) : (
          <div className="overflow-auto font-mono text-xs leading-relaxed">
            {rows.map((r, idx) => {
              if (r.type === 'gap') {
                return (
                  <div
                    key={idx}
                    className="select-none border-y border-border bg-muted px-3 py-1 text-center text-[11px] text-muted-foreground"
                  >
                    ⋯ {r.count} 行未改动 ⋯
                  </div>
                )
              }
              const bg =
                r.type === 'add' ? 'bg-emerald-500/10' : r.type === 'del' ? 'bg-destructive/10' : ''
              const sign = r.type === 'add' ? '+' : r.type === 'del' ? '−' : ''
              const signColor =
                r.type === 'add'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-destructive'
              const oldNo = r.type === 'add' ? '' : r.oldNo
              const newNo = r.type === 'del' ? '' : r.newNo
              return (
                <div key={idx} className={`flex ${bg}`}>
                  <span className="w-10 shrink-0 select-none border-r border-border px-1 text-right text-[11px] text-muted-foreground">
                    {oldNo}
                  </span>
                  <span className="w-10 shrink-0 select-none border-r border-border px-1 text-right text-[11px] text-muted-foreground">
                    {newNo}
                  </span>
                  <span className={`w-4 shrink-0 select-none text-center font-bold ${signColor}`}>{sign}</span>
                  <span className="whitespace-pre-wrap break-all px-2">{r.text || ' '}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
