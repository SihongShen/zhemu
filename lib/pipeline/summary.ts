/**
 * 滚动摘要更新（workflow step）：转完一章压缩"到目前为止发生了什么"，传给下一章。
 * 章节间一致性的关键依赖 —— 逐章串行，不可并行。
 */
import type { Chapter } from '@/lib/pipeline/segment'
import { callText } from '@/lib/llm/client'
import { summarySystem, summaryUser } from '@/lib/llm/prompts'
import { SUMMARY_MAX } from '@/lib/api-schema'

export async function updateSummary(args: {
  prevSummary: string
  chapter: Chapter
}): Promise<string> {
  const text = await callText({
    system: summarySystem,
    user: summaryUser(args.prevSummary, args.chapter.text),
  })
  // 生成端硬截断：prompt 只软性要求 800 字，若模型漂长，挡住它超过路由入参上限导致后续章节 400
  return text.trim().slice(0, SUMMARY_MAX)
}
