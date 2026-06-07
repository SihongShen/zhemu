'use client'
/**
 * ② 确认设定：展示 AI 从小说反推的「世界观 / 人物 / 大纲」，可轻量修改后确认 → 进转换。
 * 人在环检查点。内部仍是 bible 数据，但界面不出现"Bible/故事圣经"字样。
 * 卡片已拆到 bible-cards.tsx。
 */
import { useState } from 'react'
import { useLibraryStore, useActiveWork } from '@/lib/store/project-store'
import type { Bible } from '@/lib/schema'
import { BTN_PRIMARY, BTN_GHOST, TAG } from '@/components/brutal-ui'
import { WorldCard, CharacterCard, OutlineCard } from './bible-cards'

export function BibleEditor() {
  const work = useActiveWork()
  const setBible = useLibraryStore((s) => s.setBible)
  const setStep = useLibraryStore((s) => s.setStep)
  const [draft, setDraft] = useState<Bible | null>(work?.bible ?? null)

  if (!work) return null
  if (!draft) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-muted-foreground">还没有设定，请先回到第一步导入小说。</p>
        <button onClick={() => setStep('input')} className={BTN_GHOST}>
          ← 返回导入
        </button>
      </section>
    )
  }

  const patchWorld = (summary: string) => setDraft({ ...draft, world: { ...draft.world, summary } })
  const patchChar = (i: number, key: 'name' | 'description', val: string) =>
    setDraft({
      ...draft,
      characters: draft.characters.map((c, j) => (j === i ? { ...c, [key]: val } : c)),
    })

  function confirm() {
    setBible(draft!)
    setStep('conversion')
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-black tracking-tight">确认设定</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          AI 从小说里梳理出以下设定。确认或修改后开始生成剧本——这些是跨章一致性的依据。
        </p>
      </div>

      <WorldCard world={draft.world} onChange={patchWorld} />

      <div className="space-y-3 border-2 border-foreground bg-card p-5 shadow-brutal">
        <span className={TAG}>人物 · {draft.characters.length}</span>
        <div className="space-y-3">
          {draft.characters.map((c, i) => (
            <CharacterCard key={c.id} character={c} onPatch={(key, val) => patchChar(i, key, val)} />
          ))}
        </div>
      </div>

      <OutlineCard outline={draft.outline} />

      <div className="flex items-center gap-3">
        <button onClick={() => setStep('input')} className={BTN_GHOST}>
          ← 返回
        </button>
        <button onClick={confirm} className={BTN_PRIMARY}>
          确认设定 →
        </button>
      </div>
    </section>
  )
}
