/**
 * 后端入口（薄路由层）：POST 单章 → 该章 Unit（场景）。
 * 客户端逐章串行调用，每章带上一章的滚动摘要作前情。
 * **只转单章**；滚动摘要由 /api/update-summary 单独负责——拆开各自稳在 serverless 60s 内。
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Bible } from '@/lib/schema'
import { ChapterReq, SettingsReq, SUMMARY_MAX, firstFriendlyError } from '@/lib/api-schema'
import { convertChapter } from '@/lib/pipeline/convert-chapter'
import { checkRateLimit, clientIp } from '@/lib/llm/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ReqSchema = z.object({
  chapter: ChapterReq,
  bible: Bible, // 复用业务 schema 校验客户端传来的 bible（含 id 唯一性）
  runningSummary: z.string().max(SUMMARY_MAX).default(''),
  settings: SettingsReq,
})

export async function POST(req: Request) {
  if (!process.env.LLM_API_KEY) {
    return NextResponse.json({ error: '服务端未配置 LLM_API_KEY' }, { status: 500 })
  }

  const rl = checkRateLimit(clientIp(req))
  if (!rl.ok) {
    return NextResponse.json(
      { error: rl.error },
      { status: rl.status, headers: rl.retryAfter ? { 'retry-after': String(rl.retryAfter) } : undefined },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '请求体不是合法 JSON' }, { status: 400 })
  }

  const parsed = ReqSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: firstFriendlyError(parsed.error), issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const { chapter, bible, runningSummary, settings } = parsed.data

  try {
    const unit = await convertChapter({ chapter, bible, runningSummary, settings })
    return NextResponse.json({ unit })
  } catch (err) {
    console.error('[convert-chapter]', err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'production' ? '转换失败，请稍后重试' : msg },
      { status: 500 },
    )
  }
}
