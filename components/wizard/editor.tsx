'use client'
/**
 * ④ Editor（前端）：CodeMirror YAML 编辑 + 实时 Zod 校验
 * + ①制式实时切换（招牌 demo）+ ③导出格式 + 版本快照/回滚（VersionPanel）。
 *
 * @see docs/DEVELOPMENT_PLAN.md · Day 3 · 四个维度 / 版本管理
 */
import { useLibraryStore, useActiveWork, type ExportFormat } from '@/lib/store/project-store'
import { VersionPanel } from '@/components/wizard/version-panel'

export function Editor() {
  const work = useActiveWork()
  const setYaml = useLibraryStore((s) => s.setYaml)
  const updateSettings = useLibraryStore((s) => s.updateSettings)
  if (!work) return null

  // TODO(Day3): CodeMirror(work.currentYaml) + 实时 schema 校验
  const exportFormats: { v: ExportFormat; label: string; disabled?: boolean }[] = [
    { v: 'yaml', label: 'YAML' },
    { v: 'text', label: '纯文本' },
    { v: 'pdf', label: 'PDF（v2）', disabled: true },
  ]

  return (
    <section data-step="editor" className="flex gap-4">
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-3 text-sm">
          {/* ① 制式实时切换：纯渲染，数据不动 */}
          <span>制式</span>
          <button
            data-active={work.settings.style === 'cn-standard'}
            onClick={() => updateSettings({ style: 'cn-standard' })}
            className="rounded border px-2 py-0.5 data-[active=true]:bg-foreground data-[active=true]:text-background"
          >
            中式
          </button>
          <button
            data-active={work.settings.style === 'hollywood'}
            onClick={() => updateSettings({ style: 'hollywood' })}
            className="rounded border px-2 py-0.5 data-[active=true]:bg-foreground data-[active=true]:text-background"
          >
            好莱坞
          </button>
        </div>

        <textarea
          className="h-72 w-full rounded border p-2 font-mono text-sm"
          value={work.currentYaml}
          onChange={(e) => setYaml(e.target.value)}
          placeholder="转换后的剧本 YAML 出现在这里…"
        />

        {/* ③ 导出格式 */}
        <div className="flex items-center gap-2 text-sm">
          <span>导出</span>
          {exportFormats.map((f) => (
            <button
              key={f.v}
              disabled={f.disabled}
              className="rounded border px-2 py-0.5 disabled:opacity-40"
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <VersionPanel />
    </section>
  )
}
