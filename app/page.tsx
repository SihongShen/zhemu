'use client'
/**
 * 四步向导外壳(前端)。单页切换,步骤状态存 Zustand。
 *
 * @see docs/DEVELOPMENT_PLAN.md · Day 3
 */
import { useProjectStore, type WizardStep } from '@/lib/store/project-store'
import { NovelInput } from '@/components/wizard/novel-input'
import { BibleEditor } from '@/components/wizard/bible-editor'
import { Conversion } from '@/components/wizard/conversion'
import { Editor } from '@/components/wizard/editor'

const STEPS: { key: WizardStep; label: string }[] = [
  { key: 'input', label: '① 输入小说' },
  { key: 'bible', label: '② 确认 Bible' },
  { key: 'conversion', label: '③ 逐章转换' },
  { key: 'editor', label: '④ 编辑 / 导出' },
]

export default function Home() {
  const step = useProjectStore((s) => s.step)
  const setStep = useProjectStore((s) => s.setStep)

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-6 text-2xl font-bold">折幕 · 小说转结构化剧本</h1>

      <nav className="mb-8 flex gap-2">
        {STEPS.map((s) => (
          <button
            key={s.key}
            onClick={() => setStep(s.key)}
            data-active={step === s.key}
            className="rounded border px-3 py-1 text-sm data-[active=true]:bg-foreground data-[active=true]:text-background"
          >
            {s.label}
          </button>
        ))}
      </nav>

      {step === 'input' && <NovelInput />}
      {step === 'bible' && <BibleEditor />}
      {step === 'conversion' && <Conversion />}
      {step === 'editor' && <Editor />}
    </main>
  )
}
