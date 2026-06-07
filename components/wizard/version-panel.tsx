'use client'
/**
 * 版本面板（作用于当前作品）：存为版本 / 回滚 / 版本对比。线性快照，回滚前自动存防丢。
 * 对比有三条入口：
 *  - 顶部「与上一版对比」：最近一版 ↔ 当前编辑内容（最常用，一键）。
 *  - 行内 ⇄ 选「对比基准」，再点另一版 → 两个历史快照互比。
 *  - 选中基准后，工具栏「↔ 当前编辑」→ 该基准 ↔ 当前编辑内容。
 * 对比时统一按时间排序：早的作旧侧、晚的作新侧（当前编辑内容恒为最新）。
 *
 * @see docs/DAY3_PLAN.md · §2.D
 */
import { useState } from 'react'
import { useLibraryStore, useActiveWork, type Snapshot } from '@/lib/store/project-store'
import { DiffView } from './diff-view'

const ORIGIN_CN: Record<string, string> = { convert: '生成', edit: '手动', regen: '重生' }

type Endpoint = { label: string; yaml: string; time: number }
type Pair = { old: Endpoint; next: Endpoint }

export function VersionPanel({ valid }: { valid: boolean }) {
  const work = useActiveWork()
  const rollback = useLibraryStore((s) => s.rollback)
  const snapshot = useLibraryStore((s) => s.snapshot)
  const [baseId, setBaseId] = useState<string | null>(null)
  const [pair, setPair] = useState<Pair | null>(null)
  if (!work) return null

  const list = work.snapshots.slice().reverse() // 新 → 旧
  const newest = list[0]
  const base = baseId ? work.snapshots.find((s) => s.id === baseId) ?? null : null
  const current: Endpoint = { label: '当前编辑内容', yaml: work.currentYaml, time: Infinity }

  const snapEndpoint = (s: Snapshot): Endpoint => ({ label: s.label, yaml: s.yaml, time: s.createdAt })

  /** 按时间排出旧/新两侧后展示对比。 */
  const open = (a: Endpoint, b: Endpoint) =>
    setPair(a.time <= b.time ? { old: a, next: b } : { old: b, next: a })

  /** 行内 ⇄：无基准→设为基准；点自己→取消；点别的→与基准对比。 */
  const onPick = (s: Snapshot) => {
    if (!baseId) return setBaseId(s.id)
    if (baseId === s.id) return setBaseId(null)
    if (base) open(snapEndpoint(base), snapEndpoint(s))
    setBaseId(null)
  }

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
        <>
          {/* 对比工具栏：无基准→一键「与上一版对比」；有基准→提示 + 「↔ 当前编辑」 */}
          {base ? (
            <div className="mb-2 space-y-1.5 border-2 border-foreground bg-accent/40 p-2 text-xs">
              <p className="font-bold">
                基准：<span className="font-normal">{base.label}</span>
              </p>
              <p className="text-muted-foreground">点另一版互比，或：</p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    open(snapEndpoint(base), current)
                    setBaseId(null)
                  }}
                  className="border-2 border-foreground bg-background px-2 py-1 font-bold transition-colors hover:bg-accent"
                >
                  ↔ 当前编辑
                </button>
                <button
                  onClick={() => setBaseId(null)}
                  className="border-2 border-transparent px-2 py-1 font-bold text-muted-foreground transition-colors hover:text-foreground"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => open(snapEndpoint(newest), current)}
              className="mb-2 w-full border-2 border-foreground bg-background px-2 py-1.5 text-xs font-bold transition-colors hover:bg-accent"
            >
              ⇄ 与上一版对比
            </button>
          )}

          <ul className="space-y-1.5">
            {list.map((s) => {
              const isBase = baseId === s.id
              return (
                <li key={s.id} className="flex items-stretch gap-1">
                  <button
                    onClick={() => rollback(s.id)}
                    title="回滚到此版本（回滚前会自动存当前态）"
                    className="flex flex-1 items-center gap-2 border-2 border-transparent px-2 py-1.5 text-left text-sm font-medium transition-colors hover:border-foreground hover:bg-accent"
                  >
                    <span className={s.valid ? 'text-primary' : 'text-destructive'}>●</span>
                    <span className="truncate">{s.label}</span>
                    <span className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground">
                      {ORIGIN_CN[s.origin] ?? s.origin}
                    </span>
                  </button>
                  <button
                    onClick={() => onPick(s)}
                    title={isBase ? '取消对比基准' : base ? '与基准版本对比' : '设为对比基准'}
                    aria-label={isBase ? '取消对比基准' : base ? '与基准版本对比' : '设为对比基准'}
                    data-base={isBase}
                    className="shrink-0 border-2 border-transparent px-1.5 text-sm font-bold text-muted-foreground transition-colors hover:border-foreground hover:bg-accent hover:text-foreground data-[base=true]:border-foreground data-[base=true]:bg-foreground data-[base=true]:text-background"
                  >
                    ⇄
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {pair && (
        <DiffView
          oldText={pair.old.yaml}
          newText={pair.next.yaml}
          oldLabel={pair.old.label}
          newLabel={pair.next.label}
          onClose={() => setPair(null)}
        />
      )}
    </aside>
  )
}
