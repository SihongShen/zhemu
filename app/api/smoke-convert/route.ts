/**
 * Day 2 冒烟测试：整本小说 → 合法 Screenplay → YAML。验「整本跑通」。
 * 仅本地 dev 可用（一次跑会触发 extractBible + 逐章 convert + 摘要，多次付费调用）。
 *
 * 跑法：`npm run dev` → http://localhost:3000/api/smoke-convert
 *
 * @see docs/DAY2_PLAN.md · §3
 */
import { NextResponse } from 'next/server'
import { Screenplay } from '@/lib/schema'
import { extractBible } from '@/lib/pipeline/extract-bible'
import { runConversion } from '@/lib/pipeline/run'
import { SAMPLE_NOVEL } from './sample-novel'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { ok: false, error: 'smoke-convert 仅本地 dev 可用（整本转换会触发多次付费调用）' },
      { status: 404 },
    )
  }
  if (!process.env.LLM_API_KEY) {
    return NextResponse.json({ ok: false, error: '未配置 LLM_API_KEY' }, { status: 500 })
  }

  try {
    const bible = await extractBible(SAMPLE_NOVEL)
    const { screenplay, yaml, report } = await runConversion({
      novel: SAMPLE_NOVEL,
      bible,
      settings: { lengthForm: 'feature', adaptationMode: 'balanced', style: 'cn-standard' },
      title: '雾港',
    })
    Screenplay.parse(screenplay) // schema 合法性，抛错即失败

    // 引用完整性 + 跨章一致性
    const ids = new Set(screenplay.bible.characters.map((c) => c.id))
    const used = new Set<string>()
    const dangling: string[] = []
    let sceneCount = 0
    for (const u of screenplay.script) {
      for (const s of u.scenes) {
        sceneCount++
        for (const cp of s.characters_present) {
          used.add(cp)
          if (!ids.has(cp)) dangling.push(cp)
        }
        for (const el of s.elements) {
          if (el.type === 'dialogue') {
            used.add(el.character)
            if (!ids.has(el.character)) dangling.push(el.character)
          }
        }
      }
    }

    return NextResponse.json({
      ok: dangling.length === 0,
      checks: {
        chapterCount: screenplay.script.length,
        sceneCount,
        characterCount: ids.size,
        refIntegrity: dangling.length === 0,
        danglingRefs: dangling,
        backfilled: report.backfilled,
        flaggedScenes: report.flaggedScenes,
        charsUsedAcrossChapters: used.size,
      },
      yaml,
      screenplay,
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
