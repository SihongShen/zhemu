/**
 * 分章 / 分场(workflow step)。有显式章节按章切,无章节按长度切。
 *
 * @see docs/DEVELOPMENT_PLAN.md · Day 1
 */

export interface Chapter {
  index: number // 1-based,用于 unit_ch<章号>
  title?: string
  text: string
}

export function segment(_novel: string): Chapter[] {
  // TODO(Day1)
  throw new Error('segment: not implemented')
}
