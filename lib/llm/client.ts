/**
 * Provider 抽象层（workflow 底座）。OpenAI 兼容端点 → DeepSeek。
 * 结构化输出 = 强制 function calling（单一工具 + tool_choice 锁定）。
 *
 * ⚠️ 只在服务端调用 —— API key 绝不进浏览器，不加 NEXT_PUBLIC_ 前缀。
 *
 * @see docs/DAY1_PLAN.md · §2
 * @see https://api-docs.deepseek.com/zh-cn/
 */
import OpenAI from 'openai'
import { z } from 'zod'

// 懒加载：避免在模块顶层（build/import 时无 key）构造 OpenAI 抛错。
let _client: OpenAI | null = null
function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.LLM_API_KEY
    if (!apiKey) throw new Error('缺少环境变量 LLM_API_KEY（仅服务端使用，勿加 NEXT_PUBLIC_ 前缀）')
    _client = new OpenAI({
      apiKey,
      baseURL: process.env.LLM_BASE_URL ?? 'https://api.deepseek.com',
    })
  }
  return _client
}

const DEFAULT_MODEL = process.env.LLM_MODEL ?? 'deepseek-chat'

/** dev 下打印 DeepSeek 的缓存命中情况，便于排查 cache miss。 */
function logCache(label: string, usage: unknown): void {
  if (process.env.NODE_ENV === 'production' || !usage) return
  const u = usage as {
    prompt_tokens?: number
    prompt_cache_hit_tokens?: number
    prompt_cache_miss_tokens?: number
  }
  const hit = u.prompt_cache_hit_tokens ?? 0
  const prompt = u.prompt_tokens ?? 0
  const miss = u.prompt_cache_miss_tokens ?? Math.max(0, prompt - hit)
  const rate = hit + miss ? Math.round((hit / (hit + miss)) * 100) : 0
  console.log(`[llm:${label}] prompt=${prompt} cache hit/miss=${hit}/${miss} (${rate}% hit)`)
}
// 默认强制非思考：抽取/转换是结构化活，不需要思维链。
// 关了 temperature 才生效、强制 tool_choice 才稳，也避开思考模式 reasoning_content 的多轮回传。
// 想开思考：设 LLM_THINKING=enabled。
const THINKING_ENABLED = process.env.LLM_THINKING === 'enabled'

export interface StructuredCall {
  /** 稳定前缀（schema/指令 + 常驻 world info）。放最前，DeepSeek 自动前缀缓存命中。 */
  system: string
  /** 变化内容（小说正文等）。 */
  user: string
  /** 工具名，如 'emit_bible'。 */
  toolName: string
  toolDescription?: string
  /** 出参 Zod；转成 JSON Schema 当工具入参。 */
  schema: z.ZodType
  model?: string
  maxTokens?: number
}

/** 调一次模型，强制产出结构化结果；返回工具入参的**原始 JSON 字符串**（未解析、未校验，交 repair 的 parse 统一收口）。 */
export async function callStructured(args: StructuredCall): Promise<string> {
  const parameters = z.toJSONSchema(args.schema) as Record<string, unknown>

  // DeepSeek 扩展参数（thinking / reasoning_effort）OpenAI 类型未定义，用交叉类型补上
  const body: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming & {
    thinking?: { type: 'enabled' | 'disabled' }
    reasoning_effort?: 'high' | 'max'
  } = {
    model: args.model ?? DEFAULT_MODEL,
    temperature: 0.2, // 非思考下生效（思考模式会被忽略）
    max_tokens: args.maxTokens ?? 20000, // 留足余量：思考模式 reasoning 也吃 completion 额度
    messages: [
      { role: 'system', content: args.system },
      { role: 'user', content: args.user },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: args.toolName,
          description: args.toolDescription ?? '产出符合 schema 的结构化结果',
          parameters,
        },
      },
    ],
    tool_choice: { type: 'function', function: { name: args.toolName } },
    thinking: { type: THINKING_ENABLED ? 'enabled' : 'disabled' },
  }
  if (THINKING_ENABLED) body.reasoning_effort = 'high'

  const res = await getClient().chat.completions.create(body)
  logCache(args.toolName, res.usage)

  const choice = res.choices[0]
  const call = choice?.message?.tool_calls?.[0]
  if (process.env.NODE_ENV !== 'production') {
    const argLen = call?.type === 'function' ? call.function.arguments.length : 0
    const tail = call?.type === 'function' ? call.function.arguments.slice(-120) : ''
    console.log(
      `[llm:${args.toolName}] finish=${choice?.finish_reason} argLen=${argLen} content=${(choice?.message?.content ?? '').length} reasoning=${((choice?.message as { reasoning_content?: string })?.reasoning_content ?? '').length}`,
    )
    console.log(`[llm:${args.toolName}] args尾部120: ${JSON.stringify(tail)}`)
  }
  if (!call || call.type !== 'function') {
    // 兜底：若 provider 不支持具名 tool_choice，可改用 JSON mode（response_format）
    throw new Error('模型未返回 function tool_call；检查 provider 是否支持 function calling / 具名 tool_choice')
  }
  return call.function.arguments // 原始 JSON 字符串，由调用方在 repair.parse 里解析+校验
}

/** 调一次模型，返回纯文本（无结构化约束）。给滚动摘要等自由文本场景用。 */
export async function callText(args: {
  system: string
  user: string
  model?: string
  maxTokens?: number
}): Promise<string> {
  const body: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming & {
    thinking?: { type: 'enabled' | 'disabled' }
    reasoning_effort?: 'high' | 'max'
  } = {
    model: args.model ?? DEFAULT_MODEL,
    temperature: 0.3,
    max_tokens: args.maxTokens ?? 2000,
    messages: [
      { role: 'system', content: args.system },
      { role: 'user', content: args.user },
    ],
    thinking: { type: THINKING_ENABLED ? 'enabled' : 'disabled' },
  }
  if (THINKING_ENABLED) body.reasoning_effort = 'high'

  const res = await getClient().chat.completions.create(body)
  logCache('text', res.usage)
  return res.choices[0]?.message?.content ?? ''
}
