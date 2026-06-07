'use client'
/**
 * ③ 生成剧本：先选「转换设置」（四维度，常驻可见），点开始生成 → 客户端逐章编排 + 进度条。
 * 转换/摘要走拆开的两个 API 端点；assemble/序列化在前端跑（纯函数）。已生成过不重跑。
 * UI 拆分：转换设置 → conversion-settings；进度/错误 → conversion-progress。
 *
 * @see docs/DAY3_PLAN.md · §2.C
 */
import { useRef, useState } from 'react'
import { useLibraryStore, useActiveWork, type WorkSettings } from '@/lib/store/project-store'
import { segment } from '@/lib/pipeline/segment'
import { assemble } from '@/lib/pipeline/assemble'
import { screenplayToYaml } from '@/lib/serialize'
import type { Unit } from '@/lib/schema'
import { BTN_PRIMARY, BTN_GHOST } from '@/components/brutal-ui'
import { ConversionSettings } from './conversion-settings'
import { ConversionProgress } from './conversion-progress'

export function Conversion() {
  const work = useActiveWork()
  const updateSettings = useLibraryStore((s) => s.updateSettings)
  const setYaml = useLibraryStore((s) => s.setYaml)
  const setStatus = useLibraryStore((s) => s.setStatus)
  const setStep = useLibraryStore((s) => s.setStep)
  const snapshot = useLibraryStore((s) => s.snapshot)
  const setConvertProgress = useLibraryStore((s) => s.setConvertProgress)
  const [done, setDone] = useState(0)
  const [total, setTotal] = useState(0)
  const [phase, setPhase] = useState<'settings' | 'running' | 'error'>('settings')
  const [error, setError] = useState('')
  const runningRef = useRef(false) // 同步护栏：挡住双击/重入并发跑两遍

  if (!work) return null

  const alreadyDone = !!work.currentYaml && work.status === 'done'

  async function run() {
    if (runningRef.current) return
    const bible = work!.bible
    if (!bible) {
      setError('还没有设定，请先回到「导入小说」完成解析并确认设定。')
      setPhase('error')
      return
    }
    runningRef.current = true
    const settings = work!.settings
    const chapters = segment(work!.novel)
    const sig = jobSig(work!.novel, chapters.length, settings)
    // 断点续跑：仅当指纹一致（同一小说+设置）才复用上次已完成的章
    const prior = work!.convert && work!.convert.sig === sig ? work!.convert : undefined
    const units: Unit[] = prior ? [...prior.units] : []
    let runningSummary = prior?.runningSummary ?? ''
    const startIdx = units.length
    setTotal(chapters.length)
    setDone(startIdx)
    setPhase('running')
    setError('')
    setStatus('converting')
    try {
      for (let i = startIdx; i < chapters.length; i++) {
        const chapter = chapters[i]
        try {
          const cData = await post('/api/convert-chapter', { chapter, bible, runningSummary, settings })
          units.push(cData.unit)
          setDone(i + 1)
          if (i < chapters.length - 1) {
            const sData = await post('/api/update-summary', { prevSummary: runningSummary, chapter })
            runningSummary = sData.summary
          }
          // 落断点：本章（含其摘要）已稳；中途失败可从下一章续跑，不丢前面的成果
          setConvertProgress({ sig, units: [...units], runningSummary })
        } catch (e) {
          throw new Error(`第 ${chapter.index} 章处理失败：${e instanceof Error ? e.message : String(e)}`)
        }
      }
      const meta = {
        title: work!.title,
        genre: [] as string[],
        language: 'zh',
        source: { chapter_count: chapters.length },
      }
      const { screenplay } = assemble({ bible, units, meta })
      setYaml(screenplayToYaml(screenplay))
      snapshot({ label: '转换完成 v1', origin: 'convert', valid: true })
      setConvertProgress(undefined) // 成功 → 清断点
      setStatus('done')
      setStep('editor')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setPhase('error')
      setStatus('error')
    } finally {
      runningRef.current = false
    }
  }

  // 已生成过（重访本步）
  if (alreadyDone && phase === 'settings') {
    return (
      <section className="space-y-5 py-8 text-center">
        <p className="font-heading text-xl font-black">这部作品已经生成过剧本</p>
        <div className="flex justify-center gap-3">
          <button onClick={() => setStep('editor')} className={BTN_PRIMARY}>
            查看 / 编辑 →
          </button>
          <button
            onClick={() => {
              if (confirm('重新生成会覆盖当前剧本（旧版本仍在版本列表里），确定？')) void run()
            }}
            className={BTN_GHOST}
          >
            重新生成
          </button>
        </div>
      </section>
    )
  }

  // 转换设置：常驻可见（无设定时仅禁用「开始生成」）
  if (phase === 'settings') {
    // 有匹配的断点 → 提示可续跑
    const chs = work.bible ? segment(work.novel) : []
    const resumable =
      !!work.convert &&
      work.convert.sig === jobSig(work.novel, chs.length, work.settings) &&
      work.convert.units.length > 0 &&
      work.convert.units.length < chs.length
    return (
      <ConversionSettings
        settings={work.settings}
        onChange={updateSettings}
        canGenerate={!!work.bible}
        onGenerate={() => void run()}
        onGoImport={() => setStep('input')}
        resume={resumable ? { done: work.convert!.units.length, total: chs.length } : undefined}
      />
    )
  }

  return (
    <ConversionProgress
      phase={phase}
      done={done}
      total={total}
      error={error}
      onRetry={() => void run()}
      onBack={() => setPhase('settings')}
    />
  )
}

/** job 指纹：小说长度 + 章数 + ②④①设置（含自由改编 brief）。变了就不复用旧断点。 */
function jobSig(novel: string, chapterCount: number, s: WorkSettings): string {
  return `${novel.length}:${chapterCount}:${s.lengthForm}:${s.adaptationMode}:${s.style}:${s.adaptationBrief ?? ''}`
}

async function post(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `${url} 请求失败`)
  return data
}
