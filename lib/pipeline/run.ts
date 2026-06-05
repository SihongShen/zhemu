/**
 * 整本转换编排（测试 / 本地用）。逐章**串行**：convert → 更新摘要 → 下一章。
 * ⚠️ 串行不可并行（每章依赖上一章滚动摘要）。
 *
 * 注：生产环境 Day 3 把这个循环搬到客户端逐章请求 /api/convert-chapter，避免 serverless 超时；
 * 本 orchestrator 仅用于本地"整本跑通"验证。
 *
 * @see docs/DAY2_PLAN.md · §2
 */
import { type Bible, type Unit, type Screenplay, type Meta } from '@/lib/schema'
import type { WorkSettings } from '@/lib/store/project-store'
import { segment } from '@/lib/pipeline/segment'
import { convertChapter } from '@/lib/pipeline/convert-chapter'
import { updateSummary } from '@/lib/pipeline/summary'
import { assemble, type RefReport } from '@/lib/pipeline/assemble'
import { screenplayToYaml } from '@/lib/serialize'

export async function runConversion(args: {
  novel: string
  bible: Bible
  settings: WorkSettings
  title?: string
  onProgress?: (done: number, total: number) => void
}): Promise<{ screenplay: Screenplay; yaml: string; report: RefReport }> {
  const chapters = segment(args.novel)
  const units: Unit[] = []
  let runningSummary = ''

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i]
    const unit = await convertChapter({
      chapter,
      bible: args.bible,
      runningSummary,
      settings: args.settings,
    })
    units.push(unit)
    args.onProgress?.(i + 1, chapters.length)
    // 最后一章无需再更新摘要（没有下一章了）
    if (i < chapters.length - 1) {
      runningSummary = await updateSummary({ prevSummary: runningSummary, chapter })
    }
  }

  const meta: Meta = {
    title: args.title?.trim() || '未命名剧本',
    genre: [],
    language: 'zh',
    source: { chapter_count: chapters.length },
  }

  const { screenplay, report } = assemble({ bible: args.bible, units, meta })
  return { screenplay, yaml: screenplayToYaml(screenplay), report }
}
