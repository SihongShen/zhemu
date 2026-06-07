/**
 * 后端入口（薄路由层）：POST 小说（+可选设定文档）→ 抽出的 Bible。
 * 只做 IO 与边界校验，业务逻辑在 lib/pipeline。key 只在此服务端用。
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { extractBible } from '@/lib/pipeline/extract-bible'
import { checkRateLimit, clientIp } from '@/lib/llm/rate-limit'
import { NOVEL_MAX, BIBLE_DOC_MAX, firstFriendlyError } from '@/lib/api-schema'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ReqSchema = z.object({
  novel: z
    .string()
    .min(1, '小说正文不能为空')
    .max(NOVEL_MAX, `小说过长（超 ${NOVEL_MAX / 10000} 万字），请拆分后分多部上传`),
  bibleDoc: z.string().max(BIBLE_DOC_MAX, '设定文档过长').optional(),
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

  try {
    const bible = await extractBible(parsed.data.novel, { bibleDoc: parsed.data.bibleDoc })
    return NextResponse.json({ bible })
  } catch (err) {
    console.error('[extract-bible]', err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'production' ? '抽取失败，请稍后重试' : msg },
      { status: 500 },
    )
  }
}
