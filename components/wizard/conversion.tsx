'use client'
/**
 * ③ Conversion（前端）：按 ②体量 + ④改编自由度 逐章转换 + 实时进度条。
 * 客户端编排：逐章串行请求 /api/convert-chapter（每章带上一章摘要 + 设置，不可并行）。
 * 整本跑通后自动打首个版本快照「转换完成 v1」。
 *
 * @see docs/DEVELOPMENT_PLAN.md · Day 3 · 版本管理
 */
import { useLibraryStore, useActiveWork } from '@/lib/store/project-store'

export function Conversion() {
  const work = useActiveWork()
  const snapshot = useLibraryStore((s) => s.snapshot)
  const setStatus = useLibraryStore((s) => s.setStatus)
  void snapshot // TODO(Day3): 跑完 → setStatus('done') + snapshot({ label: '转换完成 v1', origin: 'convert', valid: true })
  void setStatus
  if (!work) return null

  // TODO(Day3): 逐章 fetch /api/convert-chapter（注入 work.settings）→ 进度条 → assemble → setYaml
  return (
    <section data-step="conversion">
      <h2 className="font-semibold">③ 逐章转换</h2>
    </section>
  )
}
