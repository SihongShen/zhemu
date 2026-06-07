/**
 * 世界书装配（workflow step）：常驻（constant）+ 选择性（keyword 命中）。
 * 关键：拆成「跨章稳定」与「每章变化」两块，让 convert prompt 能吃 DeepSeek 前缀缓存。
 */
import type { Bible, CharacterEntry } from '@/lib/schema'

export interface WorldInfo {
  /** 世界观 + 常驻角色详情：跨章**稳定**，放 prompt 最前部吃前缀缓存。 */
  constantBlock: string
  /** 本章 keyword 命中的选择性角色详情：**每章变**，放 prompt 后部。 */
  selectiveBlock: string
  /** 全角色 id+name+aliases 清单：封闭引用源，稳定。 */
  rosterText: string
  rosterIds: string[]
}

const fmtChar = (c: CharacterEntry): string => {
  const alias = c.aliases.length ? `，又称 ${c.aliases.join('/')}` : ''
  return `- ${c.id}（${c.name}${alias}）：${c.description ?? ''}`
}

export function assembleWorldInfo(bible: Bible, chapterText: string): WorldInfo {
  const w = bible.world
  const worldLines = [
    `世界观：${w.summary}`,
    w.time_period ? `时代：${w.time_period}` : '',
    w.tone ? `基调：${w.tone}` : '',
    w.locations.length ? `主要地点：${w.locations.join('、')}` : '',
    w.rules.length ? `世界规则：\n- ${w.rules.join('\n- ')}` : '',
  ].filter(Boolean)

  // 常驻角色（injection=constant）：跨章恒注入
  const constantChars = bible.characters.filter((c) => c.injection === 'constant')
  // 选择性角色：仅当本章命中（名字/别称/keyword）才注入详情
  const selectiveMatched = bible.characters.filter(
    (c) =>
      c.injection !== 'constant' &&
      (chapterText.includes(c.name) ||
        c.aliases.some((a) => a && chapterText.includes(a)) ||
        c.keywords.some((k) => k && chapterText.includes(k))),
  )

  const constantBlock = [
    worldLines.join('\n'),
    constantChars.length ? `\n常驻角色：\n${constantChars.map(fmtChar).join('\n')}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const selectiveBlock = selectiveMatched.map(fmtChar).join('\n')

  const rosterText = bible.characters
    .map((c) => `- ${c.id} = ${c.name}${c.aliases.length ? `（${c.aliases.join('/')}）` : ''}`)
    .join('\n')

  return { constantBlock, selectiveBlock, rosterText, rosterIds: bible.characters.map((c) => c.id) }
}
