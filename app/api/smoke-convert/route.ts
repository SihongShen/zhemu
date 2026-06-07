/**
 * Day 2 整本转换的冒烟 / 演示端点：小说 → 合法 Screenplay → YAML + 双制式渲染。
 *
 * - **本地 dev**：实时跑整本转换（extractBible + 逐章 convert + 摘要，较慢，~分钟级）。
 * - **线上 production**：返回**预生成 mock**（demo-screenplay.json 渲染），**不触发 LLM**，
 *   避免这个公开端点被反复请求无限刷 API / 刷额度。
 * - 实时测试另走 dev（或自建私有端点），不放公开。
 *
 * @see docs/DAY2_PLAN.md · §3  /  docs/DAY3_PLAN.md · §2.B
 */
import { NextResponse } from 'next/server'
import { Screenplay } from '@/lib/schema'
import type { LengthForm, AdaptationMode } from '@/lib/store/project-store'
import { extractBible } from '@/lib/pipeline/extract-bible'
import { runConversion } from '@/lib/pipeline/run'
import { screenplayToYaml } from '@/lib/serialize'
import { renderCnStandard } from '@/lib/render/cn-standard'
import { renderHollywood } from '@/lib/render/hollywood'
import { SAMPLE_NOVEL } from './sample-novel'
import demoScreenplay from './demo-screenplay.json'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** 从一份 screenplay 组装响应（checks + yaml + 双制式渲染），不依赖运行时 report。 */
function buildResponse(screenplay: Screenplay, mode: 'live' | 'mock', yaml?: string) {
  const ids = new Set(screenplay.bible.characters.map((c) => c.id))
  const used = new Set<string>()
  const dangling: string[] = []
  const flaggedScenes: string[] = []
  let sceneCount = 0

  for (const u of screenplay.script) {
    for (const s of u.scenes) {
      sceneCount++
      if (s.needs_review) flaggedScenes.push(s.id)
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
  // 回填角色可从 char_unknown 前缀的 id 反推
  const backfilled = screenplay.bible.characters.filter((c) => c.id.startsWith('char_unknown')).map((c) => c.id)

  return {
    ok: dangling.length === 0,
    mode,
    checks: {
      chapterCount: screenplay.script.length,
      sceneCount,
      characterCount: ids.size,
      refIntegrity: dangling.length === 0,
      danglingRefs: dangling,
      backfilled,
      flaggedScenes,
      charsUsedAcrossChapters: used.size,
    },
    yaml: yaml ?? screenplayToYaml(screenplay),
    render: { cnStandard: renderCnStandard(screenplay), hollywood: renderHollywood(screenplay) },
    screenplay,
  }
}

export async function GET(req: Request) {
  // 线上：返回预生成 mock，不调 LLM
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(buildResponse(demoScreenplay as unknown as Screenplay, 'mock'))
  }

  // 本地 dev：实时跑。可选 ?length=feature|short|series 切体量、?mode=faithful|balanced|free 切改编自由度。
  if (!process.env.LLM_API_KEY) {
    return NextResponse.json({ ok: false, error: '未配置 LLM_API_KEY' }, { status: 500 })
  }
  const sp = new URL(req.url).searchParams
  const lp = sp.get('length')
  const mp = sp.get('mode')
  const lengthForm: LengthForm = (['feature', 'short', 'series'] as const).includes(lp as never)
    ? (lp as LengthForm)
    : 'feature'
  const adaptationMode: AdaptationMode = (['faithful', 'balanced', 'free'] as const).includes(mp as never)
    ? (mp as AdaptationMode)
    : 'balanced'
  // ?brief= 仅 free 档生效（prompt 里 free 才读 brief），限 500 字
  const adaptationBrief = sp.get('brief')?.slice(0, 500) || undefined
  try {
    const bible = await extractBible(SAMPLE_NOVEL)
    const { screenplay, yaml } = await runConversion({
      novel: SAMPLE_NOVEL,
      bible,
      settings: { lengthForm, adaptationMode, style: 'cn-standard', adaptationBrief },
      title: '雾港',
    })
    Screenplay.parse(screenplay)
    return NextResponse.json(buildResponse(screenplay, 'live', yaml))
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
