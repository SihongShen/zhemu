/**
 * 抽 bible（workflow step）：读小说（+可选作者设定文档）反推世界观/人设/大纲 → 合法 Bible。
 * - 不传 bibleDoc：纯从小说正文反推（smoke 走这条）。
 * - 传 bibleDoc：以作者设定为 grounding，冲突优先采信作者（"双向 bible"）。
 * 走 withRepair 保证 Bible.safeParse() 通过。
 */
import { Bible } from '@/lib/schema'
import { callStructured } from '@/lib/llm/client'
import { withRepair } from '@/lib/llm/repair'
import { extractBibleSystem, extractBibleUser } from '@/lib/llm/prompts'

export async function extractBible(
  novel: string,
  opts?: { bibleDoc?: string },
): Promise<Bible> {
  return withRepair<Bible, string>({
    generate: (feedback) =>
      callStructured({
        system: extractBibleSystem,
        user:
          extractBibleUser(novel, opts?.bibleDoc) +
          (feedback ? `\n\n# 上次输出校验失败，请按以下问题修正后重新输出：\n${feedback}` : ''),
        toolName: 'emit_bible',
        toolDescription: '输出提炼好的世界观 / 角色表 / 大纲',
        schema: Bible,
      }),
    parse: (raw) => {
      // 第一关：JSON 是否合法
      let obj: unknown
      try {
        obj = JSON.parse(raw)
      } catch {
        return { ok: false, error: '输出不是合法 JSON。请只通过 emit_bible 工具输出，不要夹杂多余文本。' }
      }
      // 第二关：是否符合 Bible schema
      const r = Bible.safeParse(obj)
      return r.success
        ? { ok: true, value: r.data }
        : { ok: false, error: 'Bible schema 校验失败，issues:\n' + JSON.stringify(r.error.issues, null, 2) }
    },
  })
}
