/**
 * 修复 loop(workflow):safeParse 失败 → 把错误回灌给模型让它自修复,最多 N 次。
 * 是"structured output 一定合法"的兜底,贯穿抽 bible / 转场景两处。
 *
 * @see docs/DEVELOPMENT_PLAN.md · Day 1
 */

export interface RepairOptions<T> {
  /** 生成一次原始文本(通常是一次 callLlm)。 */
  generate: (errorFeedback?: string) => Promise<string>
  /** 解析 + 校验;失败返回错误信息,成功返回值。 */
  parse: (raw: string) => { ok: true; value: T } | { ok: false; error: string }
  maxAttempts?: number
}

export async function withRepair<T>(_opts: RepairOptions<T>): Promise<T> {
  // TODO(Day1): 循环 generate→parse,失败把 error 当 feedback 再生成
  throw new Error('withRepair: not implemented')
}
