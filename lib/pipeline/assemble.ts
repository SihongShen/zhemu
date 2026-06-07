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

  // 把一个引用解析成合法 id。返回 isBackfill 标记，让纯空白归一化不被误标 needs_review。
  const resolve = (rawRef: string, sceneId: string): { id: string; isBackfill: boolean } => {
    const ref = rawRef.trim() // LLM 可能带前后空白，先规范化
    if (known.has(ref)) return { id: ref, isBackfill: false }
    const name = ref.startsWith('__new__:')
      ? ref.slice('__new__:'.length).trim() || '未命名角色'
      : ref
    // 按名字/别名归并到任何已有角色（含 bible 真角色），避免模型误用 __new__ 把同名角色拆成两个 id
    const reused = characters.find((c) => c.name === name || c.aliases.includes(name))
    if (reused) return { id: reused.id, isBackfill: true }
    // 生成唯一 id（循环避让，防止与 bible 已有 id 撞）
    let id: string
    do {
      unknownSeq += 1
      id = `char_unknown${unknownSeq}`
    } while (known.has(id))
    characters.push({ id, name, aliases: [], keywords: name ? [name] : [], injection: 'selective' })
    known.add(id)
    report.backfilled.push(`${id}（${name}）@ ${sceneId}`)
    return { id, isBackfill: true }
  }

  const units: Unit[] = structuredClone(args.units)
  for (const unit of units) {
    for (const scene of unit.scenes) {
      let flagged = false
      scene.characters_present = scene.characters_present.map((ref) => {
        const { id, isBackfill } = resolve(ref, scene.id)
        if (isBackfill) flagged = true
        return id // 始终写回归一化后的 id（去空白）
      })
      for (const el of scene.elements) {
        if (el.type === 'dialogue') {
          const { id, isBackfill } = resolve(el.character, scene.id)
          el.character = id // 始终归一化
          if (isBackfill) flagged = true
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
