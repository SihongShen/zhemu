'use client'
/**
 * 版本面板（作用于当前作品）：存为版本 / 点击回滚。线性快照，回滚前自动存防丢。
 *
 * @see docs/DAY3_PLAN.md · §2.D
 */
import { useLibraryStore, useActiveWork } from '@/lib/store/project-store'

const ORIGIN_CN: Record<string, string> = { convert: '生成', edit: '手动', regen: '重生' }

export function VersionPanel({ valid }: { valid: boolean }) {
  const work = useActiveWork()
  const rollback = useLibraryStore((s) => s.rollback)
  const snapshot = useLibraryStore((s) => s.snapshot)
  if (!work) return null

  const list = work.snapshots.slice().reverse()

  return (
    <aside className="w-full shrink-0 border-2 border-foreground bg-card p-3 shadow-brutal xl:w-60">
      <div className="mb-3 flex items-center justify-between">
        <span className="border-2 border-foreground bg-background px-2.5 py-1 text-xs font-bold uppercase tracking-[0.16em]">
          版本
        </span>
        <button
          onClick={() => snapshot({ label: '手动保存', origin: 'edit', valid })}
          className="border-2 border-foreground bg-background px-2 py-1 text-xs font-bold transition-colors hover:bg-accent"
        >
          存为版本
        </button>
      </div>
      {list.length === 0 ? (
        <p className="text-xs text-muted-foreground">还没有版本。转换完成会自动存一个，编辑后可手动存。</p>
      ) : (
        <ul className="space-y-1.5">
          {list.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => rollback(s.id)}
                title="回滚到此版本（回滚前会自动存当前态）"
                className="flex w-full items-center gap-2 border-2 border-transparent px-2 py-1.5 text-left text-sm font-medium transition-colors hover:border-foreground hover:bg-accent"
              >
                <span className={s.valid ? 'text-primary' : 'text-destructive'}>●</span>
                <span className="truncate">{s.label}</span>
                <span className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground">
                  {ORIGIN_CN[s.origin] ?? s.origin}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
