/**
 * 滚动摘要更新（workflow step）：转完一章压缩"到目前为止发生了什么"，传给下一章。
 * 章节间一致性的关键依赖 —— 逐章串行，不可并行。
 *
 * @see docs/DAY2_PLAN.md · §2
 */
import type { Chapter } from '@/lib/pipeline/segment'
import { callText } from '@/lib/llm/client'
import { summarySystem, summaryUser } from '@/lib/llm/prompts'

export async function updateSummary(args: {
  prevSummary: string
  chapter: Chapter
}): Promise<string> {
  const text = await callText({
    system: summarySystem,
    user: summaryUser(args.prevSummary, args.chapter.text),
  })
  return text.trim()
}
