'use client'
/**
 * VersionPanel（前端）：版本管理侧栏（作用于当前作品）。
 * 列出快照（label + 红/绿校验点），点击回滚；手动「存为快照」。
 * 线性快照，不做版本树/diff（留 v1）。
 *
 * @see docs/DEVELOPMENT_PLAN.md · 版本管理（最小落地）
 */
import { useLibraryStore, useActiveWork } from '@/lib/store/project-store'

export function VersionPanel() {
  const work = useActiveWork()
  const rollback = useLibraryStore((s) => s.rollback)
  const snapshot = useLibraryStore((s) => s.snapshot)
  if (!work) return null

  return (
    <aside className="w-56 shrink-0" data-panel="versions">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">版本</h3>
        <button
          className="text-sm"
          onClick={() => snapshot({ label: '手动保存', origin: 'edit', valid: false })}
        >
          存为快照
        </button>
      </div>
      <ul className="mt-2 space-y-1">
        {work.snapshots
          .slice()
          .reverse()
          .map((s) => (
            <li key={s.id}>
              <button className="text-left text-sm" onClick={() => rollback(s.id)}>
                <span data-valid={s.valid}>{s.valid ? '🟢' : '🔴'}</span> {s.label}
              </button>
            </li>
          ))}
      </ul>
    </aside>
  )
}
