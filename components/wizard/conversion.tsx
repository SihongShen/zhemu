'use client'
/**
 * ③ 生成剧本：先选「转换设置」（四维度，常驻可见），点开始生成 → 客户端逐章编排 + 进度条。
 * 转换/摘要走拆开的两个 API 端点；assemble/序列化在前端跑（纯函数）。已生成过不重跑。
 * UI 拆分：转换设置 → conversion-settings；进度/错误 → conversion-progress。
 */
import { useMemo, useRef, useState } from 'react'
import { useLibraryStore, useActiveWork, type WorkSettings } from '@/lib/store/project-store'
import { segment } from '@/lib/pipeline/segment'
import { assemble } from '@/lib/pipeline/assemble'
import { screenplayToYaml } from '@/lib/serialize'
import type { Unit, Bible } from '@/lib/schema'
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
  // 分章只随小说/设定变化重算，避免设置页每次渲染都对整本（最多 200 万字）跑一遍正则
  const chapters = useMemo(() => (work?.bible ? segment(work.novel) : []), [work?.novel, work?.bible])

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
    const sig = jobSig(work!.novel, bible, settings)
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
      const { screenplay, report } = assemble({ bible, units, meta })
      setYaml(screenplayToYaml(screenplay))
      const skipped = report.droppedChapters.length
      if (skipped) console.warn('[convert] 跳过无有效场景的章：', report.droppedChapters)
      snapshot({
        label: skipped ? `转换完成 v1（${skipped} 章无内容已跳过）` : '转换完成 v1',
        origin: 'convert',
        valid: true,
      })
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
    // 有匹配的断点 → 提示可续跑（chapters 已 memo，不再每次渲染重算）
    const resumable =
      !!work.convert &&
      work.convert.units.length > 0 &&
      work.convert.units.length < chapters.length &&
      work.convert.sig === jobSig(work.novel, work.bible, work.settings)
    return (
      <ConversionSettings
        settings={work.settings}
        onChange={updateSettings}
        canGenerate={!!work.bible}
        onGenerate={() => void run()}
        onGoImport={() => setStep('input')}
        resume={resumable ? { done: work.convert!.units.length, total: chapters.length } : undefined}
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

/** djb2 字符串哈希（够区分小说/设定内容；非加密用途）。 */
function hashStr(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

/**
 * job 指纹：小说**内容**哈希 + 设定（bible）哈希 + ②④①设置。任一变化都不复用旧断点。
 * 用内容哈希而非长度——避免"等长不同文/改写保持长度"误判为同一任务而续错章。
 */
function jobSig(novel: string, bible: Bible | undefined, s: WorkSettings): string {
  return [
    hashStr(novel),
    bible ? hashStr(JSON.stringify(bible)) : '-',
    s.lengthForm,
    s.adaptationMode,
    s.style,
    s.adaptationBrief ?? '',
  ].join(':')
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
