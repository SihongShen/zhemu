/**
 * Zod 真源（single source of truth）= Schema 设计文档 §5。
 * 三层共享：workflow 做 structured output 校验、后端定 API 契约、前端实时校验。
 *
 * id slug 约定：char_<拼音> / sc_<序号> / unit_ch<章号>
 * @see docs/剧本YAML_Schema设计文档.md · §5
 */
import { z } from 'zod'

// ---- 枚举 ----
// 全部用剧本行业术语的英文值（中式/好莱坞 renderer 都从这套语义出发，再各自映射成中文/英文排版）。

/** 场景内外景。出现在场景标题（scene heading），决定"INT./EXT."前缀。 */
export const IntExt = z.enum([
  'INT', //     内景：室内（房间、车内、办公室…）
  'EXT', //     外景：室外（街道、山野、天台…）
  'INT_EXT', // 内外景：一场戏同时跨内外，如车内拍到车外、门口内外连拍
])

/** 场景时间。场景标题里"日/夜"那部分；除具体时段外还有两个"承接"值。 */
export const TimeOfDay = z.enum([
  'DAY', //        白天
  'NIGHT', //      夜晚
  'DAWN', //       黎明 / 拂晓
  'DUSK', //       黄昏 / 傍晚
  'CONTINUOUS', // 接续：与上一场时间无缝连续，不另起计时（连贯动作横跨多场）
  'LATER', //      稍后：同一地点、时间往后推了一段（无需明说多久）
])

/** 角色定位。用于戏量分析、世界书注入优先级（主角通常常驻注入）。 */
export const CharacterRole = z.enum([
  'protagonist', // 主角 / 主人公
  'antagonist', //  反派 / 主要对立面
  'supporting', //  配角：有名有戏、推动剧情
  'minor', //       龙套 / 次要：出场少、功能性角色
])

/** 世界书注入策略（决定该角色信息何时进 prompt，控制 context 预算）。 */
export const Injection = z.enum([
  'constant', //  常驻：每章/每次转换都注入（主角、核心世界观，防止跨章丢设定）
  'selective', // 选择性：仅当本章命中其 keywords 时才注入（省 context，默认值）
])

/** 台词呈现方式（影视/剧本术语，决定 renderer 怎么标注这句台词）。 */
export const Delivery = z.enum([
  'normal', // 正常对白：角色在场、在画面内出声
  'V.O.', //   Voice Over 画外音/旁白：叙述者或内心独白的声音，不属于场景现场（如回忆旁白）
  'O.S.', //   Off Screen 画外：角色在该场景内、但不在画面里出声（如隔壁房间喊话）
])

/** 场景叙事模式（非顺叙时标注，renderer 可据此加"闪回/梦境"等提示）。 */
export const SceneMode = z.enum([
  'normal', //       正常顺叙
  'flashback', //    闪回：插入过去发生的场景
  'flashforward', // 闪前 / 预叙：插入未来的场景
  'dream', //        梦境 / 幻想
  'montage', //      蒙太奇：一组快速剪辑、压缩时间的场景片段
])

// ---- Bible 层 ----
// "故事圣经"：世界观 + 角色表 + 大纲。框定全局，既是作者输入也可由 AI 反推。
// 它是 pipeline 跨章一致性的数据源，也是"世界书注入"的内容来源。

/** 世界观设定。world.summary 常驻注入到每章转换 prompt，保证基调/规则不跨章丢失。 */
export const WorldSetting = z.object({
  summary: z.string().trim().min(1), //      一两句话概括世界观/基调，**常驻注入**（每章都进 prompt）；非空是硬约束，空则触发 repair
  time_period: z.string().optional(), //     时代/年代（如"民国"、"近未来 2090"），影响场景与道具
  locations: z.array(z.string()).default([]), // 主要地点清单，供场景标题 location 参考
  rules: z.array(z.string()).default([]), //     世界规则/设定约束（如"魔法需消耗寿命"），防止改编跑飞
  tone: z.string().optional(), //            整体基调（如"悬疑压抑"、"轻松温情"）
})

/**
 * 角色表条目——每个 = 一个"世界书 entry"。
 * id 是全局唯一权威：剧本里 dialogue.character / scene.characters_present 只能引用这里已存在的 id。
 */
export const CharacterEntry = z.object({
  id: z.string(), //                         稳定引用标识，用 char_<拼音> slug（如 char_linxia），**全篇唯一**
  name: z.string(), //                       角色正式名
  aliases: z.array(z.string()).default([]), // 别称/小名/称谓（"夏夏"、"林经理"），归到同一 id 下，防止重复造角色
  role: CharacterRole.optional(), //         角色定位（见 CharacterRole 枚举）
  description: z.string().optional(), //     人设简述（外形/性格/动机）
  keywords: z.array(z.string()).default([]), // **选择性注入触发词**：本章命中其一才把该角色注入 prompt（名字/别称/标志物）
  injection: Injection.default('selective'), // 注入策略（见 Injection 枚举）；主角通常设 constant
})
export type CharacterEntry = z.infer<typeof CharacterEntry>

/** 大纲节点（beat）。一个关键剧情节点，用于把控全局结构与跨章节奏。 */
export const Beat = z.object({
  id: z.string(), //                         beat id（如 beat_1）
  title: z.string(), //                      节点标题（如"雨夜初遇"）
  summary: z.string().optional(), //         节点简述：这一段发生了什么
  structure_tag: z.string().optional(), //   结构标签（如"inciting_incident 激励事件"、"midpoint 中点"），可空
  chapter_range: z.tuple([z.number(), z.number()]).optional(), // 覆盖的章节区间 [起, 止]，溯源用
})

/** Bible 根：Day 1 的产出目标。AI 读完小说反推出这一坨，交作者确认后供 Day 2 转换使用。 */
export const Bible = z
  .object({
    world: WorldSetting, //                  世界观（必填）
    characters: z.array(CharacterEntry), //  角色表（必填，id 是后续引用的权威源）
    outline: z.array(Beat).default([]), //   大纲（可空，但建议给几个 beat）
  })
  // 角色 id「全篇唯一」是核心不变量（id 是引用权威源）：收进 schema，
  // 让 withRepair 能在出现重复 id 时直接触发修复，而不是放进下游再炸。
  .superRefine((bible, ctx) => {
    const seen = new Set<string>()
    bible.characters.forEach((c, i) => {
      if (seen.has(c.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['characters', i, 'id'],
          message: `角色 id 重复：${c.id}（每个角色必须唯一，同一人不同称呼请放进 aliases）`,
        })
      }
      seen.add(c.id)
    })
  })
export type Bible = z.infer<typeof Bible>

// ---- 场景元素（discriminated union）----
// 一个场景由若干"元素"按顺序组成（动作/对白/转场/镜头）。用 type 字段做判别联合：
// 每种元素结构不同，但都带 type 字面量，校验/渲染时按 type 分派，比"一个大 optional 对象"清晰得多。

/** 动作/描述行：场景里的叙述与动作（"她推开门，雨灌进来"）。 */
export const ActionElement = z.object({
  type: z.literal('action'),
  text: z.string(),
})

/** 对白：一句台词。character 必须引用 bible 里已存在的角色 id（封闭引用，转换时强约束）。 */
export const DialogueElement = z.object({
  type: z.literal('dialogue'),
  character: z.string(), //                 -> CharacterEntry.id（不可现编，引用完整性校验会查）
  parenthetical: z.string().optional(), //  括号提示，台词前的语气/动作（如"（小声地）"）
  delivery: Delivery.default('normal'), //  呈现方式（见 Delivery 枚举：正常/画外音/画外）
  line: z.string(), //                      台词正文
})

/** 转场：场景之间的切换标记（"切"、"CUT TO"、"淡出"）。 */
export const TransitionElement = z.object({
  type: z.literal('transition'),
  text: z.string(), // 转场提示（切 / CUT TO / 淡出…）
})

/** 镜头/分镜：短剧/分镜稿常用，描述机位或镜头语言（"特写：颤抖的手"）。 */
export const ShotElement = z.object({
  type: z.literal('shot'),
  text: z.string(), // 镜头/分镜（② 体量=短剧时更常出现）
})

/** 元素判别联合：按 type 分派。Zod 的 discriminatedUnion 会按 type 字段精确校验对应结构。 */
export const Element = z.discriminatedUnion('type', [
  ActionElement,
  DialogueElement,
  TransitionElement,
  ShotElement,
])
export type Element = z.infer<typeof Element>

// ---- 场景 / 单元 ----

/** 场景标题（scene heading）：渲染成"INT. 旧书店 - NIGHT"这类首行。 */
export const SceneHeading = z.object({
  int_ext: IntExt, //                       内/外景（见 IntExt 枚举）
  location: z.string(), //                  地点（"旧书店"），最好取自 world.locations
  time: z.union([TimeOfDay, z.string()]).optional(), // 时间：枚举值优先，特殊情况允许自由字符串
})

/** 场景：剧本最小叙事单元。由 heading + 一串有序 elements 组成。 */
export const Scene = z.object({
  id: z.string(), //                        场景 id（如 sc_001）
  heading: SceneHeading,
  mode: SceneMode.default('normal'), //     叙事模式（见 SceneMode 枚举：顺叙/闪回/梦境/蒙太奇…）
  synopsis: z.string().optional(), //       本场一句话梗概，便于人快速浏览
  characters_present: z.array(z.string()).default([]), // 本场出场角色 id 列表（戏量统计 + 世界书选择性注入直接读它）
  elements: z.array(Element), //            场景内容：动作/对白/转场/镜头按顺序排列（空场景由 assemble 清理，不在此硬失败）
  needs_review: z.boolean().default(false), // 转换时靠推断/降级处置（如拿不准角色）则置 true，提示人工复核
  note: z.string().optional(), //           为什么需复核 / 降级原因
})
export type Scene = z.infer<typeof Scene>

/** 单元（unit）：通常对应小说的一章，是逐章转换的产物，内含若干场景。 */
export const Unit = z.object({
  id: z.string(), //                        单元 id，用 unit_ch<章号>（如 unit_ch1）
  source_chapter: z.number().optional(), // 溯源：对应原文第几章，编辑/重跑可定位
  title: z.string().optional(), //          单元标题（多取自章节标题）
  summary: z.string().optional(), //        该章的滚动摘要："到目前为止发生了什么"，传给下一章保持连贯
  scenes: z.array(Scene), //                逐场景；空场景/空章由 assemble 清理，不在此硬失败（避免整本中断）
})
export type Unit = z.infer<typeof Unit>

// ---- 元信息 / 根 ----

/** 剧本元信息（片名、类型、来源等）。 */
export const Meta = z.object({
  title: z.string(), //                     剧本片名
  logline: z.string().optional(), //        一句话故事梗概（卖点式）
  genre: z.array(z.string()).default([]), // 类型标签（"悬疑"、"爱情"）
  // 注：target_format 只是元信息里记一笔"默认制式"，真正渲染由 renderer 决定（① 制式是自由下游，见 README §四维度）
  target_format: z.enum(['cn-standard', 'hollywood', 'short-drama', 'stage']).optional(),
  language: z.string().default('zh'), //    语言，默认中文
  source: z //                              来源信息：从哪部小说改编而来
    .object({
      novel_title: z.string().optional(),
      author: z.string().optional(),
      chapter_count: z.number().optional(), // 原文章节数（segment 时数出来）
    })
    .optional(),
})
export type Meta = z.infer<typeof Meta>

/**
 * 根：一份完整剧本 = 元信息 + Bible + 逐章单元。
 * version 锁定 schema 版本；script 是逐章转换组装出来的 Unit 数组。
 * 这是 Day 2 的最终产物，再由 js-yaml 序列化成给作者读写的 YAML。
 */
export const Screenplay = z.object({
  version: z.literal('0.1'), //             schema 版本号，演进时据此迁移
  meta: Meta,
  bible: Bible, //                          整本共享的世界书（id 权威源）
  script: z.array(Unit), //                 逐章单元，有序
})
export type Screenplay = z.infer<typeof Screenplay>
