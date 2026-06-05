/**
 * 后端入口(薄路由层):POST 单章 → 该章 Unit(场景)。
 * 客户端逐章串行调用(每章带上一章摘要)。调高 maxDuration 防超时。
 *
 * @see docs/DEVELOPMENT_PLAN.md · Day 2 / Day 3
 */
// import { convertChapter } from '@/lib/pipeline/convert-chapter'

export const runtime = 'nodejs'
export const maxDuration = 60 // 单章 LLM 调用可能较慢

export async function POST(_req: Request): Promise<Response> {
  // TODO(Day3): 读 { chapter, runningSummary, projectId } → convertChapter → 返回 Unit
  return new Response('not implemented', { status: 501 })
}
