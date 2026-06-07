/**
 * 修复 loop（workflow）：safeParse 失败 → 把错误回灌给模型让它自修复，最多 N 次。
 * structured output 一定合法的兜底，贯穿抽 bible / 转场景两处。
 */

export interface RepairOptions<T, R = unknown> {
  /** 生成一次结果（通常是一次 callStructured）；可带上次错误反馈。 */
  generate: (errorFeedback?: string) => Promise<R>
  /** 解析 + 校验；失败返回错误信息，成功返回值。 */
  parse: (raw: R) => { ok: true; value: T } | { ok: false; error: string }
  /** 最大额外修复次数（不含首次），默认 2。 */
  maxAttempts?: number
}

export async function withRepair<T, R = unknown>(opts: RepairOptions<T, R>): Promise<T> {
  const max = opts.maxAttempts ?? 2
  let feedback: string | undefined
  let lastError = ''

  for (let attempt = 0; attempt <= max; attempt++) {
    const raw = await opts.generate(feedback)
    const result = opts.parse(raw)
    if (result.ok) return result.value
    lastError = result.error
    feedback = result.error // 回灌给下一次生成
  }

  throw new Error(
    `withRepair: ${max} 次额外修复（共尝试 ${max + 1} 次）仍未通过校验。最后错误：${lastError}`,
  )
}
