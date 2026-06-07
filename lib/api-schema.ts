/**
 * API 请求体的 Zod 校验 schema（边界 parse）。多个 route 复用，避免漂移。
 *
 * @see docs/技术设计文档_工程侧.md · §5.1
 */
import { z } from 'zod'

// 输入长度上限（客户端与服务端共用，避免漂移）。设得很宽松：只挡 MB 级滥用，不卡正常内容。
export const TITLE_MAX = 200
export const CHAPTER_TEXT_MAX = 200_000 // 单章 ~20 万字；再大单次 LLM 也吃不下，应由用户拆分
export const NOVEL_MAX = 2_000_000 // 全本 ~200 万字
export const BIBLE_DOC_MAX = 200_000
export const SUMMARY_MAX = 20_000 // 滚动摘要上限（生成端也会按此截断，见 summary.ts）

/** 一章（对应 lib/pipeline/segment.ts 的 Chapter）。 */
export const ChapterReq = z.object({
  index: z.number().int().positive(),
  title: z.string().max(TITLE_MAX).optional(),
  text: z
    .string()
    .min(1)
    .max(CHAPTER_TEXT_MAX, `单章过长（超 ${CHAPTER_TEXT_MAX / 10000} 万字），请把这一章拆短后再试`),
})

/** 四维度设置（对应 lib/store 的 WorkSettings）。convert 只用到 ②④，但整份校验更稳。 */
export const SettingsReq = z.object({
  lengthForm: z.enum(['feature', 'short', 'series']),
  adaptationMode: z.enum(['faithful', 'balanced', 'free']),
  style: z.enum(['cn-standard', 'hollywood']),
  adaptationBrief: z.string().max(500).optional(),
})
