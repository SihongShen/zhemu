/**
 * 组装(workflow step):units → Screenplay,并做引用完整性校验。
 * 检查每个 dialogue.character / characters_present ∈ bible.characters[].id,违反则修复/回填。
 *
 * @see docs/DEVELOPMENT_PLAN.md · Day 2
 */
import type { Bible, Unit, Screenplay } from '@/lib/schema'

export function assemble(_args: { bible: Bible; units: Unit[] }): Screenplay {
  // TODO(Day2): 拼装 + 引用完整性校验
  throw new Error('assemble: not implemented')
}
