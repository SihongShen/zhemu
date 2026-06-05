/**
 * 中式剧本渲染器(cn-standard)。纯函数:Screenplay → 文本,不依赖框架,前端可直接调。
 * 招牌 demo 的一半 —— 同一份 YAML 切到不同制式。
 *
 * @see docs/DEVELOPMENT_PLAN.md · Day 3
 */
import type { Screenplay } from '@/lib/schema'

export function renderCnStandard(_screenplay: Screenplay): string {
  // TODO(Day3)
  throw new Error('renderCnStandard: not implemented')
}
