/**
 * Prompt 模板（workflow）。集中管理，稳定前缀放 system（吃前缀缓存）。
 *
 * @see docs/DAY1_PLAN.md · §2
 */

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
6. 全部用中文。`

/** 抽 bible 的 user：小说正文 +（可选）作者设定文档。 */
export const extractBibleUser = (novel: string, bibleDoc?: string): string =>
  (bibleDoc?.trim() ? `# 作者设定文档（优先采信）\n\n${bibleDoc.trim()}\n\n` : '') +
  `# 小说原文\n\n${novel}`

// ——— 以下 Day 2 ———

/** 单章转场景：注入封闭角色清单，禁止就地造 id。 */
export const convertChapterPrompt = (_args: {
  chapter: string
  bibleDigest: string
  runningSummary: string
}): string => {
  // TODO(Day2)
  throw new Error('convertChapterPrompt: not implemented')
}

/** 滚动摘要：转完一章压缩"到目前为止发生了什么"。 */
export const summaryPrompt = (_args: { prev: string; chapter: string }): string => {
  // TODO(Day2)
  throw new Error('summaryPrompt: not implemented')
}
