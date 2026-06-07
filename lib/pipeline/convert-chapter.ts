/**
 * 单章转场景（workflow step · 核心）。注入封闭角色清单，禁止就地造 id。
 * 按 ② lengthForm 调颗粒度、按 ④ adaptationMode 调忠实度。
 * id（unit/scene）转换后确定性赋值，不依赖模型，避免跨章撞 id。
 *
 * @see docs/DAY2_PLAN.md · §2
 */
import { Unit } from '@/lib/schema'
import type { Bible } from '@/lib/schema'
import type { WorkSettings } from '@/lib/store/project-store'
import type { Chapter } from '@/lib/pipeline/segment'
import { callStructured } from '@/lib/llm/client'
import { withRepair } from '@/lib/llm/repair'
import { assembleWorldInfo } from '@/lib/pipeline/world-info'
import { convertChapterSystem, convertChapterUser } from '@/lib/llm/prompts'

export async function convertChapter(args: {
  chapter: Chapter
  bible: Bible
  runningSummary: string
  settings: WorkSettings
}): Promise<Unit> {
  const wi = assembleWorldInfo(args.bible, args.chapter.text)

  const unit = await withRepair<Unit, string>({
    generate: (feedback) =>
      callStructured({
        system: convertChapterSystem,
        user:
          convertChapterUser({
            chapterIndex: args.chapter.index,
            constantBlock: wi.constantBlock,
            selectiveBlock: wi.selectiveBlock,
            rosterText: wi.rosterText,
            runningSummary: args.runningSummary,
            settings: args.settings,
            chapterText: args.chapter.text,
          }) + (feedback ? `\n\n# 上次输出校验失败，请按以下问题修正：\n${feedback}` : ''),
        toolName: 'emit_unit',
        toolDescription: '输出本章的结构化剧本单元（场景数组）',
        schema: Unit,
      }),
    parse: (raw) => {
      let obj: unknown
      try {
        obj = JSON.parse(raw)
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
          const msg = e instanceof Error ? e.message : String(e)
          const m = msg.match(/position (\d+)/)
          const pos = m ? Number(m[1]) : -1
          console.error(`[convert] JSON.parse 失败 (len=${raw.length}):`, msg)
          if (pos >= 0) {
            console.error('[convert] 出错处±80:', JSON.stringify(raw.slice(Math.max(0, pos - 80), pos + 80)))
          }
        }
        return {
          ok: false,
          error:
            '输出不是合法 JSON——最常见原因是 text/line 里用了半角双引号 " 当引文。请把所有台词/字句引用改成中文直角引号「」，不要在字符串内使用半角 " 或 \'，确保整体是合法 JSON，只通过 emit_unit 工具输出。',
        }
      }
      // unit/scene 的 id 下游会被确定性覆盖（unit_chN / sc_N_xx）；
      // 这里给缺失/空的 id 补占位，避免模型漏填 id 触发无谓 repair。
      if (obj && typeof obj === 'object') {
        const u = obj as { id?: unknown; scenes?: unknown }
        if (typeof u.id !== 'string' || !u.id.trim()) u.id = 'tmp_unit'
        if (Array.isArray(u.scenes)) {
          u.scenes.forEach((s, i) => {
            if (s && typeof s === 'object') {
              const sc = s as { id?: unknown }
              if (typeof sc.id !== 'string' || !sc.id.trim()) sc.id = `tmp_sc_${i + 1}`
            }
          })
        }
      }
      const r = Unit.safeParse(obj)
      return r.success
        ? { ok: true, value: r.data }
        : { ok: false, error: 'Unit schema 校验失败，issues:\n' + JSON.stringify(r.error.issues, null, 2) }
    },
  })

  // 确定性赋 id / 溯源：保证跨章唯一，不依赖模型
  unit.id = `unit_ch${args.chapter.index}`
  unit.source_chapter = args.chapter.index
  // 始终用分章得到的章节标题，保证 5 章标题格式统一（不放任模型各写各的）
  if (args.chapter.title) unit.title = args.chapter.title
  unit.scenes.forEach((s, i) => {
    s.id = `sc_${args.chapter.index}_${String(i + 1).padStart(2, '0')}`
  })

  return unit
}
