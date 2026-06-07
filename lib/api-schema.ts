/**
 * API 请求体的 Zod 校验 schema（边界 parse）。多个 route 复用，避免漂移。
 *
 * @see docs/技术设计文档_工程侧.md · §5.1
 */
import { z } from 'zod'

/** 一章（对应 lib/pipeline/segment.ts 的 Chapter）。 */
export const ChapterReq = z.object({
  index: z.number().int().positive(),
  title: z.string().max(200).optional(),
  text: z.string().min(1).max(50_000), // 单章上限，挡住超长输入直怼 LLM
})

/** 四维度设置（对应 lib/store 的 WorkSettings）。convert 只用到 ②④，但整份校验更稳。 */
export const SettingsReq = z.object({
  lengthForm: z.enum(['feature', 'short', 'series']),
  adaptationMode: z.enum(['faithful', 'balanced', 'free']),
  style: z.enum(['cn-standard', 'hollywood']),
  adaptationBrief: z.string().max(500).optional(),
})
