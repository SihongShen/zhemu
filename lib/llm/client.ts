/**
 * Provider 抽象层(workflow 底座)。
 * 只接一家(如 Claude),但留抽象口;统一 JSON 输出 + prompt caching 稳定前缀。
 *
 * ⚠️ 只在服务端调用 —— API key 绝不进浏览器,不加 NEXT_PUBLIC_ 前缀。
 *
 * @see docs/DEVELOPMENT_PLAN.md · Day 1
 */

export interface LlmCallOptions {
  /** 稳定前缀(schema/指令 + 常驻 world info + 核心 bible),放最前走 prompt cache。 */
  cachePrefix?: string
  /** 变化的用户内容(本章正文等)。 */
  user: string
  system?: string
}

/** 调一次模型,返回原始文本(由上层负责 JSON.parse + Zod 校验)。 */
export async function callLlm(_opts: LlmCallOptions): Promise<string> {
  // TODO(Day1): 接 @anthropic-ai/sdk,带 cache_control 前缀
  throw new Error('callLlm: not implemented')
}
