/**
 * 滚动摘要(workflow step):转完一章压缩"到目前为止发生了什么",传给下一章。
 * 章节间一致性的关键依赖 —— 逐章串行,不可并行。
 *
 * @see docs/DEVELOPMENT_PLAN.md · Day 2
 */
import type { Chapter } from '@/lib/pipeline/segment'

export async function updateSummary(_args: {
  prevSummary: string
  chapter: Chapter
}): Promise<string> {
  // TODO(Day2)
  throw new Error('updateSummary: not implemented')
}
