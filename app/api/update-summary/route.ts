/**
 * 后端入口（薄路由层）：POST 上一版摘要 + 一章 → 更新后的滚动摘要。
 * 与 /api/convert-chapter 拆开：转换一章后客户端再调本端点更新摘要，给下一章用。
 * 拆开让单次调用各自稳在 serverless 60s 内（避免 convert+summary 合并撞线）。
 *
 * @see docs/DAY3_PLAN.md · §2.A
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ChapterReq, SUMMARY_MAX } from '@/lib/api-schema'
import { updateSummary } from '@/lib/pipeline/summary'
import { checkRateLimit, clientIp } from '@/lib/llm/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ReqSchema = z.object({
  prevSummary: z.string().max(SUMMARY_MAX).default(''),
  chapter: ChapterReq,
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
      { error: parsed.error.issues[0]?.message ?? '参数校验失败', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const { prevSummary, chapter } = parsed.data

  try {
    const summary = await updateSummary({ prevSummary, chapter })
    return NextResponse.json({ summary })
  } catch (err) {
    console.error('[update-summary]', err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'production' ? '摘要生成失败，请稍后重试' : msg },
      { status: 500 },
    )
  }
}
