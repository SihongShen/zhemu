/**
 * 组装（workflow step）：units → Screenplay，并做引用完整性校验。
 * 检查每个 dialogue.character / characters_present ∈ bible.characters[].id；
 * 未知引用（含 "__new__:称呼" 占位）→ 回填 stub 角色，并把场景标 needs_review。
 *
 * @see docs/DAY2_PLAN.md · §2
 */
import { type Bible, type Unit, type Screenplay, type Meta, type CharacterEntry } from '@/lib/schema'

export interface RefReport {
  backfilled: string[] // 回填的角色：`id（名字）@ 场景`
  flaggedScenes: string[] // 因回填被标记复核的 scene id
}

export function assemble(args: { bible: Bible; units: Unit[]; meta: Meta }): {
  screenplay: Screenplay
  report: RefReport
} {
  const characters: CharacterEntry[] = args.bible.characters.map((c) => ({ ...c }))
  const known = new Set(characters.map((c) => c.id))
  const report: RefReport = { backfilled: [], flaggedScenes: [] }
  let unknownSeq = 0

  // 把一个引用解析成合法 id；未知则回填一个 stub 角色（同名复用）
  const resolve = (ref: string, sceneId: string): string => {
    if (known.has(ref)) return ref
    const name = ref.startsWith('__new__:')
      ? ref.slice('__new__:'.length).trim() || '未命名角色'
      : ref
    const reused = characters.find((c) => c.id.startsWith('char_unknown') && c.name === name)
    if (reused) return reused.id
    unknownSeq += 1
    const id = `char_unknown${unknownSeq}`
    characters.push({ id, name, aliases: [], keywords: name ? [name] : [], injection: 'selective' })
    known.add(id)
    report.backfilled.push(`${id}（${name}）@ ${sceneId}`)
    return id
  }

  const units: Unit[] = structuredClone(args.units)
  for (const unit of units) {
    for (const scene of unit.scenes) {
      let flagged = false
      scene.characters_present = scene.characters_present.map((ref) => {
        const id = resolve(ref, scene.id)
        if (id !== ref) flagged = true
        return id
      })
      for (const el of scene.elements) {
        if (el.type === 'dialogue') {
          const id = resolve(el.character, scene.id)
          if (id !== el.character) {
            el.character = id
            flagged = true
          }
        }
      }
      if (flagged) {
        scene.needs_review = true
        scene.note = (scene.note ? scene.note + '；' : '') + '存在自动回填的角色引用，请复核'
        report.flaggedScenes.push(scene.id)
      }
    }
  }

  const screenplay: Screenplay = {
    version: '0.1',
    meta: args.meta,
    bible: { ...args.bible, characters },
    script: units,
  }
  return { screenplay, report }
}
