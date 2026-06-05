'use client'
/**
 * 入口（前端）。无活动作品 → 作品库（多作品管理）；有 → 四步向导外壳。
 * 步骤/作品态存 Zustand（持久化到 IndexedDB）。
 *
 * @see docs/DEVELOPMENT_PLAN.md · Day 3
 */
import { useLibraryStore, useActiveWork, type WizardStep } from '@/lib/store/project-store'
import { NovelInput } from '@/components/wizard/novel-input'
import { BibleEditor } from '@/components/wizard/bible-editor'
import { Conversion } from '@/components/wizard/conversion'
import { Editor } from '@/components/wizard/editor'

const STEPS: { key: WizardStep; label: string }[] = [
  { key: 'input', label: '① 输入 / 设置' },
  { key: 'bible', label: '② 确认 Bible' },
  { key: 'conversion', label: '③ 逐章转换' },
  { key: 'editor', label: '④ 编辑 / 导出' },
]

export default function Home() {
  const activeWork = useActiveWork()
  const step = useLibraryStore((s) => s.step)
  const setStep = useLibraryStore((s) => s.setStep)
  const createWork = useLibraryStore((s) => s.createWork)
  const openWork = useLibraryStore((s) => s.openWork)
  const closeWork = useLibraryStore((s) => s.closeWork)
  const listWorks = useLibraryStore((s) => s.listWorks)

  // —— 作品库视图（多作品管理）——
  if (!activeWork) {
    const works = listWorks()
    return (
      <main className="mx-auto max-w-3xl p-8">
        <h1 className="mb-6 text-2xl font-bold">折幕 · 我的作品</h1>
        <button onClick={() => createWork()} className="mb-6 rounded border px-3 py-1 text-sm">
          + 新建作品
        </button>
        <ul className="space-y-2">
          {works.map((w) => (
            <li key={w.id}>
              <button
                onClick={() => openWork(w.id)}
                className="w-full rounded border px-3 py-2 text-left"
              >
                {w.title} <span className="text-sm opacity-60">· {w.status}</span>
              </button>
            </li>
          ))}
          {works.length === 0 && <li className="opacity-60">还没有作品，点上面新建。</li>}
        </ul>
      </main>
    )
  }

  // —— 单作品四步向导 ——
  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{activeWork.title}</h1>
        <button onClick={closeWork} className="text-sm opacity-60 hover:opacity-100">
          ← 作品库
        </button>
      </div>

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
