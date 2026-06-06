/**
 * 好莱坞剧本渲染器（hollywood）。纯函数：Screenplay → 文本。
 * slug 行大写、角色名居中缩进、(V.O.)/(O.S.)、CUT TO 右对齐。
 * 招牌 demo 的一半——同一份 YAML 切到不同制式。
 *
 * @see docs/DAY3_PLAN.md · §2.B
 */
import type { Screenplay } from '@/lib/schema'

const INT_EXT: Record<'INT' | 'EXT' | 'INT_EXT', string> = {
  INT: 'INT.',
  EXT: 'EXT.',
  INT_EXT: 'INT./EXT.',
}
const TIME: Record<string, string> = {
  DAY: 'DAY',
  NIGHT: 'NIGHT',
  DAWN: 'DAWN',
  DUSK: 'DUSK',
  CONTINUOUS: 'CONTINUOUS',
  LATER: 'LATER',
}
const DELIVERY: Record<'normal' | 'V.O.' | 'O.S.', string> = {
  normal: '',
  'V.O.': ' (V.O.)',
  'O.S.': ' (O.S.)',
}
const MODE: Record<string, string> = {
  flashback: ' — FLASHBACK',
  flashforward: ' — FLASHFORWARD',
  dream: ' — DREAM',
  montage: ' — MONTAGE',
}
// 常见中文转场 → 好莱坞术语（宽松匹配，兼容"切/切至/切至："等变体）
function toHollywoodTransition(text: string): string {
  const t = text.replace(/[\s：:　]/g, '')
  if (t.includes('淡出')) return 'FADE OUT.'
  if (t.includes('淡入')) return 'FADE IN:'
  if (t.includes('切')) return 'CUT TO:'
  if (t.includes('化')) return 'DISSOLVE TO:'
  return text.toUpperCase()
}

const indent = (s: string, n: number): string => ' '.repeat(n) + s
const rightAlign = (s: string, width = 58): string => ' '.repeat(Math.max(1, width - s.length)) + s

export function renderHollywood(s: Screenplay): string {
  const names = new Map(s.bible.characters.map((c) => [c.id, c.name]))
  const nameOf = (id: string) => names.get(id) ?? id

  const out: string[] = [s.meta.title.toUpperCase(), '']
  let sceneNo = 0

  for (const unit of s.script) {
    for (const scene of unit.scenes) {
      sceneNo++
      const h = scene.heading
      const time = h.time ? ` - ${(TIME[h.time] ?? String(h.time)).toUpperCase()}` : ''
      const mode = scene.mode !== 'normal' ? (MODE[scene.mode] ?? '') : ''
      out.push(`${sceneNo}.  ${INT_EXT[h.int_ext]} ${h.location.toUpperCase()}${time}${mode}`, '')

      for (const el of scene.elements) {
        switch (el.type) {
          case 'action':
            out.push(el.text, '')
            break
          case 'dialogue': {
            out.push(indent(nameOf(el.character).toUpperCase() + DELIVERY[el.delivery], 22))
            if (el.parenthetical) out.push(indent(`(${el.parenthetical})`, 18))
            out.push(indent(el.line, 10), '')
            break
          }
          case 'transition':
            out.push(rightAlign(toHollywoodTransition(el.text)), '')
            break
          case 'shot':
            out.push(el.text.toUpperCase(), '')
            break
        }
      }
    }
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
}
