'use client'
/**
 * VersionPanel(前端):版本管理侧栏。
 * 列出快照(时间 + label + 红/绿校验点),点击回滚;手动「存为快照」按钮。
 * 线性快照,不做版本树/diff(留 v1)。
 *
 * @see docs/DEVELOPMENT_PLAN.md · 版本管理(最小落地)
 */
import { useProjectStore } from '@/lib/store/project-store'

export function VersionPanel() {
  const snapshots = useProjectStore((s) => s.snapshots)
  const rollback = useProjectStore((s) => s.rollback)
  const snapshot = useProjectStore((s) => s.snapshot)

  return (
    <aside className="w-56 shrink-0" data-panel="versions">
      <div className="flex items-center justify-between">
        <h3>版本</h3>
        <button
          onClick={() => snapshot({ label: '手动保存', origin: 'edit', valid: false })}
        >
          存为快照
        </button>
      </div>
      <ul>
        {snapshots
          .slice()
          .reverse()
          .map((s) => (
            <li key={s.id}>
              <button onClick={() => rollback(s.id)}>
                <span data-valid={s.valid}>{s.valid ? '🟢' : '🔴'}</span> {s.label}
              </button>
            </li>
          ))}
      </ul>
    </aside>
  )
}
