/**
 * 中式剧本渲染器（cn-standard）。纯函数：Screenplay → 文本。
 * 场次标题「场N 时 内/外 地点」、角色名：台词、画外音标（画外音）。
 * 招牌 demo 的另一半——同一份 YAML，紧凑的中式排版。
 *
 * @see docs/DAY3_PLAN.md · §2.B
 */
import type { Screenplay } from '@/lib/schema'

const INT_EXT: Record<'INT' | 'EXT' | 'INT_EXT', string> = {
  INT: '内',
  EXT: '外',
  INT_EXT: '内外',
}
const TIME: Record<string, string> = {
  DAY: '日',
  NIGHT: '夜',
  DAWN: '黎明',
  DUSK: '黄昏',
  CONTINUOUS: '接前',
  LATER: '稍后',
}
const DELIVERY: Record<'normal' | 'V.O.' | 'O.S.', string> = {
  normal: '',
  'V.O.': '（画外音）',
  'O.S.': '（画外）',
}
const MODE: Record<string, string> = {
  flashback: '（闪回）',
  flashforward: '（闪前）',
  dream: '（梦境）',
  montage: '（蒙太奇）',
}

export function renderCnStandard(s: Screenplay): string {
  const names = new Map(s.bible.characters.map((c) => [c.id, c.name]))
  const nameOf = (id: string) => names.get(id) ?? id

  const out: string[] = [`《${s.meta.title}》`, '']
  let sceneNo = 0

  for (const unit of s.script) {
    for (const scene of unit.scenes) {
      sceneNo++
      const h = scene.heading
      const time = h.time ? `${TIME[h.time] ?? String(h.time)}　` : ''
      const mode = scene.mode !== 'normal' ? (MODE[scene.mode] ?? '') : ''
      // 场1　夜　内　旧书店（闪回）
      out.push(`场${sceneNo}　${time}${INT_EXT[h.int_ext]}　${h.location}${mode}`)

      for (const el of scene.elements) {
        switch (el.type) {
          case 'action':
            out.push(`　　${el.text}`)
            break
          case 'dialogue': {
            const paren = el.parenthetical ? `（${el.parenthetical}）` : ''
            out.push(`${nameOf(el.character)}${DELIVERY[el.delivery]}：${paren}${el.line}`)
            break
          }
          case 'transition':
            out.push(`　　【${el.text}】`)
            break
          case 'shot':
            out.push(`　　〖镜头〗${el.text}`)
            break
        }
      }
      out.push('')
    }
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
}
