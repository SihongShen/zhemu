/**
 * 世界书装配(workflow step):常驻(constant)+ 选择性(keyword 命中)。
 * 常驻部分进 prompt cache 前缀;选择性部分按本章命中的关键词追加。
 *
 * @see docs/DEVELOPMENT_PLAN.md · Day 2
 */
import type { Bible } from '@/lib/schema'

export function assembleWorldInfo(_bible: Bible, _chapterText: string): string {
  // TODO(Day2)
  throw new Error('assembleWorldInfo: not implemented')
}
