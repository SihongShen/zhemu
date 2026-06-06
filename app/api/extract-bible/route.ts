/**
 * 后端入口（薄路由层）：POST 小说（+可选设定文档）→ 抽出的 Bible。
 * 只做 IO 与边界校验，业务逻辑在 lib/pipeline。key 只在此服务端用。
 *
 * @see docs/DAY3_PLAN.md · §2.A
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { extractBible } from '@/lib/pipeline/extract-bible'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ReqSchema = z.object({
  novel: z.string().min(1, '小说正文不能为空'),
  bibleDoc: z.string().optional(),
})

export async function POST(req: Request) {
  if (!process.env.LLM_API_KEY) {
    return NextResponse.json({ error: '服务端未配置 LLM_API_KEY' }, { status: 500 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '请求体不是合法 JSON' }, { status: 400 })
  }

  const parsed = ReqSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '参数校验失败', issues: parsed.error.issues }, { status: 400 })
  }

  try {
    const bible = await extractBible(parsed.data.novel, { bibleDoc: parsed.data.bibleDoc })
    return NextResponse.json({ bible })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
