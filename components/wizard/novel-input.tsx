'use client'
/**
 * ① 导入小说：两个拖拽上传区——「世界观 / 人设」（可选，作 grounding）+「小说正文」（必填）→ 抽取设定。
 * 转换设置（体量/改编自由度/制式）已移到 ③ 生成前。
 */
import { useState } from 'react'
import { useLibraryStore, useActiveWork } from '@/lib/store/project-store'
import { NOVEL_MAX, BIBLE_DOC_MAX } from '@/lib/api-schema'
import { Dropzone } from './dropzone'
import { BTN_PRIMARY } from '@/components/brutal-ui'

export function NovelInput() {
  const work = useActiveWork()
  const setNovel = useLibraryStore((s) => s.setNovel)
  const setBibleDoc = useLibraryStore((s) => s.setBibleDoc)
  const setBible = useLibraryStore((s) => s.setBible)
  const setStatus = useLibraryStore((s) => s.setStatus)
  const setStep = useLibraryStore((s) => s.setStep)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!work) return null

  async function startExtract() {
    if (!work!.novel.trim()) {
      setError('请先上传或粘贴小说正文')
      return
    }
    if (work!.novel.length > NOVEL_MAX) {
      setError(`小说约 ${Math.round(work!.novel.length / 10000)} 万字，超过上限 ${NOVEL_MAX / 10000} 万，请拆分后分多部上传`)
      return
    }
    if ((work!.bibleDoc?.length ?? 0) > BIBLE_DOC_MAX) {
      setError(`设定文档超过 ${BIBLE_DOC_MAX / 10000} 万字上限，请精简后再试`)
      return
    }
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/extract-bible', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ novel: work!.novel, bibleDoc: work!.bibleDoc || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '抽取失败')
      setBible(data.bible)
      setStatus('bible_ready')
      setStep('bible')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-8">
      <div>
        <h2 className="font-heading text-2xl font-black tracking-tight">导入小说</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">先丢进原文（可附设定文档），AI 会读完并反推人物与世界观。</p>
      </div>

      <Dropzone
        label="世界观 / 人设"
        optional
        hint="有就上传，AI 会以它为准（grounding）；没有则全靠小说反推"
        value={work.bibleDoc ?? ''}
        onChange={setBibleDoc}
      />

      <Dropzone
        label="小说正文"
        hint="3+ 章效果最好。支持 .txt / .md / .docx，可多选（按文件名顺序拼接）"
        value={work.novel}
        onChange={setNovel}
      />

      {error && (
        <p className="border-2 border-destructive bg-destructive/10 px-4 py-2 text-sm font-bold text-destructive">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button onClick={startExtract} disabled={busy} className={BTN_PRIMARY}>
          {busy ? '正在阅读小说，梳理人物与世界观…' : '开始解析 →'}
        </button>
      </div>
    </section>
  )
}
