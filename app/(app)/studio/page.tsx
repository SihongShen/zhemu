'use client'
/**
 * 上传作品（/studio）：四步向导（导入 → 设定 → 生成 → 编辑导出）作为一个路由，步骤在内部切换。
 * 守卫：水合完成后若无活动作品，回 /works（避免直连空向导）。
 * UI 与主页统一：硬描边步骤条、Playfair、直角。
 */
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  useLibraryStore,
  useActiveWork,
  useHasHydrated,
  type WizardStep,
} from '@/lib/store/project-store'
import { NovelInput } from '@/components/wizard/novel-input'
import { BibleEditor } from '@/components/wizard/bible-editor'
import { Conversion } from '@/components/wizard/conversion'
import { Editor } from '@/components/wizard/editor'

const STEPS: { key: WizardStep; label: string }[] = [
  { key: 'input', label: '导入小说' },
  { key: 'bible', label: '确认设定' },
  { key: 'conversion', label: '生成剧本' },
  { key: 'editor', label: '编辑与导出' },
]

export default function StudioPage() {
  const router = useRouter()
  const hydrated = useHasHydrated()
  const activeWork = useActiveWork()
  const step = useLibraryStore((s) => s.step)
  const setStep = useLibraryStore((s) => s.setStep)

  // 水合后仍无活动作品 → 回作品库
  useEffect(() => {
    if (hydrated && !activeWork) router.replace('/works')
  }, [hydrated, activeWork, router])

  if (!hydrated || !activeWork) {
    return (
      <div className="px-4 py-10 sm:px-6">
        <div className="h-12 w-full max-w-md animate-pulse border-2 border-border bg-muted" />
      </div>
    )
  }

  const currentIdx = STEPS.findIndex((s) => s.key === step)

  return (
    <div className="px-4 py-10 sm:px-6">
      {/* 步骤条 */}
      <nav className="mb-10 flex items-center border-b-2 border-foreground pb-6">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex flex-1 items-center last:flex-none">
            <button onClick={() => setStep(s.key)} className="flex items-center gap-2.5">
              <span
                data-active={i === currentIdx}
                data-done={i < currentIdx}
                className="flex h-9 w-9 items-center justify-center border-2 border-foreground text-sm font-bold transition data-[active=true]:bg-foreground data-[active=true]:text-background data-[done=true]:bg-primary data-[done=true]:text-primary-foreground"
              >
                {i + 1}
              </span>
              <span className={`text-[15px] ${i === currentIdx ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && <div className="mx-4 h-0.5 flex-1 bg-foreground/30" />}
          </div>
        ))}
      </nav>

      {step === 'input' && <NovelInput />}
      {step === 'bible' && <BibleEditor />}
      {step === 'conversion' && <Conversion />}
      {step === 'editor' && <Editor />}
    </div>
  )
}
