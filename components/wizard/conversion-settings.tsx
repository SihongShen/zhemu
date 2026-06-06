'use client'
/**
 * 转换设置面板（生成剧本前）：四个正交维度的选择 / 占位。
 * 无论是否已有设定都常驻显示——没设定时设置仍可预先调好，仅「开始生成」禁用。
 * - 体量（电影 / 短剧·电视剧占位）
 * - 改编自由度（忠实 / 平衡 / 自由）
 * - 默认制式（中式 / 好莱坞，渲染期可切）
 * - 输出格式（占位：导出时选择）
 */
import type { WorkSettings } from '@/lib/store/project-store'
import { BTN_PRIMARY, BTN_GHOST, CARD } from '@/components/brutal-ui'

export function ConversionSettings({
  settings,
  onChange,
  canGenerate,
  onGenerate,
  onGoImport,
}: {
  settings: WorkSettings
  onChange: (patch: Partial<WorkSettings>) => void
  canGenerate: boolean
  onGenerate: () => void
  onGoImport: () => void
}) {
  return (
    <section className="space-y-6 py-4">
      <div>
        <h2 className="font-heading text-2xl font-black tracking-tight">生成剧本</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">这四项决定生成结果，确定后逐章生成。</p>
      </div>

      <div className={`${CARD} divide-y-2 divide-foreground`}>
        <Row n="①" label="体量" hint="剧本规模（短剧 / 电视剧开发中）">
          <Select
            value={settings.lengthForm}
            onChange={(v) => onChange({ lengthForm: v as never })}
            options={[
              { v: 'feature', t: '电影 / 标准长片' },
              { v: 'short', t: '短剧（开发中）', disabled: true },
              { v: 'series', t: '电视剧（开发中）', disabled: true },
            ]}
          />
        </Row>
        <Row n="②" label="改编自由度" hint="忠实还原 ↔ 大胆重构">
          <Select
            value={settings.adaptationMode}
            onChange={(v) => onChange({ adaptationMode: v as never })}
            options={[
              { v: 'faithful', t: '忠实原作' },
              { v: 'balanced', t: '平衡' },
              { v: 'free', t: '自由改编' },
            ]}
          />
        </Row>
        <Row n="③" label="默认制式" hint="渲染期还能随时切换">
          <Select
            value={settings.style}
            onChange={(v) => onChange({ style: v as never })}
            options={[
              { v: 'cn-standard', t: '中式' },
              { v: 'hollywood', t: '好莱坞' },
            ]}
          />
        </Row>
      </div>

      {canGenerate ? (
        <button onClick={onGenerate} className={BTN_PRIMARY}>
          开始生成 →
        </button>
      ) : (
        <div className="space-y-3">
          <p className="border-2 border-foreground bg-muted px-4 py-2.5 text-sm font-bold">
            先完成「导入小说 · 确认设定」才能生成——上面的设置可以先调好。
          </p>
          <button onClick={onGoImport} className={BTN_GHOST}>
            ← 去导入
          </button>
        </div>
      )}
    </section>
  )
}

function Row({
  n,
  label,
  hint,
  children,
}: {
  n: string
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div>
        <div className="flex items-center gap-2 text-sm font-bold">
          <span className="font-heading text-base font-black text-primary">{n}</span>
          {label}
        </div>
        {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
      </div>
      {children}
    </div>
  )
}

function Select({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  options: { v: string; t: string; disabled?: boolean }[]
  disabled?: boolean
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="min-w-44 border-2 border-foreground bg-background px-2 py-2 text-sm font-medium outline-none transition focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
    >
      {options.map((o) => (
        <option key={o.v} value={o.v} disabled={o.disabled}>
          {o.t}
        </option>
      ))}
    </select>
  )
}
