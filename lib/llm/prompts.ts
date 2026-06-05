/**
 * Prompt 模板(workflow)。集中管理,便于调参与做 prompt cache 前缀。
 *
 * @see docs/DEVELOPMENT_PLAN.md · Day 1 / Day 2
 */

/** 抽 bible:读小说反推世界观/人设/大纲。 */
export const extractBiblePrompt = (_novel: string): string => {
  // TODO(Day1)
  throw new Error('extractBiblePrompt: not implemented')
}

/** 单章转场景:注入封闭角色清单,禁止就地造 id。 */
export const convertChapterPrompt = (_args: {
  chapter: string
  bibleDigest: string
  runningSummary: string
}): string => {
  // TODO(Day2)
  throw new Error('convertChapterPrompt: not implemented')
}

/** 滚动摘要:转完一章压缩"到目前为止发生了什么"。 */
export const summaryPrompt = (_args: { prev: string; chapter: string }): string => {
  // TODO(Day2)
  throw new Error('summaryPrompt: not implemented')
}
