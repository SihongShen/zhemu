/**
 * 后端入口(薄路由层):POST 小说 → 抽出的 Bible(流式)。
 * 只做 IO 与鉴权边界,业务逻辑下沉到 lib/pipeline。key 只在此服务端用。
 *
 * @see docs/DEVELOPMENT_PLAN.md · Day 3
 */
// import { extractBible } from '@/lib/pipeline/extract-bible'

export const runtime = 'nodejs'

export async function POST(_req: Request): Promise<Response> {
  // TODO(Day3): 读 novel → extractBible → 流式返回
  return new Response('not implemented', { status: 501 })
}
