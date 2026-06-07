/**
 * 轻量限速 / 门槛，护住公开 demo 里唯一会调 LLM 的「上传→生成」路径。
 * 零依赖、纯内存：单 IP 滑动窗口 + 全局日上限（保命）。
 *
 * ⚠️ serverless 注意：内存计数是「每实例」的，冷启动/多实例会各自计数 —— 这是**尽力而为**的威慑，
 * 足以挡住随手狂点/简单脚本滥用。要强保证（跨实例硬上限）请上 Upstash/Vercel KV，另说。
 * 本地 dev（NODE_ENV !== 'production'）完全不限速，不影响开发。
 *
 * 可用环境变量覆盖默认值：
 *   LLM_RATELIMIT_WINDOW_MS  滑窗毫秒（默认 15 分钟）
 *   LLM_RATELIMIT_PER_IP     单 IP 窗口内最大调用数（默认 100，约够 2 次整本生成）
 *   LLM_DAILY_CAP            全局每日最大调用数（默认 800）
 */
const WINDOW_MS = Number(process.env.LLM_RATELIMIT_WINDOW_MS ?? 15 * 60 * 1000)
const PER_IP = Number(process.env.LLM_RATELIMIT_PER_IP ?? 100)
const DAILY_CAP = Number(process.env.LLM_DAILY_CAP ?? 800)

const hits = new Map<string, number[]>() // ip → 命中时间戳（滑窗内）
let dayBucket = -1
let dayCount = 0

export type RateLimitResult =
  | { ok: true }
  | { ok: false; status: number; error: string; retryAfter?: number }

/** 从请求头取客户端 IP（Vercel 走 x-forwarded-for）。 */
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  return (xff?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown').trim()
}

/** 检查并登记一次调用。dev 不限速。 */
export function checkRateLimit(ip: string): RateLimitResult {
  if (process.env.NODE_ENV !== 'production') return { ok: true }

  const now = Date.now()

  // 全局日上限（跨 IP 保命，防整体被刷爆）
  const today = Math.floor(now / 86_400_000)
  if (today !== dayBucket) {
    dayBucket = today
    dayCount = 0
  }
  if (dayCount >= DAILY_CAP) {
    return { ok: false, status: 429, error: '今日演示额度已用尽，请明天再试或本地运行。' }
  }

  // 单 IP 滑动窗口
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (arr.length >= PER_IP) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - arr[0])) / 1000)
    return { ok: false, status: 429, error: '请求过于频繁，请稍后再试。', retryAfter }
  }

  arr.push(now)
  hits.set(ip, arr)
  dayCount++
  return { ok: true }
}
