/**
 * 抽 bible(workflow step):读小说反推世界观/人设/大纲 → 合法 Bible。
 * 走 withRepair 保证 Bible.parse() 通过。
 *
 * @see docs/DEVELOPMENT_PLAN.md · Day 1
 */
import type { Bible } from '@/lib/schema'

export async function extractBible(_novel: string): Promise<Bible> {
  // TODO(Day1): prompts.extractBiblePrompt → withRepair(Bible.safeParse)
  throw new Error('extractBible: not implemented')
}
