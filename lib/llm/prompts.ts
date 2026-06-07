/**
 * Prompt 模板（workflow）。集中管理，稳定前缀放 system（吃前缀缓存）。
 *
 * @see docs/DAY1_PLAN.md · §2
 */
import type { LengthForm, AdaptationMode } from '@/lib/store/project-store'

/** 抽 bible 的 system（稳定、可缓存）。用大白话描述任务，不堆"Story Bible"这类术语。 */
export const extractBibleSystem = `你在为「把小说改编成剧本」做前期准备。请通读给定小说，提炼出三样东西，并用 emit_bible 工具结构化输出：
- 世界观（world）：故事的背景设定、整体基调、主要地点与规则
- 角色表（characters）：有名有戏的角色档案
- 剧情大纲（outline）：若干关键剧情节点

信息来源：
- 若提供了「作者设定文档」，以它为准（grounding）；与小说冲突时优先采信作者；它没写到的再从小说正文推断。
- 没有设定文档时，全部从小说正文反推。
- 不要杜撰原文/设定文档里都没有的内容；拿不准就留空（可选字段都能空）。

硬性规则：
1. 角色 id 用「全小写汉语拼音」slug：char_<拼音>（如 char_linxia、char_guming）。
   - 必须用拼音，禁止用英文单词（"父亲"→ char_fuqin，不要 char_father）。
   - 没有正式名字的角色，用其关系/身份的拼音（父亲→ char_fuqin、店主→ char_dianzhu、独臂老人→ char_laoren）。
   - 全篇唯一；同一角色只一个 id，不同称呼（小名/职称/绰号/外号）放进 aliases，不要另立新角色。
2. world.summary 必填：一两句话概括世界观与整体基调。
   ⚠️ 这段后续每章转换时常驻注入模型，务必精炼、准确、自洽。
3. world.rules 只放「世界设定 / 规则约束」（如"魔法需消耗寿命"、"城市分环、第七环常年人造雨"）。
   - 写实 / 现代都市题材通常没有这类规则，就留空数组 []，不要硬凑。
   - 严禁把「剧情事件」（谁失踪了、某物藏着秘密、谁自愿消失）写进 rules——那些是情节，放 outline，不是世界规则。
4. 主角 role=protagonist，可设 injection=constant（常驻注入）；
   其余角色 injection=selective，keywords 填能触发其出场的词（名字/别称/标志物/口头禅）。
5. outline 每个 beat 的 title 必填，summary 简述这段发生了什么。
6. 除 id 字段（拼音 slug，如 char_linxia）外，其余内容一律用中文。`

/** 抽 bible 的 user：小说正文 +（可选）作者设定文档。 */
export const extractBibleUser = (novel: string, bibleDoc?: string): string =>
  (bibleDoc?.trim() ? `# 作者设定文档（优先采信）\n\n${bibleDoc.trim()}\n\n` : '') +
  `# 小说原文\n\n${novel}`

/** 单章转场景 system（稳定、可缓存；不含本章变量）。 */
export const convertChapterSystem = `你在把小说逐章改编成结构化剧本。把「本章正文」转成一个剧本单元（若干场景 Scene），通过 emit_unit 工具输出。

【封闭角色清单铁律 · 最重要】
- dialogue.character 和 scene.characters_present **只能使用「封闭角色清单」里给出的 id**。
- 忠实/平衡：遇到清单外的新角色，先尽量归入已有角色；实在无法归入，character 用字符串 "__new__:<原文称呼>" 占位，并把该 scene.needs_review 置 true。
- 自由：可引入新角色，同样用 "__new__:<原文称呼>"（系统后续登记）。
- 绝不自己现编一个 char_xxx 的 id。

【场景与元素】
- 每个 scene = heading（int_ext: INT/EXT/INT_EXT；location；time）+ 有序 elements。
- elements 按原文顺序：action（动作/描述）、dialogue（对白：character/line，可选 parenthetical/delivery）、transition（转场）、shot（镜头，短剧体量才多用）。
- 只输出本章的场景。

【按设置调整】
- 体量 feature=标准颗粒度；short=场景更碎、多用 shot；series=可分集（本期按标准处理）。
- 改编自由度 faithful=贴原文不加戏；balanced=适度补白删节；free=可重构加戏影视化。

【文本格式 · 必读，违反会导致整章作废】
- 任何字符串字段（text/line/note 等）内若要引用台词、字句、招牌、账本/纸条上的文字，一律用中文直角引号「」或『』。
- 严禁在字符串内使用半角双引号 " 或半角单引号 '——它们会破坏工具入参 JSON，导致本章解析失败。
- 字符串内不要出现裸换行，需要停顿用句号/逗号断句。

【其它】
- 拿不准/靠推断降级处理的场景，needs_review 置 true，note 写原因。
- 除 id（拼音/英文标识）外，一律中文。`

/**
 * 单章转场景 user。
 * ⚠️ 顺序为吃 DeepSeek 前缀缓存而设计：跨章**稳定**的块（世界观/常驻角色/封闭清单/设置）放最前，
 * **每章变化**的块（选择性角色/前情摘要/本章正文）压到最后。一字之差靠前就会击穿缓存。
 */
export const convertChapterUser = (args: {
  chapterIndex: number
  constantBlock: string
  selectiveBlock: string
  rosterText: string
  runningSummary: string
  settings: { lengthForm: LengthForm; adaptationMode: AdaptationMode; adaptationBrief?: string }
  chapterText: string
}): string => {
  const lengthHint: Record<LengthForm, string> = {
    feature:
      '电影 / 标准长片：场景颗粒度正常，单场可承载较完整的戏剧动作，节奏向银幕叙事靠拢。',
    short:
      '竖屏短剧：场景更碎、节奏更快，多用强冲突钩子开场；优先短场 + shot 镜头切分，对白精炼直给。',
    series:
      '电视剧 / 长剧集：本章按单集片段处理，保留人物关系铺垫与悬念留扣，场景可略展开，允许多线并行的过场。',
  }
  const fidelityHint: Record<AdaptationMode, string> = {
    faithful: '忠实原作（尽量贴原文对白与情节，不加戏）',
    balanced: '平衡（可适度补白、删节）',
    free: '自由改编（可重构、加戏、影视化）',
  }
  return [
    // ——— 稳定块（跨章不变，吃前缀缓存）———
    `# 世界观与设定\n${args.constantBlock}`,
    `# 封闭角色清单（character / characters_present 只能用这里的 id）\n${args.rosterText}`,
    `# 本次设置\n- 体量：${lengthHint[args.settings.lengthForm]}\n- 改编自由度：${fidelityHint[args.settings.adaptationMode]}${
      args.settings.adaptationMode === 'free' && args.settings.adaptationBrief?.trim()
        ? `\n- 用户改编要求（自由改编下请优先满足，但仍遵守上方封闭角色清单规则）：${args.settings.adaptationBrief.trim()}`
        : ''
    }`,
    // ——— 变化块（每章不同，放最后）———
    args.selectiveBlock ? `# 本章相关角色（仅本章登场）\n${args.selectiveBlock}` : '',
    `# 前情摘要\n${args.runningSummary || '（无，这是第一章）'}`,
    `# 本章正文（第 ${args.chapterIndex} 章）\n${args.chapterText}`,
  ]
    .filter(Boolean)
    .join('\n\n')
}

/** 滚动摘要 system。 */
export const summarySystem = `你在维护一部"小说改编剧本"的滚动摘要。根据「已有摘要」和「新一章正文」，输出更新后的摘要。
要求：保留角色状态、未闭合的剧情线、关键转折与伏笔；丢弃对白细节与无关描写；控制在 800 字以内。
只输出更新后的摘要正文，不要任何前后缀、标题或解释。`

/** 滚动摘要 user。 */
export const summaryUser = (prevSummary: string, chapterText: string): string =>
  `# 已有摘要\n${prevSummary || '（无，这是第一章）'}\n\n# 新一章正文\n${chapterText}`
