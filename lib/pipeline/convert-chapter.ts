/**
 * 单章转场景(workflow step · 核心)。注入封闭角色清单,禁止就地造 id。
 * bible 以服务端/会话态为准,按 projectId 取,不接客户端传入。
 *
 * @see docs/DEVELOPMENT_PLAN.md · Day 2
 */
import type { Bible, Unit } from '@/lib/schema'
import type { Chapter } from '@/lib/pipeline/segment'

export async function convertChapter(_args: {
  chapter: Chapter
  bible: Bible
  runningSummary: string
}): Promise<Unit> {
  // TODO(Day2): worldInfo + prompt → withRepair → Unit
  throw new Error('convertChapter: not implemented')
}
